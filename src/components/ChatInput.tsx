/**
 * @file src/components/ChatInput.tsx
 * @description Input area handling prompt entry, drag-and-drop multi-file uploads,
 * staged attachment previews, and streaming stop/cancellation controls.
 *
 * DATA FLOW:
 * 1. User attaches files -> Dispatches `uploadAndParseFilesThunk(files)` -> Parsed items stored in `stagedAttachments`.
 * 2. User types prompt & hits Enter -> Dispatches `sendMessageThunk({ threadId, content, attachments })`.
 * 3. User clicks "Stop" while streaming -> Dispatches `cancelStreaming({ threadId })` -> Aborts active fetch stream.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  X,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  Layers,
  File,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  cancelStreaming,
  removeStagedAttachment,
  sendMessageThunk,
  uploadAndParseFilesThunk,
} from '../store/chatSlice';

export const ChatInput: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeThreadId = useAppSelector((state) => state.chat.activeThreadId);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const isUploadingFiles = useAppSelector((state) => state.chat.isUploadingFiles);
  const stagedAttachments = useAppSelector((state) => state.chat.stagedAttachments);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputPrompt.trim() && stagedAttachments.length === 0) || !activeThreadId || isStreaming) {
      return;
    }

    dispatch(
      sendMessageThunk({
        threadId: activeThreadId,
        content: inputPrompt.trim() || 'Please process the attached file(s).',
        attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
      })
    );

    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    if (activeThreadId) {
      dispatch(cancelStreaming({ threadId: activeThreadId }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      dispatch(uploadAndParseFilesThunk(Array.from(files)));
      e.target.value = ''; // Reset input to allow re-uploading same file name
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      dispatch(uploadAndParseFilesThunk(Array.from(files)));
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'docx':
      case 'text':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
      case 'pptx':
        return <Layers className="w-3.5 h-3.5 text-amber-500" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'zip':
        return <FileArchive className="w-3.5 h-3.5 text-purple-500" />;
      case 'code':
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <File className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200 select-none">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Drag and Drop Zone Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
              : 'border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
          }`}
        >
          {/* Staged File Attachments Preview Bar */}
          {stagedAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 pb-0 border-b border-slate-100">
              {stagedAttachments.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${
                    file.parseStatus === 'unsupported'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {getAttachmentIcon(file.type)}
                  <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {Math.round(file.size / 1024)}KB
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch(removeStagedAttachment(file.id))}
                    className="p-0.5 hover:text-rose-600 transition-colors cursor-pointer text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Row */}
          <div className="flex items-end gap-2 p-2.5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isUploadingFiles}
              title="Attach files (PDF, DOCX, XLSX, PPTX, images, code, ZIP)"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                stagedAttachments.length > 0
                  ? 'Ask a question or request an analysis on the attached file(s)...'
                  : 'Message VenXR... (Drag & drop files or type request)'
              }
              className="flex-1 max-h-40 min-h-[24px] py-1 px-1 bg-transparent border-0 resize-none focus:outline-hidden text-sm text-slate-900 placeholder-slate-400 leading-relaxed"
            />

            {/* Send or Stop Action Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                title="Stop streaming (triggers upstream cancellation)"
                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 px-3 text-xs font-medium"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!inputPrompt.trim() && stagedAttachments.length === 0}
                title="Send message (Enter)"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Informational Guidance Microcopy */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            Supports: PDF, DOCX, XLSX/CSV, PPTX, Images, JSON/Code, ZIP (max 25MB).
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">Enter</kbd> to send ·{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">Shift+Enter</kbd> newline
          </span>
        </div>
      </div>
    </div>
  );
};
