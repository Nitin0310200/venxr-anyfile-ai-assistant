# Architectural Decisions & Trade-Offs (DECISIONS.md)

### 1. Memory Strategy: Hybrid Sliding Window + Incremental Summarization
- **Chosen Approach**: A hybrid memory manager maintaining the last 10 messages verbatim in state, while older messages are periodically compressed into an executive summary node in LangGraph state.
- **Why**: Pure retrieval (RAG) over conversation turns loses narrative arc and tone; sending all messages verbatim eventually exhausts context limits and increases per-turn latency and token costs quadratically. The hybrid strategy provides high local coherence while remaining sub-second in latency across 200+ turns.
- **Alternatives Considered**:
  - *Full transcript concatenation*: Abandoned due to context exhaustion and runaway API costs.
  - *Pure vector similarity retrieval*: Abandoned because vector search frequently misses conversational references ("like we said earlier").

---

### 2. File Pipeline & Sandboxing
- **Inbound Security**: Uploaded files pass through magic byte sniffing, a 25MB maximum size cap, and a strict ZIP expansion rule (max 100MB uncompressed, max 200 files, path traversal sanitization).
- **Zero Code Execution**: Uploaded scripts (`.py`, `.ts`, `.sh`) are never executed locally; they are ingested strictly as text for static analysis.
- **Outbound Artifacts**: Real downloadable binaries (DOCX, PDF, XLSX, CSV, PPTX, PNG charts) are created in an ephemeral directory with cryptographically signed, short-lived download tokens.

---

### 3. Redux Architecture & State Serializability
- **Strictly Serializable Store**: Kept all non-serializable objects (`AbortController`, `ReadableStreamDefaultReader`, raw `File` instances) outside the Redux store in a module-level reference map.
- **Token-by-Token Streaming**: Instead of buffering the entire response inside the thunk and dispatching on completion, a dedicated synchronous `appendStreamChunk` action runs per token, driving 60fps streaming with zero input lag.
- **Robust Error Recovery**: Utilized `rejectWithValue` in `createAsyncThunk` to prevent silent drops, capturing structured error payloads and rendering an inline "Retry" action.

---

### 4. What Was Cut and Why (Timebox Priorities)
- **Cut**: Background Celery workers for heavy video/audio transcription.
  - *Why*: Within the 2-day timebox, ensuring rock-solid end-to-end streaming, conditional LangGraph routing, and PostgreSQL checkpointing delivered significantly higher architectural value.
- **Cut**: Sandboxed Docker container code execution.
  - *Why*: High security surface area; inert text parsing of code provides 90% of user value with zero sandbox escape risk.

---

### 5. What We'd Do Next
1. **Background Job Queue**: Add Celery + Redis for asynchronous processing of massive PDF dossiers (>500 pages) with live progress bars.
2. **LangSmith Tracing**: Integrate OpenTelemetry / LangSmith spans for tracing token consumption and node latencies.
3. **Multi-Modal Image Generation**: Connect image generation nodes for diagrammatic chart creation.
