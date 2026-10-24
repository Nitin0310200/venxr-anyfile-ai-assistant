/**
 * @file src/components/ChatHeader.tsx
 * @description Header bar displaying active thread status, LangGraph node state,
 * and presentation controls for the interview.
 *
 * DATA FLOW:
 * Reads `activeLangGraphNode` and `activeThreadId` from Redux store.
 * Triggers UI state updates (`toggleArchitectureDrawer`, `toggleMobileSidebar`).
 */

import React from 'react';
import {
  Menu,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { toggleArchitectureDrawer, toggleMobileSidebar } from '../store/uiSlice';
import { LangGraphNode } from '../types/chat';

export const ChatHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeThreadId = useAppSelector((state) => state.chat.activeThreadId);
  const threads = useAppSelector((state) => state.chat.threads);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const activeNode = useAppSelector((state) => state.chat.activeLangGraphNode);

  const currentThread = activeThreadId ? threads[activeThreadId] : null;

  /** Helper to format LangGraph node labels and colors */
  const getNodeBadge = (node: LangGraphNode) => {
    switch (node) {
      case 'file_parser_node':
        return {
          label: 'LangGraph: Parsing Files',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          icon: <FileText className="w-3 h-3 animate-pulse text-amber-600" />,
        };
      case 'agent_node':
        return {
          label: 'LangGraph: Agent Reasoning',
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          icon: <Sparkles className="w-3 h-3 animate-pulse text-indigo-600" />,
        };
      case 'file_generator_node':
        return {
          label: 'LangGraph: Generating File Artifact',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: <Layers className="w-3 h-3 animate-pulse text-emerald-600" />,
        };
      case 'answer_node':
        return {
          label: 'LangGraph: Streaming Answer',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: <Activity className="w-3 h-3 animate-pulse text-blue-600" />,
        };
      case 'checkpointer':
        return {
          label: 'PostgreSQL: Checkpointer Sync',
          color: 'text-purple-700 bg-purple-50 border-purple-200',
          icon: <CheckCircle2 className="w-3 h-3 text-purple-600" />,
        };
      case 'error_handler':
        return {
          label: 'LangGraph: Error Boundary (Retrying)',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          icon: <AlertCircle className="w-3 h-3 text-rose-600" />,
        };
      default:
        return {
          label: 'LangGraph: Ready / Idle',
          color: 'text-slate-600 bg-slate-100 border-slate-200',
          icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />,
        };
    }
  };

  const badge = getNodeBadge(activeNode);

  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
      {/* Left: Mobile Toggle & Thread Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h2 className="text-sm font-semibold text-slate-900 truncate">
            {currentThread ? currentThread.title : 'VenXR Assistant'}
          </h2>
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
            <span>Multi-turn Thread</span>
            <span>·</span>
            <span>PostgreSQL State</span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {currentThread?.messageCount || 0} msgs
            </span>
          </div>
        </div>
      </div>

      {/* Right: LangGraph Status & Architecture Drawer Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live LangGraph State Node Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${badge.color}`}
        >
          {badge.icon}
          <span className="hidden sm:inline font-mono text-[11px]">{badge.label}</span>
          <span className="sm:hidden font-mono text-[11px]">
            {activeNode === 'idle' ? 'Ready' : activeNode.replace('_node', '')}
          </span>
        </div>

        {/* Download Architecture Guide PDF */}
        <a
          href="/VenXR_AI_Chat_Assistant_Architecture_Guide.pdf"
          download="VenXR_AI_Chat_Assistant_Architecture_Guide.pdf"
          title="Download complete end-to-end architecture guide in PDF format"
          className="flex items-center gap-1.5 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Download PDF Guide</span>
          <span className="md:hidden">PDF</span>
        </a>

        {/* Architecture & Flow Drawer Button */}
        <button
          onClick={() => dispatch(toggleArchitectureDrawer())}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Inspect Architecture</span>
          <span className="sm:hidden">Inspect</span>
        </button>
      </div>
    </header>
  );
};
