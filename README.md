# Local Ollama AI Dashboard

Run an AI model on **your own laptop** with [Ollama](https://ollama.com), and
let a friend use it from an online frontend — without touching their GPU/RAM and
without paying for an API. All requests flow through a secure FastAPI proxy that
validates API keys and logs usage.

```
Friend's Browser
      ↓
Online Frontend (Vercel/Netlify)
      ↓
Cloudflare Tunnel public URL
      ↓
FastAPI Backend Proxy  ← runs on owner's laptop
      ↓
Ollama  ← runs on owner's laptop (uses owner's RAM/GPU)
      ↓
Response + usage logged to SQLite
```

The user **never** connects to Ollama directly.

## Features

- 🔐 **API key auth** — OpenAI/Stripe-style `sk-ollama-...` keys; only a salted
  SHA-256 hash is stored, full key shown once.
- 🔁 **OpenAI-compatible proxy** — `POST /v1/chat/completions`, works with the
  built-in chat page and external clients.
- 📊 **Dashboard** — requests, latency, tokens, fake spend, failed requests.
- 📜 **Usage logs** — per-request model, status, latency, tokens, prompt preview.
- 🔑 **Key management** — create, disable, soft-delete; per-key usage.
- 🛡️ **Security** — CORS allow-list, per-key rate limiting, prompt truncation,
  admin-password-protected dashboard endpoints.
- 🎨 **Dark, modern dashboard UI** built with Next.js + Tailwind.

## Repository layout

```
local-ollama-ai-dashboard/
├── backend/     FastAPI + SQLAlchemy + SQLite proxy   (runs on owner's laptop)
├── frontend/    Next.js + TypeScript + Tailwind UI    (deployed online)
├── docs/        Cloudflare tunnel, API reference, deployment
├── README.md
└── PROJECT_PLAN.md
```

## Quick start

### 1. Ollama

```bash
ollama serve
ollama pull llama3
```

### 2. Backend (owner's laptop)

```bash
cd backend
run_backend.bat          # Windows: venv + install + run
# or manually:
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env    # edit ADMIN_PASSWORD + API_KEY_SECRET_PEPPER
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Check: `curl http://localhost:8000/health`

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # set NEXT_PUBLIC_BACKEND_URL
npm run dev
```

Open <http://localhost:3000>.

### 4. Expose backend publicly

```bash
cloudflared tunnel --url http://localhost:8000
```

Put the printed URL into the frontend `NEXT_PUBLIC_BACKEND_URL` and add it to the
backend `FRONTEND_URL`. Full guide: [`docs/deployment-guide.md`](docs/deployment-guide.md).

## Using it

1. Open the dashboard, set the admin password (top-right).
2. **API Keys → New Key** → copy the full key (shown once).
3. Share the key + `/chat` URL with your friend.
4. They enter the key on the chat page and message your local model.

## Documentation

- [Cloudflare Tunnel setup](docs/cloudflare-tunnel-setup.md)
- [API reference](docs/api-reference.md)
- [Deployment guide](docs/deployment-guide.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## Tech stack

**Backend:** Python, FastAPI, SQLAlchemy, SQLite, httpx, Pydantic.
**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
**Networking:** Cloudflare Tunnel.

## Notes & limits

- First version uses SQLite for zero-config local setup; can move to
  PostgreSQL/Supabase later by changing `DATABASE_URL`.
- Streaming responses, JWT admin login, and charts are listed as future
  improvements in [`PROJECT_PLAN.md`](PROJECT_PLAN.md).
- The owner's laptop must stay awake/online while hosting.
