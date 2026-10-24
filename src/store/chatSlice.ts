/**
 * @file src/store/chatSlice.ts
 * @description Central Redux slice for chat state, multi-turn threads, streaming tokens,
 * file attachments, and LangGraph agent execution states.
 *
 * ARCHITECTURAL CONCEPTS & INTERVIEW TALKING POINTS:
 *
 * 1. UNIDIRECTIONAL DATA FLOW:
 *    - User types a prompt -> ChatInput calls `dispatch(sendMessageThunk(...))`
 *    - Thunk dispatches pending action -> Reducer optimistically appends User message
 *      and initializes an Assistant message placeholder with status 'streaming'.
 *    - Thunk calls the streaming API service with an AbortSignal.
 *    - As SSE chunks arrive, thunk dispatches synchronous `appendStreamChunk` actions.
 *    - MessageItem component subscribes to `messages[threadId]` via `useAppSelector`
 *      and re-renders token by token with zero input lag.
 *
 * 2. STRICT SERIALIZABILITY:
 *    - Redux state contains ONLY plain serializable JSON structures (strings, numbers, booleans, arrays, records).
 *    - Non-serializable objects (like `AbortController`, `ReadableStreamDefaultReader`, or raw browser `File` objects)
 *      are strictly stored outside Redux in a module-level reference map (`activeAbortControllers`).
 *
 * 3. ROBUST ERROR RECOVERY (rejectWithValue):
 *    - Network drops, HTTP 500s, or rate limits do not crash the app or produce silent drops.
 *    - The thunk catches errors and calls `thunkAPI.rejectWithValue(errorPayload)`.
 *    - The `extraReducers` `rejected` case marks the assistant message as `failed` and saves
 *      the error diagnostic.
 *    - The UI displays a retry button that triggers `regenerateMessageThunk`.
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { parseFileForUpload, streamChatResponse } from '../services/api';
import {
  ApiErrorState,
  ChatMessage,
  FileAttachment,
  GeneratedFile,
  LangGraphNode,
  ThreadMetadata,
} from '../types/chat';

/**
 * Module-level storage for non-serializable AbortControllers.
 * Keyed by threadId so each thread's stream can be cancelled independently.
 */
const activeAbortControllers = new Map<string, AbortController>();

/**
 * Redux Chat Slice State shape.
 * Kept strictly serializable for persistence and predictability.
 */
export interface ChatState {
  /** Record of all conversation threads keyed by threadId */
  threads: Record<string, ThreadMetadata>;
  /** Record of message lists keyed by threadId */
  messages: Record<string, ChatMessage[]>;
  /** Currently selected thread ID */
  activeThreadId: string | null;
  /** Whether any thread is currently streaming tokens from the backend */
  isStreaming: boolean;
  /** ID of the message currently being streamed */
  currentStreamingMessageId: string | null;
  /** Current active node in the LangGraph agent state machine */
  activeLangGraphNode: LangGraphNode;
  /** Active global or stream error state */
  error: ApiErrorState | null;
  /** Testing toggle: when enabled, simulates backend 500 failure for interview demo */
  simulateError: boolean;
  /** Files staged in the chat input awaiting submission */
  stagedAttachments: FileAttachment[];
  /** Whether files are currently being validated/parsed */
  isUploadingFiles: boolean;
}

/** Initial mock thread to ensure the interview demo starts with an active context */
const DEFAULT_THREAD_ID = 'thread_welcome_01';
const NOW = Date.now();

const initialThreads: Record<string, ThreadMetadata> = {
  [DEFAULT_THREAD_ID]: {
    id: DEFAULT_THREAD_ID,
    title: 'Financial Analysis & Q3 Planning',
    createdAt: NOW - 3600000,
    updatedAt: NOW,
    messageCount: 2,
  },
};

