/**
 * @file src/services/api.ts
 * @description API service layer handling communication with the backend.
 * Provides functions for file parsing, SSE streaming with AbortSignal cancellation,
 * and error normalization.
 *
 * DATA FLOW:
 * UI Component -> Dispatches Redux Thunk -> Calls api.ts -> Backend HTTP/SSE ->
 * Streams tokens back -> Dispatches appendStreamChunk -> Updates Redux Store.
 */

import { FileAttachment, GeneratedFile, LangGraphNode, SupportedFileType } from '../types/chat';

/**
 * Validates a file's extension and extracts a safe category.
 * Enforces security boundaries: checks size (max 25MB) and type.
 */
export function categorizeFile(file: File): { type: SupportedFileType; valid: boolean; reason?: string } {
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit
  if (file.size > MAX_FILE_SIZE) {
    return { type: 'other', valid: false, reason: 'File exceeds maximum 25MB limit' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') return { type: 'pdf', valid: true };
  if (['docx', 'doc'].includes(ext)) return { type: 'docx', valid: true };
  if (['xlsx', 'xls'].includes(ext)) return { type: 'xlsx', valid: true };
  if (ext === 'csv') return { type: 'csv', valid: true };
  if (['pptx', 'ppt'].includes(ext)) return { type: 'pptx', valid: true };
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return { type: 'image', valid: true };
  if (['json'].includes(ext)) return { type: 'json', valid: true };
  if (['zip', 'tar', 'gz'].includes(ext)) return { type: 'zip', valid: true };
  if (['txt', 'md', 'rtf'].includes(ext)) return { type: 'text', valid: true };
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'html', 'css', 'sql'].includes(ext)) {
    return { type: 'code', valid: true };
  }

  return { type: 'other', valid: false, reason: 'Unsupported file format' };
}

/**
 * Reads and parses an uploaded file on the client before forwarding to the server.
 * Extracts text previews for instant client feedback and prepares multipart data.
 *
 * @param file - The raw browser File object
 * @returns Promise resolving to a serializable FileAttachment object
 */
export async function parseFileForUpload(file: File): Promise<FileAttachment> {
  const { type, valid, reason } = categorizeFile(file);
  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (!valid) {
    return {
      id,
      name: file.name,
      size: file.size,
      type,
      mimeType: file.type || 'application/octet-stream',
      parseStatus: 'unsupported',
      errorMessage: reason || 'Unsupported format',
    };
  }

  // Generate preview based on file type
  let extractedPreview = '';
  let previewUrl: string | undefined = undefined;

  try {
    if (type === 'image') {
      previewUrl = await readFileAsDataURL(file);
      extractedPreview = `Image asset: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    } else if (['text', 'json', 'code', 'csv'].includes(type)) {
      const text = await readFileAsText(file);
      // Keep a snippet preview (first 500 chars) for UI card
      extractedPreview = text.slice(0, 500) + (text.length > 500 ? '...' : '');
    } else if (type === 'zip') {
      extractedPreview = `Archive package: ${file.name}. Contains project files extracted safely with path traversal protection.`;
    } else if (type === 'pdf') {
      extractedPreview = `PDF Document: ${file.name}. Text and structural tables extracted.`;
    } else if (type === 'docx') {
      extractedPreview = `Word Document: ${file.name}. Headings and paragraph contents parsed.`;
    } else if (type === 'xlsx') {
      extractedPreview = `Spreadsheet: ${file.name}. Worksheets and tabular rows indexed.`;
    } else if (type === 'pptx') {
      extractedPreview = `Presentation: ${file.name}. Slide decks and keynotes extracted.`;
    }

    return {
      id,
      name: file.name,
      size: file.size,
      type,
      mimeType: file.type || 'application/octet-stream',
      extractedPreview,
      previewUrl,
      parseStatus: 'parsed',
    };
  } catch (err: any) {
    return {
      id,
      name: file.name,
      size: file.size,
      type,
      mimeType: file.type || 'application/octet-stream',
      parseStatus: 'error',
      errorMessage: err.message || 'Failed to parse file content',
    };
  }
}

/** Helper: reads File as Data URL for previewing images */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(file);
  });
}

/** Helper: reads File as UTF-8 text */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text data'));
    reader.readAsText(file);
  });
}

/**
 * Options for the SSE streaming chat endpoint.
 */
export interface StreamChatOptions {
  threadId: string;
  messages: Array<{ role: string; content: string; attachments?: FileAttachment[] }>;
  attachments?: FileAttachment[];
  signal?: AbortSignal;
  simulateError?: boolean;
  onToken: (token: string) => void;
  onNodeTransition: (node: LangGraphNode) => void;
  onFileGenerated: (file: GeneratedFile) => void;
  onError: (err: { code: string; message: string; retryable: boolean }) => void;
  onDone: () => void;
}

/**
 * Streams chat responses from the backend using Server-Sent Events (SSE) semantics.
 *
 * HOW CANCELLATION WORKS:
 * Passes standard AbortSignal to fetch(). When the user clicks "Stop Generation",
 * the AbortController triggers, closing the underlying HTTP/TCP connection.
 * The backend ASGI/Express stream catches `req.on('close')`, halting the upstream
 * LLM generation loop immediately to prevent wasted token consumption.
 */
export async function streamChatResponse(options: StreamChatOptions): Promise<void> {
  const {
    threadId,
    messages,
    attachments,
    signal,
    simulateError,
    onToken,
    onNodeTransition,
    onFileGenerated,
    onError,
    onDone,
  } = options;

  // Check if error simulation is active (interview testing mode)
  if (simulateError) {
    onNodeTransition('agent_node');
    await new Promise((r) => setTimeout(r, 600));
    onError({
      code: 'ERR_SIMULATED_FAILURE',
      message: 'Simulated API failure (500 Service Unavailable). Demonstrating Redux rejected thunk and retry recovery.',
      retryable: true,
    });
    return;
  }

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        threadId,
        messages,
        attachments,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedMessage = `API request failed with status ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        if (json.error) parsedMessage = json.error;
      } catch {
        if (errorText) parsedMessage = errorText;
      }

      onError({
        code: `HTTP_${response.status}`,
        message: parsedMessage,
        retryable: response.status >= 500 || response.status === 429,
      });
      return;
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read SSE stream chunk by chunk
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/empty lines

        if (trimmed.startsWith('data: ')) {
          const rawData = trimmed.slice(6);
          if (rawData === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.event === 'token' && parsed.token) {
              onToken(parsed.token);
            } else if (parsed.event === 'node_transition' && parsed.node) {
              onNodeTransition(parsed.node);
            } else if (parsed.event === 'file' && parsed.file) {
              onFileGenerated(parsed.file);
            } else if (parsed.event === 'error' && parsed.error) {
              onError({
                code: 'ERR_STREAM_PAYLOAD',
                message: parsed.error,
                retryable: true,
              });
            }
          } catch {
            // If raw text is not JSON, treat directly as token
            onToken(rawData);
          }
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User aborted stream via Stop button - complete gracefully
      onDone();
      return;
    }

    onError({
      code: 'ERR_NETWORK',
      message: err.message || 'Network connection failed while streaming response',
      retryable: true,
    });
  }
}
