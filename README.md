# VenXR AI Chat Assistant

An end-to-end AI chat assistant built for the VenXR take-home assignment. It handles multi-turn conversations across hundreds of messages, multi-file inputs ("any file in"), multi-file outputs ("any file out"), a graph-based LangGraph agent with checkpointing, a Django ASGI backend with streaming, and a React frontend powered by Redux Toolkit with `createAsyncThunk`.

---

## Setup in $\le 5$ Commands (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/venxr/ai-chat-assistant.git && cd ai-chat-assistant

# 2. Configure environment variables
cp .env.example .env

# 3. Spin up full stack (PostgreSQL, Django backend, React frontend)
docker compose up -d --build

# 4. Apply database migrations
docker compose exec backend python manage.py migrate

# 5. Execute critical path test suite
docker compose exec backend pytest
```

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│               REACT FRONTEND (PORT 3000)               │
│                                                        │
│  • Redux Toolkit Store with createAsyncThunk           │
│  • Strictly Serializable State (plain JSON only)       │
│  • Real-time SSE token stream with AbortController     │
│  • Architecture & Code Inspector Drawer (Interview)    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST / SSE Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│               DJANGO ASGI BACKEND (PORT 8000)          │
│                                                        │
│  • StreamingHttpResponse (event: token, file, done)    │
│  • Upstream cancellation on client socket close        │
│  • Security: Magic bytes, 25MB cap, ZIP bomb guard     │
│  • PostgreSQL ORM: Thread, Message, FileAttachment     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               LANGGRAPH CONDITIONAL GRAPH              │
│                                                        │
│   START ──► [Has Files?] ──► file_parser_node          │
│                   │                │                   │
│                   ▼                ▼                   │
│             agent_node ◄───────────┘                   │
│                   │                                    │
│       ┌───────────┴───────────┐                        │
│       ▼                       ▼                        │
│  file_generator_node     answer_node (SSE stream)      │
│       │                       │                        │
│       └───────────────────────▼                        │
│                    POSTGRES CHECKPOINTER ──► END       │
└────────────────────────────────────────────────────────┘
```

---

## Environment Variables (`.env.example`)

```env
# Gemini API Key for model inference
GEMINI_API_KEY="your-api-key-here"

# PostgreSQL connection string
DATABASE_URL="postgresql://venxr_user:venxr_pass@postgres:5432/venxr_db"

# Server configuration
DJANGO_SECRET_KEY="production-secret-key-change-me"
DEBUG=False
ALLOWED_HOSTS="localhost,127.0.0.1,0.0.0.0"
```