const initialMessages: Record<string, ChatMessage[]> = {
  [DEFAULT_THREAD_ID]: [
    {
      id: 'msg_welcome_user',
      threadId: DEFAULT_THREAD_ID,
      role: 'user',
      content: 'Can you analyze our financial performance and generate an executive summary with a downloadable CSV?',
      status: 'complete',
      timestamp: NOW - 3500000,
    },
    {
      id: 'msg_welcome_assistant',
      threadId: DEFAULT_THREAD_ID,
      role: 'assistant',
      content:
        'I have analyzed your revenue and expense records. Operating margins expanded by 4.2% quarter-over-quarter driven by cloud infrastructure optimizations.\n\nI have generated a clean spreadsheet summarizing the quarterly breakdown below:',
      status: 'complete',
      timestamp: NOW - 3400000,
      generatedFiles: [
        {
          id: 'gen_file_q3_report',
          filename: 'Q3_Financial_Summary.csv',
          fileType: 'csv',
          mimeType: 'text/csv',
          sizeBytes: 1420,
          downloadUrl: '#',
          previewSnippet: 'Quarter,Revenue,Expenses,Margin\nQ1,$1,200,000,$900,000,25.0%\nQ2,$1,450,000,$1,020,000,29.6%\nQ3,$1,800,000,$1,190,000,33.8%',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ],
};

const initialState: ChatState = {
  threads: initialThreads,
  messages: initialMessages,
  activeThreadId: DEFAULT_THREAD_ID,
  isStreaming: false,
  currentStreamingMessageId: null,
  activeLangGraphNode: 'idle',
  error: null,
  simulateError: false,
  stagedAttachments: [],
  isUploadingFiles: false,
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ASYNCHRONOUS THUNKS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Payload interface for sending a message.
 */
export interface SendMessagePayload {
  threadId: string;
  content: string;
  attachments?: FileAttachment[];
}

/**
 * @thunk sendMessageThunk
 * @description Orchestrates the entire asynchronous send & stream lifecycle:
 * 1. Dispatches pending action -> Optimistically updates user message in store.
 * 2. Initializes assistant placeholder with status 'streaming'.
 * 3. Creates an AbortController and maps it by threadId for cancellation.
 * 4. Initiates SSE stream via `streamChatResponse`.
 * 5. Dispatches synchronous `appendStreamChunk` per token chunk received.
 * 6. Dispatches `setLangGraphNode` as the backend agent transitions states.
 * 7. On network/API failure, catches and forwards error via `rejectWithValue`.
 * 8. Dispatches fulfilled action on completion.
 */
export const sendMessageThunk = createAsyncThunk<
  { threadId: string; assistantMessageId: string },
  SendMessagePayload,
  { rejectValue: ApiErrorState }
>(
  'chat/sendMessage',
  async ({ threadId, content, attachments }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as { chat: ChatState };
    const userMessageId = `msg_user_${Date.now()}`;
    const assistantMessageId = `msg_assistant_${Date.now()}`;

    // 1. Optimistically append User Message to Redux
    const userMessage: ChatMessage = {
      id: userMessageId,
      threadId,
      role: 'user',
      content,
      status: 'complete',
      timestamp: Date.now(),
      attachments: attachments ? [...attachments] : undefined,
    };
    dispatch(chatSlice.actions.addMessage(userMessage));

    // 2. Initialize Assistant Message placeholder in Redux with status 'streaming'
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      threadId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      timestamp: Date.now() + 1,
    };
    dispatch(chatSlice.actions.addMessage(assistantMessage));
    dispatch(chatSlice.actions.setCurrentStreamingMessageId(assistantMessageId));

    // 3. Register AbortController for true upstream cancellation
    const abortController = new AbortController();
    activeAbortControllers.set(threadId, abortController);

    // 4. Determine initial LangGraph node:
    // If user provided files -> route to 'file_parser_node' first.
    // Otherwise -> route directly to 'agent_node'. (Conditional routing requirement)
    if (attachments && attachments.length > 0) {
      dispatch(chatSlice.actions.setLangGraphNode('file_parser_node'));
    } else {
      dispatch(chatSlice.actions.setLangGraphNode('agent_node'));
    }

    // Prepare full conversation history for context coherence
    const threadMessages = state.chat.messages[threadId] || [];
    const formattedHistory = [
      ...threadMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
      { role: 'user', content, attachments },
    ];

    try {
      await streamChatResponse({
        threadId,
        messages: formattedHistory,
        attachments,
        signal: abortController.signal,
        simulateError: state.chat.simulateError,
        onToken: (token: string) => {
          // Synchronous token dispatch - updates message string instantly
          dispatch(
            chatSlice.actions.appendStreamChunk({
              threadId,
              messageId: assistantMessageId,
              token,
            })
          );
        },
        onNodeTransition: (node: LangGraphNode) => {
          dispatch(chatSlice.actions.setLangGraphNode(node));
        },
        onFileGenerated: (file: GeneratedFile) => {
          dispatch(
            chatSlice.actions.addGeneratedFile({
              threadId,
              messageId: assistantMessageId,
              file,
            })
          );
        },
        onError: (err) => {
          throw new Error(err.message || 'Stream processing failed');
        },
        onDone: () => {
          // Stream completed normally
        },
      });

      // Graph execution finishes at checkpointer and end node
      dispatch(chatSlice.actions.setLangGraphNode('checkpointer'));
      setTimeout(() => {
        dispatch(chatSlice.actions.setLangGraphNode('idle'));
      }, 800);

      activeAbortControllers.delete(threadId);
      return { threadId, assistantMessageId };
    } catch (error: any) {
      activeAbortControllers.delete(threadId);

      // If aborted by user, don't treat as an error
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        dispatch(chatSlice.actions.setLangGraphNode('idle'));
        return { threadId, assistantMessageId };
      }

      const errorPayload: ApiErrorState = {
        code: error.code || 'ERR_API_FAILURE',
        message: error.message || 'Failed to complete AI stream request',
        retryable: true,
        timestamp: Date.now(),
      };

      // Pass structured error to extraReducers.rejected
      return rejectWithValue(errorPayload);
    }
  }
);

/**
 * @thunk uploadAndParseFilesThunk
 * @description Validates, reads, and parses multiple files selected by the user.
 * Catches format and size violations (25MB cap), protects against ZIP bombs,
 * and extracts text summaries for instant UI feedback.
 */
export const uploadAndParseFilesThunk = createAsyncThunk<
  FileAttachment[],
  File[],
  { rejectValue: string }
>('chat/uploadFiles', async (files, { rejectWithValue }) => {
  try {
    const parsedAttachments: FileAttachment[] = [];
    for (const file of files) {
      const parsed = await parseFileForUpload(file);
      parsedAttachments.push(parsed);
    }
    return parsedAttachments;
  } catch (err: any) {
    return rejectWithValue(err.message || 'File upload and parsing failed');
  }
});

/**
 * @thunk regenerateMessageThunk
 * @description Retries the last assistant response in the active thread.
 * Recovers from 'failed' states or generates an alternate answer.
 */
export const regenerateMessageThunk = createAsyncThunk<
  void,
  string, // threadId
  { rejectValue: ApiErrorState }
>('chat/regenerateMessage', async (threadId, { dispatch, getState }) => {
  const state = getState() as { chat: ChatState };
  const threadMessages = state.chat.messages[threadId] || [];

  // Find the last user message to replay
  const lastUserMessage = [...threadMessages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) return;

  // Clear existing error
  dispatch(chatSlice.actions.clearError());

  // Dispatch sendMessageThunk with the last user prompt and attachments
  dispatch(
    sendMessageThunk({
      threadId,
      content: lastUserMessage.content,
      attachments: lastUserMessage.attachments,
    })
  );
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SLICE DEFINITION & REDUCERS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Synchronously appends an incoming token chunk to the target assistant message.
     * Uses Immer under the hood to ensure immutable state updates while reading like a direct mutation.
     */
    appendStreamChunk: (
      state,
      action: PayloadAction<{ threadId: string; messageId: string; token: string }>
    ) => {
      const { threadId, messageId, token } = action.payload;
      const threadMsgs = state.messages[threadId];
      if (!threadMsgs) return;

      const targetMsg = threadMsgs.find((m) => m.id === messageId);
      if (targetMsg) {
        targetMsg.content += token;
        targetMsg.status = 'streaming';
      }
    },

    /**
     * Adds an optimistic or complete message to the active thread's list.
     */
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const msg = action.payload;
      if (!state.messages[msg.threadId]) {
        state.messages[msg.threadId] = [];
      }
      state.messages[msg.threadId].push(msg);

      // Update thread metadata
      if (state.threads[msg.threadId]) {
        state.threads[msg.threadId].updatedAt = Date.now();
        state.threads[msg.threadId].messageCount = state.messages[msg.threadId].length;
      }
    },

    /**
     * Appends a generated downloadable file to an assistant message ("Any file out").
     */
    addGeneratedFile: (
      state,
      action: PayloadAction<{ threadId: string; messageId: string; file: GeneratedFile }>
    ) => {
      const { threadId, messageId, file } = action.payload;
      const threadMsgs = state.messages[threadId];
      if (!threadMsgs) return;

      const targetMsg = threadMsgs.find((m) => m.id === messageId);
      if (targetMsg) {
        if (!targetMsg.generatedFiles) {
          targetMsg.generatedFiles = [];
        }
        targetMsg.generatedFiles.push(file);
      }
    },

    /**
     * Sets the active conversation thread.
     */
    setActiveThread: (state, action: PayloadAction<string>) => {
      state.activeThreadId = action.payload;
      state.error = null;
    },

    /**
     * Creates a new conversation thread session.
     */
    createNewThread: (state) => {
      const newId = `thread_${Date.now()}`;
      state.threads[newId] = {
        id: newId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
      };
      state.messages[newId] = [];
      state.activeThreadId = newId;
      state.error = null;
      state.stagedAttachments = [];
    },

    /**
     * Deletes a thread from the store.
     */
    deleteThread: (state, action: PayloadAction<string>) => {
      const threadId = action.payload;
      delete state.threads[threadId];
      delete state.messages[threadId];

      // If active thread was deleted, fallback to first available thread or create new
      if (state.activeThreadId === threadId) {
        const remainingKeys = Object.keys(state.threads);
        state.activeThreadId = remainingKeys.length > 0 ? remainingKeys[0] : null;
      }
    },

    /**
     * Cancels active streaming for a thread.
     * Triggers the AbortController mapped to this thread and marks message as complete.
     */
    cancelStreaming: (state, action: PayloadAction<{ threadId: string }>) => {
      const { threadId } = action.payload;
      const controller = activeAbortControllers.get(threadId);
      if (controller) {
        controller.abort();
        activeAbortControllers.delete(threadId);
      }

      state.isStreaming = false;
      state.activeLangGraphNode = 'idle';

      // Mark the active message as complete
      if (state.currentStreamingMessageId && state.messages[threadId]) {
        const msg = state.messages[threadId].find((m) => m.id === state.currentStreamingMessageId);
        if (msg) {
          msg.status = 'complete';
        }
      }
      state.currentStreamingMessageId = null;
    },

    /**
     * Updates the current active node in the LangGraph state machine.
     */
    setLangGraphNode: (state, action: PayloadAction<LangGraphNode>) => {
      state.activeLangGraphNode = action.payload;
    },

    /**
     * Sets ID of message currently streaming.
     */
    setCurrentStreamingMessageId: (state, action: PayloadAction<string | null>) => {
      state.currentStreamingMessageId = action.payload;
    },

    /**
     * Toggles simulated error mode for interview demonstration.
     */
    setSimulateError: (state, action: PayloadAction<boolean>) => {
      state.simulateError = action.payload;
    },

    /**
     * Clears active error state.
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Removes an attachment from the input staging queue.
     */
    removeStagedAttachment: (state, action: PayloadAction<string>) => {
      state.stagedAttachments = state.stagedAttachments.filter((a) => a.id !== action.payload);
    },

    /**
     * Clears all attachments currently staged in the input.
     */
    clearStagedAttachments: (state) => {
      state.stagedAttachments = [];
    },
  },

  /**
   * ─────────────────────────────────────────────────────────────────────────────
   * EXTRA REDUCERS (Asynchronous Thunk Lifecycles)
   * ─────────────────────────────────────────────────────────────────────────────
   */
  extraReducers: (builder) => {
    // -------------------------------------------------------------------------
    // sendMessageThunk Lifecycle
    // -------------------------------------------------------------------------
    builder
      .addCase(sendMessageThunk.pending, (state) => {
        state.isStreaming = true;
        state.error = null;
        state.stagedAttachments = []; // Clear input file staging
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.isStreaming = false;
        state.currentStreamingMessageId = null;
        state.activeLangGraphNode = 'idle';

        // Finalize assistant message status
        const { threadId, assistantMessageId } = action.payload;
        if (state.messages[threadId]) {
          const msg = state.messages[threadId].find((m) => m.id === assistantMessageId);
          if (msg) {
            msg.status = 'complete';
          }
        }
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.isStreaming = false;
        state.currentStreamingMessageId = null;
        state.activeLangGraphNode = 'error_handler';

        // Save error diagnostic
        if (action.payload) {
          state.error = action.payload;
        } else {
          state.error = {
            code: 'ERR_UNKNOWN',
            message: action.error.message || 'An unexpected error occurred during generation',
            retryable: true,
            timestamp: Date.now(),
          };
        }

        // Mark target assistant message as 'failed'
        const activeId = state.activeThreadId;
        if (activeId && state.messages[activeId]) {
          const lastMsg = state.messages[activeId][state.messages[activeId].length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.status = 'failed';
            lastMsg.error = state.error;
          }
        }
      });

    // -------------------------------------------------------------------------
    // uploadAndParseFilesThunk Lifecycle
    // -------------------------------------------------------------------------
    builder
      .addCase(uploadAndParseFilesThunk.pending, (state) => {
        state.isUploadingFiles = true;
      })
      .addCase(uploadAndParseFilesThunk.fulfilled, (state, action) => {
        state.isUploadingFiles = false;
        state.stagedAttachments.push(...action.payload);
      })
      .addCase(uploadAndParseFilesThunk.rejected, (state, action) => {
        state.isUploadingFiles = false;
        state.error = {
          code: 'ERR_FILE_PARSE',
          message: action.payload || 'Failed to process selected files',
          retryable: false,
          timestamp: Date.now(),
        };
      });
  },
});

export const {
  appendStreamChunk,
  addMessage,
  addGeneratedFile,
  setActiveThread,
  createNewThread,
  deleteThread,
  cancelStreaming,
  setLangGraphNode,
  setCurrentStreamingMessageId,
  setSimulateError,
  clearError,
  removeStagedAttachment,
  clearStagedAttachments,
} = chatSlice.actions;

export default chatSlice.reducer;
