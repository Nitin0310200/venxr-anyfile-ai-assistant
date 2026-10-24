/**
 * @file src/components/Sidebar.tsx
 * @description Thread list sidebar and interview control panel.
 *
 * DATA FLOW:
 * Reads `threads` and `activeThreadId` from Redux using `useAppSelector`.
 * Dispatches `setActiveThread`, `createNewThread`, `deleteThread`, and `setSimulateError`.
 */

import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Cpu,
  AlertTriangle,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  createNewThread,
  deleteThread,
  setActiveThread,
  setSimulateError,
} from '../store/chatSlice';
import { toggleArchitectureDrawer } from '../store/uiSlice';

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const threads = useAppSelector((state) => state.chat.threads);
  const activeThreadId = useAppSelector((state) => state.chat.activeThreadId);
  const simulateError = useAppSelector((state) => state.chat.simulateError);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);

  const threadList = Object.values(threads).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleSelectThread = (id: string) => {
    if (isStreaming) return; // Prevent switching mid-stream
    dispatch(setActiveThread(id));
  };

  const handleNewThread = () => {
    dispatch(createNewThread());
  };

  const handleDeleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteThread(id));
  };

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shrink-0 select-none">
      {/* Brand & New Thread Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              Vx
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white">VenXR Assistant</h1>
              <span className="text-[11px] text-slate-400">LangGraph · Django · React</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleNewThread}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Recent Threads ({threadList.length})
        </div>

        {threadList.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No active conversations. Click "New Conversation" to begin.
          </div>
        ) : (
          threadList.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="truncate text-slate-200">{thread.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {thread.messageCount} messages ·{' '}
                      {new Date(thread.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteThread(e, thread.id)}
                  title="Delete thread"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity text-slate-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Interview Presentation & Diagnostic Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/40">
        {/* Simulate Failure Mode Toggle for Interview */}
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <AlertTriangle className={`w-3.5 h-3.5 ${simulateError ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="font-medium text-[11px]">Simulate 500 Failure</span>
            </div>
            <input
              type="checkbox"
              id="simulateErrorToggle"
              checked={simulateError}
              onChange={(e) => dispatch(setSimulateError(e.target.checked))}
              className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            Tests Redux <span className="font-mono text-amber-300">rejected</span> state and retry recovery.
          </p>
        </div>

        {/* Architecture & Code Inspector Trigger */}
        <button
          onClick={() => dispatch(toggleArchitectureDrawer())}
          className="w-full flex items-center justify-between py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Architecture & Code</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono">
            Inspector
          </span>
        </button>
      </div>
    </aside>
  );
};
