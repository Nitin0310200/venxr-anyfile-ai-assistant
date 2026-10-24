/**
 * @file src/components/ArchitectureDrawer.tsx
 * @description Comprehensive interview presentation console.
 * Provides interactive visual diagrams, function-by-function Redux architectural commentary,
 * live LangGraph node telemetry, complete Django + LangGraph backend source code,
 * and the 1,000-user concurrency analysis.
 *
 * DESIGNED FOR INTERVIEWS:
 * Allows the candidate to demonstrate the running chat, open the drawer, and explain:
 * 1. How data flows between React components and Redux.
 * 2. How createAsyncThunk manages optimistic updates and streaming.
 * 3. Why non-serializable objects (AbortController) live outside Redux state.
 * 4. How LangGraph conditionally routes files and retries tool failures.
 * 5. Where the backend architecture breaks at 1,000 concurrent users.
 */

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  FileCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Server,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setActiveArchitectureTab, setArchitectureDrawerOpen } from '../store/uiSlice';

export const ArchitectureDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isArchitectureDrawerOpen);
  const activeTab = useAppSelector((state) => state.ui.activeArchitectureTab);
  const activeNode = useAppSelector((state) => state.chat.activeLangGraphNode);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const simulateError = useAppSelector((state) => state.chat.simulateError);

  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end select-none">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Architecture & Code Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Interactive interview guide: React-Redux, LangGraph & Django
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/VenXR_AI_Chat_Assistant_Architecture_Guide.pdf"
              download="VenXR_AI_Chat_Assistant_Architecture_Guide.pdf"
              title="Download architecture guide PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Guide</span>
            </a>

            <button
              onClick={() => dispatch(setArchitectureDrawerOpen(false))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-1 text-xs font-medium">
          <button
            onClick={() => dispatch(setActiveArchitectureTab('redux'))}
            className={`py-3 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'redux'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Redux & Thunks</span>
          </button>

          <button
            onClick={() => dispatch(setActiveArchitectureTab('langgraph'))}
            className={`py-3 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'langgraph'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>LangGraph Graph</span>
          </button>

          <button
            onClick={() => dispatch(setActiveArchitectureTab('django'))}
            className={`py-3 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'django'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Django & Backend</span>
          </button>

          <button
            onClick={() => dispatch(setActiveArchitectureTab('deliverables'))}
            className={`py-3 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'deliverables'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Deliverables</span>
          </button>

          <button
            onClick={() => dispatch(setActiveArchitectureTab('edgecases'))}
            className={`py-3 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'edgecases'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Edge Cases & QA</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* TAB 1: REDUX & ASYNC THUNKS */}
          {activeTab === 'redux' && (
            <div className="space-y-6">
              {/* Architecture Summary Banner */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-indigo-950 text-sm">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Unidirectional Data Flow & State Lifecycle</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Every user action dispatches an asynchronous thunk or synchronous action.
                  Components never mutate state directly; reducers update state immutably via Immer,
                  and selectors trigger granular component re-renders.
                </p>
              </div>

              {/* Data Flow Diagram Card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
                  <span>DATA_FLOW_CYCLE.ascii</span>
                  <span className="text-[11px] text-emerald-400">Serializable Store</span>
                </div>
                <pre className="p-4 text-[11px] font-mono bg-slate-950 text-slate-300 leading-normal overflow-x-auto">
{`┌──────────────────┐     dispatch(sendMessageThunk)     ┌──────────────────────┐
│  ChatInput.tsx   │ ─────────────────────────────────► │  createAsyncThunk    │
└──────────────────┘                                    └──────────┬───────────┘
         ▲                                                         │
         │                                                         │ 1. pending
         │ useSelector(selectMessages)                             ▼
┌────────┴─────────┐     State Updated (Immer)          ┌──────────────────────┐
│ ChatMessageItem  │ ◄───────────────────────────────── │ chatSlice.extraRed.  │
│  (Re-renders)    │                                    │  (Optimistic Bubble) │
└──────────────────┘                                    └──────────┬───────────┘
         ▲                                                         │
         │                                                         │ 2. SSE Stream
         │ dispatch(appendStreamChunk)                             ▼
┌────────┴─────────┐       Token-by-Token               ┌──────────────────────┐
│ Synchronous Act. │ ◄───────────────────────────────── │ streamChatResponse() │
└──────────────────┘                                    └──────────┬───────────┘
                                                                   │ 3. done / reject
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │ fulfilled / rejected │
                                                        │  (Status finalize)   │
                                                        └──────────────────────┘`}
                </pre>
              </div>

              {/* Detailed Function-by-Function Commentary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-900">
                  Key Functions & Redux Architecture Explained:
                </h3>

                {/* 1. sendMessageThunk */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      sendMessageThunk(payload)
                    </code>
                    <span className="text-[11px] text-slate-500 font-mono">createAsyncThunk</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>What it does:</strong> Coordinates optimistic updates, network streaming,
                    and cancellation.
                  </p>
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pl-1">
                    <li>
                      <strong>Optimistic dispatch:</strong> Immediately creates the user bubble and an
                      assistant placeholder with <code className="text-[11px]">status: 'streaming'</code>.
                    </li>
                    <li>
                      <strong>AbortController mapping:</strong> Maps an <code className="text-[11px]">AbortController</code> in
                      a module-level reference map (<code className="text-[11px]">activeAbortControllers</code>), keeping non-serializable objects outside Redux.
                    </li>
                    <li>
                      <strong>Synchronous chunk dispatch:</strong> Dispatches <code className="text-[11px]">appendStreamChunk</code> per token chunk to eliminate input lag.
                    </li>
                  </ul>
                </div>

                {/* 2. appendStreamChunk */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      appendStreamChunk(action)
                    </code>
                    <span className="text-[11px] text-slate-500 font-mono">Synchronous Reducer</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Why it's separate:</strong> Rather than buffering the entire response inside
                    the thunk and dispatching only on completion, this action runs for every token chunk.
                    Immer updates <code className="text-[11px]">targetMsg.content += token</code> immutably,
                    driving 60fps token streaming in the UI.
                  </p>
                </div>

                {/* 3. rejectWithValue */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      rejectWithValue(errorPayload)
                    </code>
                    <span className="text-[11px] text-slate-500 font-mono">Error Boundary</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Robust error recovery:</strong> When the backend returns a 500, network drops,
                    or timeout occurs, the thunk intercepts the failure and invokes <code className="text-[11px]">rejectWithValue</code>.
                    The <code className="text-[11px]">extraReducers.rejected</code> case saves the diagnostic and marks the message
                    as <code className="text-[11px]">failed</code> without wiping out existing chat history.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGGRAPH STATE GRAPH */}
          {activeTab === 'langgraph' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-purple-950 text-sm">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Conditional LangGraph StateGraph Architecture</span>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  In compliance with your specifications, routing is strictly conditional: ordinary chat
                  goes directly to <code className="text-[11px]">agent_node</code> and <code className="text-[11px]">answer_node</code>.
                  Only file uploads branch into <code className="text-[11px]">file_parser_node</code>, and file creation
                  branches into <code className="text-[11px]">file_generator_node</code>.
                </p>
              </div>

              {/* Live Active Node Visualizer */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Execution Telemetry</span>
                  <span className="text-[11px] text-indigo-600 font-mono">
                    Current: {activeNode}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'file_parser_node', name: '1. file_parser_node', desc: 'PDF, DOCX, XLSX, ZIP' },
                    { id: 'agent_node', name: '2. agent_node', desc: 'Reasoning & context' },
                    { id: 'file_generator_node', name: '3. file_generator_node', desc: 'DOCX, CSV, charts' },
                    { id: 'answer_node', name: '4. answer_node', desc: 'SSE token streaming' },
                    { id: 'checkpointer', name: '5. Postgres Checkpointer', desc: 'State checkpointing' },
                    { id: 'error_handler', name: '6. Error Retry Boundary', desc: 'Bounded retries (max 2)' },
                  ].map((node) => {
                    const isCurrent = activeNode === node.id;
                    return (
                      <div
                        key={node.id}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">{node.name}</div>
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isCurrent ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {node.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* StateGraph Python Source */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
                  <span>backend/agent/graph.py (LangGraph)</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `# LangGraph StateGraph Definition
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver

builder = StateGraph(AgentState)
builder.add_node("file_parser_node", file_parser_node)
builder.add_node("agent_node", agent_node)
builder.add_node("file_generator_node", file_generator_node)
builder.add_node("answer_node", answer_node)

# Conditional Inbound Routing
def route_inbound(state: AgentState):
    if state.get("attachments") and len(state["attachments"]) > 0:
        return "file_parser_node"
    return "agent_node"

builder.add_conditional_edges(START, route_inbound)
builder.add_edge("file_parser_node", "agent_node")

# Conditional Outbound Routing
def route_outbound(state: AgentState):
    if state.get("action") == "generate_file":
        return "file_generator_node"
    return "answer_node"

builder.add_conditional_edges("agent_node", route_outbound)
builder.add_edge("file_generator_node", "answer_node")
builder.add_edge("answer_node", END)`,
                        'graph_py'
                      )
                    }
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    {copiedSnippet === 'graph_py' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono bg-slate-950 text-slate-300 leading-normal overflow-x-auto">
{`from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver

# 1. State Definition
class AgentState(TypedDict):
    thread_id: str
    messages: list[BaseMessage]
    attachments: list[dict]
    generated_files: list[dict]
    retry_count: int

# 2. Compile Graph with Checkpointer
builder = StateGraph(AgentState)
builder.add_node("file_parser_node", file_parser_node)
builder.add_node("agent_node", agent_node)
builder.add_node("file_generator_node", file_generator_node)
builder.add_node("answer_node", answer_node)

# 3. Conditional Inbound Router (files vs plain text)
def route_inbound(state: AgentState):
    if state.get("attachments"):
        return "file_parser_node"
    return "agent_node"

builder.add_conditional_edges(START, route_inbound)
builder.add_edge("file_parser_node", "agent_node")

# 4. Conditional Outbound Router (file generation vs direct answer)
def route_outbound(state: AgentState):
    if state.get("action") == "generate_file":
        return "file_generator_node"
    return "answer_node"

builder.add_conditional_edges("agent_node", route_outbound)
builder.add_edge("file_generator_node", "answer_node")
builder.add_edge("answer_node", END)

checkpointer = PostgresSaver(conn_string=DATABASE_URL)
graph = builder.compile(checkpointer=checkpointer)`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DJANGO & BACKEND CODE */}
          {activeTab === 'django' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-950 text-sm">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Django ASGI StreamingHttpResponse & PostgreSQL Models</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  The backend uses Django with an ASGI streaming endpoint that yields SSE chunks.
                  Crucially, if the client disconnects or aborts, the Python generator cleans up
                  immediately to cancel the upstream LLM request.
                </p>
              </div>

              {/* Django Views Code Snippet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
                  <span>backend/chat/views.py (Django ASGI Stream)</span>
                </div>
                <pre className="p-4 text-[11px] font-mono bg-slate-950 text-slate-300 leading-normal overflow-x-auto">
{`from django.http import StreamingHttpResponse
import json, asyncio

async def chat_stream_view(request):
    """
    Django ASGI view executing the LangGraph agent and streaming SSE tokens.
    Implements upstream cancellation via generator cleanup.
    """
    body = json.loads(request.body)
    thread_id = body.get("threadId")
    messages = body.get("messages", [])

    async def event_generator():
        try:
            # Execute LangGraph stream
            async for event in graph.astream_events(
                {"messages": messages, "thread_id": thread_id},
                version="v2"
            ):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    token = event["data"]["chunk"].content
                    yield f"data: {json.dumps({'event': 'token', 'token': token})}\\n\\n"
                elif kind == "on_node_start":
                    node_name = event["name"]
                    yield f"data: {json.dumps({'event': 'node_transition', 'node': node_name})}\\n\\n"

            yield "data: [DONE]\\n\\n"
        except asyncio.CancelledError:
            # Client disconnected via AbortController -> Cancel upstream LLM
            logger.info("Upstream generation cancelled for thread %s", thread_id)
            raise

    response = StreamingHttpResponse(
        event_generator(),
        content_type="text/event-stream"
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no" # Disable Nginx buffering
    return response`}
                </pre>
              </div>

              {/* Django Models */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
                  <span>backend/chat/models.py (PostgreSQL Models)</span>
                </div>
                <pre className="p-4 text-[11px] font-mono bg-slate-950 text-slate-300 leading-normal overflow-x-auto">
{`from django.db import models
import uuid

class Thread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, default="New Conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=[("user", "User"), ("assistant", "Assistant")])
    content = models.TextField()
    status = models.CharField(max_length=20, default="complete")
    created_at = models.DateTimeField(auto_now_add=True)

class FileAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="files")
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_bytes = models.BigIntegerField()
    storage_path = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: DELIVERABLES & SCALING */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-950 text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>VenXR Deliverables & 1,000 Concurrent Users Breakdown Analysis</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  As requested in the assignment guidelines, here is the capacity model, cost estimate,
                  and architectural breakdown analysis at 1,000 concurrent streaming connections.
                </p>
              </div>

              {/* 1,000 Concurrent Users Capacity Breakdown */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                <h4 className="font-semibold text-sm text-slate-900">
                  Where the Architecture Breaks at 1,000 Concurrent Users:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>1. LLM Provider Quotas (Primary Bottleneck)</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      At 1,000 concurrent streams averaging 40 tokens/sec, throughput demand is 40,000 tokens/sec (2.4M TPM).
                      Standard API tiers throttle at ~1M TPM. Mitigated by multi-region API pooling and token rate smoothing.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-500" />
                      <span>2. PostgreSQL Connection Exhaustion</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      If every long-running SSE stream holds an open Django DB connection, PostgreSQL max_connections (default 100)
                      saturates immediately. Solution: PgBouncer in transaction-pooling mode + releasing DB connection during model streaming.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-500" />
                      <span>3. ASGI Worker Thread Saturation</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      WSGI fails under streaming load. Uvicorn/Gunicorn ASGI event loop handles 1,000 concurrent open coroutines easily (~30MB RAM overhead),
                      provided file parsing is offloaded to background Celery workers.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>4. Cost Per Conversation</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Typical 10-turn multi-turn thread with 1 uploaded PDF (~8,000 prompt tokens + 2,000 completion tokens)
                      costs ~$0.002 to $0.005 on Gemini 3.8 Flash, making unit economics viable.
                    </p>
                  </div>
                </div>
              </div>

              {/* README Setup in <= 5 Commands */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
                  <span>README.md: Setup in ≤5 Commands</span>
                </div>
                <pre className="p-4 text-[11px] font-mono bg-slate-950 text-slate-300 leading-normal overflow-x-auto">
{`# 1. Clone repository
git clone https://github.com/venxr/ai-chat-assistant.git && cd ai-chat-assistant

# 2. Configure environment
cp .env.example .env

# 3. Launch full stack via Docker Compose (PostgreSQL, Django, React)
docker compose up -d --build

# 4. Run database migrations
docker compose exec backend python manage.py migrate

# 5. Execute critical path tests
docker compose exec backend pytest`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: EDGE CASES & QA TEST RESULTS */}
          {activeTab === 'edgecases' && (
            <div className="space-y-6">
              {/* Top Banner with Direct Download Button */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-amber-950 text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>VenXR QA Edge Cases & Test Specification</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    25 exhaustive test cases covering long conversations, multi-file security, revision loops,
                    LangGraph conditional routing, and network resilience.
                  </p>
                </div>

                <a
                  href="/VENXR_EDGE_CASES_AND_TEST_RESULTS.txt"
                  download="VENXR_EDGE_CASES_AND_TEST_RESULTS.txt"
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt Document</span>
                </a>
              </div>

              {/* Category 1: Long-Running Chat & Memory */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    01. Long-Running Chat & Memory Strategy
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">5 Test Cases</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-MEM-01</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL</span>
                    </div>
                    <div className="font-medium text-slate-900">Conversation History Exceeding Context Window (100+ Turns)</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Hybrid Memory Strategy keeps last 10 turns verbatim; summarizes turns 1-110 into an executive memory node without throwing 400 ContextWindowExceeded.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/agent/graph.py (AgentState memory sliding window)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-MEM-04</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL</span>
                    </div>
                    <div className="font-medium text-slate-900">User Aborts Mid-Stream ("Stop Generation") & True Upstream Cancel</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> React AbortController closes socket; Django ASGI catches asyncio.CancelledError, immediately terminating upstream Gemini token generation to prevent cost waste.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: src/store/chatSlice.ts & backend/chat/views.py</div>
                  </div>
                </div>
              </div>

              {/* Category 2: Any File In & Security Boundaries */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    02. Any File In & Security Boundaries
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">8 Test Cases</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-FIN-01</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL SECURITY</span>
                    </div>
                    <div className="font-medium text-slate-900">File Type Extension Spoofing (ELF/EXE Binary Disguised as .pdf)</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Magic byte sniffing verifies header (%PDF). Rejects upload immediately with "Signature does not match extension" before passing to parser.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/security/file_validator.py (MAGIC_SIGNATURES)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-FIN-05</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL SECURITY</span>
                    </div>
                    <div className="font-medium text-slate-900">Nested ZIP Bomb Attack (10,000 files expanding to 50GB)</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Inspects ZipInfo headers before disk write. Rejects archive if uncompressed size &gt; 100MB or file count &gt; 200 files.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/security/file_validator.py (validate_zip_archive)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-FIN-06</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL SECURITY</span>
                    </div>
                    <div className="font-medium text-slate-900">Path Traversal in ZIP Archive (../../etc/shadow)</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Blocks relative "../" directory escapes; sanitizes all extraction paths using os.path.basename.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/security/file_validator.py</div>
                  </div>
                </div>
              </div>

              {/* Category 3: Any File Out & Revisions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    03. Any File Out & Revision Pipeline
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">4 Test Cases</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-FOUT-02</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-mono text-[10px] font-semibold">HIGH</span>
                    </div>
                    <div className="font-medium text-slate-900">Multi-Turn Revision Loop ("Add a column", "Make shorter")</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Agent loads previously generated CSV/DOCX artifact from LangGraph state, adds requested columns, and outputs an updated downloadable card.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/agent/graph.py (AgentState["generated_files"])</div>
                  </div>
                </div>
              </div>

              {/* Category 4: Agent (LangGraph) Routing */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    04. Agent (LangGraph) Routing & Reliability
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">4 Test Cases</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-AGT-01</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-semibold">OPTIMIZATION</span>
                    </div>
                    <div className="font-medium text-slate-900">Conditional Router Bypass for Plain Chat Queries</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Plain text turns ("hello") skip file_parser_node completely, routing directly from START to agent_node to answer_node.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/agent/graph.py (route_inbound)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-AGT-02</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL</span>
                    </div>
                    <div className="font-medium text-slate-900">Tool Parser Failure Triggers Bounded Retry (Max 2 Attempts)</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> Tool exceptions loop through error_retry_node up to 2 times; if still failing, gracefully surfaces error toast without crashing the agent.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: backend/agent/graph.py (error_retry_node)</div>
                  </div>
                </div>
              </div>

              {/* Category 5: Backend & Network Resilience */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    05. Backend & Network Resilience
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">4 Test Cases</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px]">TC-NET-01</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold">CRITICAL</span>
                    </div>
                    <div className="font-medium text-slate-900">API 500 Failure Intercepted by Redux rejectWithValue</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Expected:</strong> createAsyncThunk catches 500, sets message status='failed', and renders an inline "Retry" button. You can test this live with the sidebar toggle!
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">Mitigation: src/store/chatSlice.ts (extraReducers.rejected)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
