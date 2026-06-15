# Backend — Local Ollama AI Dashboard

FastAPI proxy that sits between the online frontend and your local Ollama
install. It validates API keys, forwards chat requests to Ollama, logs usage,
and serves dashboard stats.

```
Frontend → Backend Proxy (this) → Ollama
```

The user **never** talks to Ollama directly.

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com) installed and running locally
- A pulled model, e.g. `ollama pull llama3`

## Quick start (Windows)

The easiest path — double-click or run from the `backend\` folder:

```bat
run_backend.bat
```

This creates a virtualenv, installs dependencies, copies `.env.example` to
`.env` if needed, and starts the server with auto-reload.

## Manual start

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # then edit .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Test it:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{ "status": "ok", "ollama": "connected" }
```

## Environment variables

Copy `.env.example` to `.env` and edit. Key ones:

| Variable | Purpose |
| --- | --- |
| `FRONTEND_URL` | Comma-separated allowed CORS origins (your frontend URLs) |
| `OLLAMA_BASE_URL` | Where Ollama runs (default `http://localhost:11434`) |
| `OLLAMA_DEFAULT_MODEL` | Model used when a request omits `model` |
| `API_KEY_SECRET_PEPPER` | Secret mixed into key hashes — **change this** |
| `ADMIN_PASSWORD` | Password the dashboard sends to read admin endpoints — **change this** |
| `RATE_LIMIT_PER_MINUTE` | Per-key request cap (set 0 to disable) |
| `LOG_PROMPTS` / `PROMPT_PREVIEW_CHARS` | Prompt-logging privacy controls |

## Authentication model

- **Proxy endpoint** (`POST /v1/chat/completions`): authenticated with a
  per-user API key via `Authorization: Bearer sk-ollama-...`.
- **Dashboard/admin endpoints** (`/api/dashboard/*`): authenticated with the
  shared admin password via the `X-Admin-Password` header.

API keys are stored only as a SHA-256 hash of `key + pepper`. The full key is
returned exactly once at creation time and never persisted.

## Endpoints

See [`../docs/api-reference.md`](../docs/api-reference.md) for full details.

- `GET /health`
- `POST /api/dashboard/keys` — create key (admin)
- `GET /api/dashboard/keys` — list keys (admin)
- `PATCH /api/dashboard/keys/{id}/disable` — disable key (admin)
- `DELETE /api/dashboard/keys/{id}` — soft-delete key (admin)
- `GET /api/dashboard/stats` — overview stats (admin)
- `GET /api/dashboard/usage` — usage summary (admin)
- `GET /api/dashboard/logs` — paginated logs (admin)
- `POST /v1/chat/completions` — OpenAI-compatible proxy (API key)

Interactive docs are available at <http://localhost:8000/docs> while running.
