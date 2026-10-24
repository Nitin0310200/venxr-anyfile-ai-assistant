/**
 * @file src/components/MessageList.tsx
 * @description Renders the scrollable message feed for the active conversation thread.
 * Auto-scrolls smoothly when new streaming tokens arrive and displays starter prompts
 * when the thread is empty.
 *
 * DATA FLOW:
 * Reads `messages[activeThreadId]` from Redux store via `useAppSelector`.
 * Maps over items to render `ChatMessageItem`.
 */

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { ChatMessageItem } from './ChatMessageItem';
import { sendMessageThunk } from '../store/chatSlice';
import {
  FileText,
  FileSpreadsheet,
  Code2,
  Sparkles,
  Bot,
} from 'lucide-react';

export const MessageList: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeThreadId = useAppSelector((state) => state.chat.activeThreadId);
  const messages = useAppSelector((state) =>
    activeThreadId ? state.chat.messages[activeThreadId] || [] : []
  );
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new tokens arrive
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [messages, isStreaming]);

  const handleStarterPrompt = (prompt: string) => {
    if (!activeThreadId || isStreaming) return;
    dispatch(sendMessageThunk({ threadId: activeThreadId, content: prompt }));
  };

  if (!activeThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-sm">
        Select or create a conversation thread to start.
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
          <Bot className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            How can VenXR assist you today?
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            I handle long-running conversations with memory, multi-file uploads (PDF, DOCX, XLSX, PPTX, ZIP, code),
            and generate downloadable files on request.
          </p>
        </div>

        {/* Starter Prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
          <button
            onClick={() =>
              handleStarterPrompt(
                'Generate an executive summary and financial projection CSV for Q4 enterprise sales.'
              )
            }
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                Generate CSV Dataset
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Outputs a formatted CSV card ready to download and inspect.
            </p>
          </button>

          <button
            onClick={() =>
              handleStarterPrompt(
                'Create a Python data pipeline script for parsing multi-format files and saving checkpoints.'
              )
            }
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                Generate Python Script
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Creates a clean code artifact with syntax highlighting and copy.
            </p>
          </button>

          <button
            onClick={() =>
              handleStarterPrompt(
                'Summarize the core requirements of the VenXR take-home assignment and outline the memory strategy.'
              )
            }
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                Assignment Memory Strategy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Explains sliding window + running summarization trade-offs.
            </p>
          </button>

          <button
            onClick={() =>
              handleStarterPrompt(
                'Demonstrate error handling: how does Redux Toolkit intercept network drops and retry failed turns?'
              )
            }
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                Redux Error Architecture
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Breaks down rejectWithValue and the unbuffered stream action flow.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
      {messages.map((message, idx) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          isLatest={idx === messages.length - 1}
        />
      ))}
      <div ref={scrollEndRef} className="h-4" />
    </div>
  );
};
