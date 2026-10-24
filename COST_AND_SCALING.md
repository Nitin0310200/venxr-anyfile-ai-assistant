# Cost per Conversation & 1,000 Concurrent Users Breakdown Analysis

## 1. Rough Cost Per Conversation

### Assumptions:
- Average conversation length: **10 turns**.
- Input per turn: ~500 tokens of chat history + 1 attached file summary (~1,500 tokens) = **2,000 input tokens**.
- Output per turn: ~350 tokens = **350 output tokens**.
- Model: **Gemini 3.8 Flash**
  - Input pricing: ~$0.075 per 1M tokens ($0.000075 / 1K tokens)
  - Output pricing: ~$0.30 per 1M tokens ($0.00030 / 1K tokens)

### Calculation:
- **Total Input Tokens (10 turns)**: 20,000 tokens $\times \$0.000075 = \mathbf{\$0.0015}$
- **Total Output Tokens (10 turns)**: 3,500 tokens $\times \$0.00030 = \mathbf{\$0.00105}$
- **Total Infrastructure & Storage**: $\approx \$0.0005$
- **Total Cost per 10-turn Conversation**: **~$\mathbf{\$0.003}$ (Less than a third of a cent)**

---

## 2. Where the Architecture Breaks at 1,000 Concurrent Users

A realistic capacity breakdown of the end-to-end stack under 1,000 concurrent streaming connections:

```
┌────────────────────────┬────────────────────────────────────────────┬─────────────────────────────┐
│ Component Layer        │ Failure Point at 1,000 Concurrent Users    │ Mitigation Strategy         │
├────────────────────────┼────────────────────────────────────────────┼─────────────────────────────┤
│ 1. LLM API Rate Limits │ Standard API tier throttles at ~1M TPM.    │ Multi-key provider pooling, │
│    (Primary Bottleneck)│ 1,000 streams @ 40 tok/s = 2.4M TPM.       │ rate limit backoff & jitter │
├────────────────────────┼────────────────────────────────────────────┼─────────────────────────────┤
│ 2. PostgreSQL DB Conns │ PostgreSQL default max_connections (100)   │ PgBouncer transaction mode; │
│    (Database Saturated)│ exhausts instantly if streams hold conn.   │ close conn during stream.   │
├────────────────────────┼────────────────────────────────────────────┼─────────────────────────────┤
│ 3. ASGI Event Loop     │ WSGI crashes. ASGI (Uvicorn) holds 1,000   │ Run 4-8 Uvicorn worker      │
│    (Process Memory)    │ coroutines (~30MB RAM overhead easily).    │ processes behind Nginx.     │
├────────────────────────┼────────────────────────────────────────────┼─────────────────────────────┤
│ 4. File I/O & Memory   │ Concurrent parsing of large PDFs/ZIPs      │ Offload heavy file parsing  │
│    (CPU Exhaustion)    │ locks event loop and exhausts host RAM.    │ to Celery background queue. │
└────────────────────────┴────────────────────────────────────────────┴─────────────────────────────┘
```

### Detailed Breakdown:

1. **LLM Quota Exhaustion (The First Failure Point)**:
   - 1,000 concurrent streaming requests consuming 40 tokens per second will request 40,000 completion tokens per second (2.4 million tokens per minute).
   - Most LLM providers enforce organization-level rate limits of 1,000,000 to 2,000,000 TPM on standard tiers. Requests exceeding this threshold receive HTTP 429 errors.
   - *Fix*: Implement token rate smoothing, exponential backoff with jitter, and route overflow traffic to secondary model fallbacks.

2. **Database Connection Saturation (The Second Failure Point)**:
   - If the Django view opens a database transaction or holds an active connection for the duration of the 15-to-30-second streaming response, PostgreSQL's connection pool saturates immediately.
   - *Fix*: Decouple database reads/writes: fetch thread context and close the connection before entering the streaming generator loop; reopen briefly at `[DONE]` to commit checkpoint. Place PgBouncer in front of PostgreSQL.

3. **ASGI Server Memory & File I/O**:
   - ASGI coroutines are lightweight (~20-50KB each). 1,000 open SSE connections consume only ~30-50MB of RAM.
   - However, if 1,000 users upload 20MB files simultaneously, synchronous CPU parsing would freeze the async event loop.
   - *Fix*: Move file ingestion to background workers (Celery/RQ) with S3-compatible object storage (MinIO) and presigned URLs.
