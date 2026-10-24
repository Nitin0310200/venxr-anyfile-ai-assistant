/**
 * @file src/components/ChatMessageItem.tsx
 * @description Message item component rendering user and assistant turns.
 * Supports Markdown parsing, syntax-highlighted code blocks with copy buttons,
 * file attachment cards ("Any file in"), downloadable generated file cards ("Any file out"),
 * streaming indicators, and robust error recovery buttons.
 *
 * DATA FLOW:
 * Subscribes to message data from parent `MessageList`.
 * Dispatches `regenerateMessageThunk` on error retry.
 */

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertOctagon,
  Eye,
  File,
  Layers,
} from 'lucide-react';
import { ChatMessage, FileAttachment, GeneratedFile } from '../types/chat';
import { useAppDispatch } from '../store/store';
import { regenerateMessageThunk } from '../store/chatSlice';

interface Props {
  message: ChatMessage;
  isLatest: boolean;
}

export const ChatMessageItem: React.FC<Props> = ({ message, isLatest }) => {
  const dispatch = useAppDispatch();
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isFailed = message.status === 'failed';

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activePreviewFile, setActivePreviewFile] = useState<FileAttachment | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleRetry = () => {
    dispatch(regenerateMessageThunk(message.threadId));
  };

  /**
   * Helper to return file type icon.
   */
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'docx':
      case 'text':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'pptx':
        return <Layers className="w-4 h-4 text-amber-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'zip':
        return <FileArchive className="w-4 h-4 text-purple-500" />;
      case 'code':
      case 'json':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  /**
   * Simple, reliable markdown parser converting headers, code blocks, lists, and bold text.
   */
  const renderMarkdown = (text: string) => {
    if (!text && isStreaming) {
      return (
        <span className="inline-flex items-center gap-1.5 text-slate-400 italic text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Thinking and generating response...
        </span>
      );
    }

    // Split text by markdown code blocks (```language ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Push text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      // Push code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim(),
        id: `code_${match.index}`,
      });

      lastIndex = match.index + match[0].length;
    }

    // Push remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3 leading-relaxed text-sm text-slate-800">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div
                key={part.id || index}
                className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs">
                  <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider">
                    {part.language || 'code'}
                  </span>
                  <button
                    onClick={() => handleCopy(part.content, part.id!)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    {copiedCodeId === part.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono overflow-x-auto text-slate-200 leading-normal">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          // Process paragraphs, bullet lists, and bold text
          const lines = part.content.split('\n');
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1.5" />;

                // Bullet point
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-indigo-600 mt-1.5 text-xs leading-none">●</span>
                      <span>{renderInlineFormatting(trimmed.substring(2))}</span>
                    </div>
                  );
                }

                // Header 3
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={lIdx} className="font-semibold text-slate-900 text-sm mt-2">
                      {renderInlineFormatting(trimmed.substring(4))}
                    </h4>
                  );
                }

                // Header 2
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className="font-bold text-slate-900 text-base mt-3">
                      {renderInlineFormatting(trimmed.substring(3))}
                    </h3>
                  );
                }

                return <p key={lIdx}>{renderInlineFormatting(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Helper: parses bold `**text**` and inline `` `code` ``
   */
  const renderInlineFormatting = (line: string): React.ReactNode => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`py-5 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-white border-y border-slate-200/60'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Author Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs border border-slate-300">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              Vx
            </div>
          )}
        </div>

        {/* Message Body & Metadata */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Row */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">{isUser ? 'You' : 'VenXR Assistant'}</span>
            <span>·</span>
            <span className="font-mono tabular-nums text-[11px]">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isStreaming && (
              <>
                <span>·</span>
                <span className="text-indigo-600 font-medium animate-pulse text-[11px]">
                  Streaming
                </span>
              </>
            )}
          </div>

          {/* Attached Files In User Message ("Any file in") */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {message.attachments.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActivePreviewFile(file)}
                  className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  {getFileIcon(file.type)}
                  <div className="truncate max-w-[200px]">
                    <div className="truncate font-medium text-slate-800">{file.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {Math.round(file.size / 1024)} KB · {file.type.toUpperCase()}
                    </div>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Message Text Content */}
          <div className="text-slate-800">{renderMarkdown(message.content)}</div>

          {/* Generated Files Output ("Any file out") */}
          {message.generatedFiles && message.generatedFiles.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Generated Artifacts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {message.generatedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-white rounded-md border border-slate-200 shadow-xs shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {file.filename}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {file.fileType.toUpperCase()} · {Math.round(file.sizeBytes / 1024)} KB
                        </div>
                      </div>
                    </div>

                    {file.previewSnippet && (
                      <pre className="mt-2 p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-600 truncate max-h-16 overflow-hidden">
                        {file.previewSnippet}
                      </pre>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-medium">Ready</span>
                      <a
                        href={file.downloadUrl}
                        download={file.filename}
                        onClick={(e) => {
                          if (file.downloadUrl === '#') {
                            e.preventDefault();
                            // Trigger dynamic blob download for demo
                            const blob = new Blob([file.previewSnippet || 'Generated Artifact'], {
                              type: file.mimeType,
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.filename;
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failure & Robust Error Recovery Banner */}
          {isFailed && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-900">
                    Generation Failed ({message.error?.code || 'ERR_SERVICE_UNAVAILABLE'})
                  </div>
                  <div className="text-rose-700 mt-0.5 leading-relaxed">
                    {message.error?.message ||
                      'The upstream API service encountered a temporary error. The Redux state captured the rejection.'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRetry}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Ingestion Modal Preview */}
      {activePreviewFile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActivePreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {getFileIcon(activePreviewFile.type)}
                <h3 className="font-semibold text-sm text-slate-900 truncate">
                  {activePreviewFile.name}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewFile(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-500">
                Type:{' '}
                <span className="font-semibold text-slate-800">
                  {activePreviewFile.type.toUpperCase()}
                </span>{' '}
                · Size:{' '}
                <span className="font-mono tabular-nums text-slate-800">
                  {Math.round(activePreviewFile.size / 1024)} KB
                </span>
              </div>

              {activePreviewFile.previewUrl && (
                <div className="my-2 rounded-lg overflow-hidden border border-slate-200 max-h-64 flex items-center justify-center bg-slate-50">
                  <img
                    src={activePreviewFile.previewUrl}
                    alt={activePreviewFile.name}
                    className="max-h-60 object-contain"
                  />
                </div>
              )}

              {activePreviewFile.extractedPreview && (
                <div>
                  <div className="font-medium text-slate-700 mb-1">Extracted Text Preview:</div>
                  <pre className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {activePreviewFile.extractedPreview}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
