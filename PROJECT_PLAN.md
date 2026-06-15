# Local Ollama Online AI Dashboard Project Plan

## Goal

Build a complete project where:

- The AI model runs locally on the owner's laptop using Ollama.
- The friend/user accesses the model from an online frontend.
- The friend's GPU/RAM is not used.
- All AI requests go through a secure backend proxy.
- The backend validates API keys before allowing requests.
- The backend logs usage, latency, model name, token counts, and request status.
- The dashboard shows overview stats, API keys, logs, and usage.
- Cloudflare Tunnel is used to expose the local backend to the internet.
- Frontend and backend must be split into separate folders.

---

## Final Architecture

```txt
Friend/User Browser
        ↓
Online Frontend deployed on Vercel/Netlify
        ↓
Cloudflare Tunnel Public URL
        ↓
FastAPI Backend Proxy running on owner's laptop
        ↓
Ollama running locally on owner's laptop
        ↓
Local AI model uses owner's RAM/GPU
        ↓
Response returns to friend/user
        ↓
Usage logs saved in database
```

The user must never connect directly to Ollama.

Correct:

```txt
Frontend → Backend Proxy → Ollama
```

Wrong:

```txt
Frontend → Ollama directly
```

---

## Project Folder Structure

Create the project like this:

```txt
local-ollama-ai-dashboard/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── ollama_client.py
│   │   │
│   │   ├── routers/
│   │   │   ├── dashboard.py
│   │   │   ├── keys.py
│   │   │   ├── logs.py
│   │   │   ├── proxy.py
│   │   │   └── health.py
│   │   │
│   │   └── services/
│   │       ├── api_key_service.py
│   │       ├── usage_service.py
│   │       └── stats_service.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   ├── README.md
│   └── run_backend.bat
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── keys/
│   │   │   │   └── page.tsx
│   │   │   ├── logs/
│   │   │   │   └── page.tsx
│   │   │   └── usage/
│   │   │       └── page.tsx
│   │   └── chat/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── DashboardCard.tsx
│   │   ├── CreateApiKeyModal.tsx
│   │   ├── ApiKeyTable.tsx
│   │   ├── LogsTable.tsx
│   │   ├── ChatBox.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── tailwind.config.ts
│
├── docs/
│   ├── cloudflare-tunnel-setup.md
│   ├── api-reference.md
│   └── deployment-guide.md
│
├── README.md
└── PROJECT_PLAN.md
```

---

## Backend Requirements

Use:

- Python
- FastAPI
- SQLAlchemy
- SQLite for first version
- httpx for forwarding requests to Ollama
- python-dotenv for environment variables
- CORS middleware
- Pydantic schemas

Later, SQLite can be replaced with PostgreSQL/Supabase, but first version should use SQLite for simple local setup.

---

## Backend Responsibilities

The backend must do these things:

1. Run locally on the owner's laptop.
2. Expose API endpoints for the frontend.
3. Validate API keys before AI requests.
4. Forward valid AI requests to local Ollama.
5. Save logs for every request.
6. Calculate latency.
7. Count tokens when available.
8. Return the AI response to the frontend.
9. Provide dashboard stats.
10. Provide API key management.

---

## Backend Environment Variables

Create `backend/.env.example`:

```env
APP_NAME=Local Ollama AI Dashboard
ENVIRONMENT=development

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

FRONTEND_URL=http://localhost:3000

DATABASE_URL=sqlite:///./ollama_dashboard.db

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3

API_KEY_PREFIX=sk-ollama
API_KEY_SECRET_PEPPER=change-this-random-secret

FAKE_COST_PER_TOKEN=0.000001
```

---

## Backend API Endpoints

### Health

```txt
GET /health
```

Returns:

```json
{
  "status": "ok",
  "ollama": "connected"
}
```

---

### Create API Key

```txt
POST /api/dashboard/keys
```

Body:

```json
{
  "name": "Friend Laptop"
}
```

Response:

```json
{
  "id": 1,
  "name": "Friend Laptop",
  "key_prefix": "sk-ollama-abcd",
  "full_key": "sk-ollama-abcd1234...",
  "created_at": "2026-06-15T10:00:00Z"
}
```

Important:

- Show `full_key` only one time.
- Store only hashed key in database.
- Never store the full key.

---

### List API Keys

```txt
GET /api/dashboard/keys
```

Response:

```json
[
  {
    "id": 1,
    "name": "Friend Laptop",
    "key_prefix": "sk-ollama-abcd",
    "requests_count": 15,
    "total_tokens": 4500,
    "active": true,
    "last_used_at": "2026-06-15T10:10:00Z",
    "created_at": "2026-06-15T10:00:00Z"
  }
]
```

---

### Disable API Key

```txt
PATCH /api/dashboard/keys/{key_id}/disable
```

This should disable the key but not delete logs.

---

### Delete API Key

```txt
DELETE /api/dashboard/keys/{key_id}
```

This should delete or soft-delete the key.

Recommended: soft delete using `active = false`.

---

### Dashboard Stats

```txt
GET /api/dashboard/stats
```

Response:

```json
{
  "requests_today": 42,
  "total_requests": 350,
  "average_latency_ms": 3290,
  "active_keys": 3,
  "total_tokens_today": 12000,
  "fake_spend_today": 0.012,
  "failed_requests_today": 2
}
```

---

### Usage Logs

```txt
GET /api/dashboard/logs
```

Optional query params:

```txt
?page=1&limit=20&api_key_id=1&status=success
```

Response:

```json
{
  "items": [
    {
      "id": 1,
      "api_key_name": "Friend Laptop",
      "model": "llama3",
      "status": "success",
      "latency_ms": 3290,
      "prompt_preview": "Hi",
      "prompt_tokens": 10,
      "completion_tokens": 35,
      "total_tokens": 45,
      "created_at": "2026-06-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## AI Proxy Endpoints

The backend must support OpenAI-compatible chat format because online frontends and many AI clients expect this.

### Main Proxy Endpoint

```txt
POST /v1/chat/completions
```

Headers:

```txt
Authorization: Bearer sk-ollama-your-key
Content-Type: application/json
```

Body:

```json
{
  "model": "llama3",
  "messages": [
    {
      "role": "user",
      "content": "Hi"
    }
  ],
  "stream": false
}
```

Response should follow OpenAI-style response format:

```json
{
  "id": "chatcmpl-local",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "llama3",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 35,
    "total_tokens": 45
  }
}
```

---

## Ollama Connection

Ollama runs locally on the owner's laptop:

```txt
http://localhost:11434
```

Backend should forward to Ollama:

```txt
POST http://localhost:11434/v1/chat/completions
```

Preferred option:

Use Ollama's OpenAI-compatible endpoint:

```txt
/v1/chat/completions
```

Fallback option:

If needed, convert OpenAI message format to Ollama native format and call:

```txt
/api/chat
```

or:

```txt
/api/generate
```

---

## API Key Security

API keys must work like OpenAI/GitHub/Stripe keys.

### API key generation format

Use format:

```txt
sk-ollama-randomsecurestring
```

Example:

```txt
sk-ollama-a82kdn29xks92la88s
```

### Storage rule

Never store the full API key.

Store only:

```txt
SHA-256 hash of key + secret pepper
```

Also store:

```txt
key_prefix = first 12-16 characters
```

Dashboard should only show:

```txt
sk-ollama-a82k****
```

### Validation flow

```txt
1. Request comes with Authorization header
2. Backend extracts Bearer token
3. Backend hashes token with same method
4. Backend checks database
5. If valid and active, continue
6. If invalid, return 401 or 403
```

---

## Usage Logging

For every AI request, save:

```txt
api_key_id
timestamp
model
prompt_preview
status
latency_ms
prompt_tokens
completion_tokens
total_tokens
error_message if failed
```

Prompt privacy:

- Do not store full prompt by default.
- Store only first 200 or 500 characters.
- Add config option to disable prompt logging.

---

## Database Models

### APIKey Table

```txt
id
name
key_hash
key_prefix
active
requests_count
total_tokens
created_at
last_used_at
```

### UsageLog Table

```txt
id
api_key_id
model
status
prompt_preview
latency_ms
prompt_tokens
completion_tokens
total_tokens
error_message
created_at
```

---

## Frontend Requirements

Use:

- Next.js
- TypeScript
- Tailwind CSS
- Axios or fetch
- Responsive dashboard UI
- Dark premium dashboard design
- Separate pages for dashboard, API keys, logs, usage, and chat

---

## Frontend Environment Variables

Create `frontend/.env.example`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

When deployed online, use Cloudflare Tunnel public URL:

```env
NEXT_PUBLIC_BACKEND_URL=https://ai.yourdomain.com
```

---

## Frontend Pages

### Home Page

Path:

```txt
/
```

Purpose:

- Landing page
- Explain private local AI access
- Button to open chat/dashboard

---

### Dashboard Overview

Path:

```txt
/dashboard
```

Show cards:

```txt
Requests Today
Total Requests
Average Latency
Active API Keys
Tokens Today
Fake Spend Today
Failed Requests
```

---

### API Keys Page

Path:

```txt
/dashboard/keys
```

Features:

- Create new API key
- Show full key only once
- Copy key button
- List existing keys
- Show key prefix only
- Show last used time
- Disable key
- Delete/soft-delete key

---

### Logs Page

Path:

```txt
/dashboard/logs
```

Features:

- Table of AI requests
- Show user/key name
- Model used
- Prompt preview
- Latency
- Status
- Token count
- Time
- Filter by key/status/model

---

### Usage Page

Path:

```txt
/dashboard/usage
```

Features:

- Total tokens
- Daily requests
- Fake spend
- Usage by API key
- Simple chart if possible

---

### Chat Page

Path:

```txt
/chat
```

Features:

- Text input
- Send button
- Model selector
- API key input field
- Chat messages display
- Loading state
- Error message if API key invalid
- Response streaming optional, not required in first version

The chat page must send requests to:

```txt
POST {NEXT_PUBLIC_BACKEND_URL}/v1/chat/completions
```

with:

```txt
Authorization: Bearer user_entered_api_key
```

---

## Cloudflare Tunnel Setup

The backend runs locally on owner's laptop:

```txt
http://localhost:8000
```

Cloudflare Tunnel exposes this backend publicly.

Final public URL example:

```txt
https://ai.yourdomain.com
```

That public URL points to:

```txt
http://localhost:8000
```

### Important

Only expose the FastAPI backend.

Do not expose Ollama directly.

Correct:

```txt
Cloudflare Tunnel → FastAPI backend → Ollama
```

Wrong:

```txt
Cloudflare Tunnel → Ollama directly
```

---

## Cloudflare Tunnel Quick Setup

### Option A: Quick temporary tunnel

Useful for testing:

```bash
cloudflared tunnel --url http://localhost:8000
```

This gives a temporary URL like:

```txt
https://random-name.trycloudflare.com
```

Use this URL in frontend env:

```env
NEXT_PUBLIC_BACKEND_URL=https://random-name.trycloudflare.com
```

### Option B: Named tunnel with custom domain

Use this for serious setup.

Commands:

```bash
cloudflared tunnel login
cloudflared tunnel create local-ollama-ai
cloudflared tunnel route dns local-ollama-ai ai.yourdomain.com
```

Create Cloudflare config file:

Windows path example:

```txt
C:\Users\YOUR_NAME\.cloudflared\config.yml
```

Config:

```yaml
tunnel: local-ollama-ai
credentials-file: C:\Users\YOUR_NAME\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: ai.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

Run tunnel:

```bash
cloudflared tunnel run local-ollama-ai
```

---

## Local Development Commands

### Start Ollama

```bash
ollama serve
```

Pull a model:

```bash
ollama pull llama3
```

Run test:

```bash
ollama run llama3
```

---

### Start Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Test backend:

```bash
curl http://localhost:8000/health
```

---

### Start Cloudflare Tunnel

Temporary:

```bash
cloudflared tunnel --url http://localhost:8000
```

Named:

```bash
cloudflared tunnel run local-ollama-ai
```

---

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend local URL:

```txt
http://localhost:3000
```

---

## Production-Like Deployment

### Frontend

Deploy frontend to:

```txt
Vercel
Netlify
Cloudflare Pages
```

Recommended:

```txt
Vercel
```

Set environment variable:

```env
NEXT_PUBLIC_BACKEND_URL=https://ai.yourdomain.com
```

### Backend

Backend remains on owner's laptop because it must access local Ollama.

Backend is exposed using Cloudflare Tunnel.

### Ollama

Ollama remains local on owner's laptop.

---

## Runtime Requirements

The owner's laptop must stay:

```txt
Powered on
Connected to internet
Not sleeping
Ollama running
Backend running
Cloudflare Tunnel running
```

If the laptop sleeps or shuts down, the friend cannot use the model.

---

## Security Requirements

Must implement:

```txt
API key validation
CORS allowed frontend URL only
No direct Ollama exposure
Prompt preview truncation
Basic rate limiting per API key
Disable/delete API key
Do not store full API keys
Do not expose backend admin endpoints publicly without protection
```

For first version, dashboard admin protection can be simple:

```txt
ADMIN_PASSWORD in backend .env
```

Then frontend sends admin password for dashboard endpoints.

Better later:

```txt
JWT login system
```

---

## CORS Rules

Backend should allow:

```txt
http://localhost:3000
https://your-frontend.vercel.app
```

Do not use wildcard `*` in final production.

---

## Rate Limiting

Add basic rate limit per API key:

Example:

```txt
60 requests per minute per API key
```

If exceeded:

```json
{
  "detail": "Rate limit exceeded"
}
```

---

## Error Handling

Backend should return clear errors:

### Missing API key

```json
{
  "detail": "Missing API key"
}
```

### Invalid API key

```json
{
  "detail": "Invalid API key"
}
```

### Ollama offline

```json
{
  "detail": "Ollama is not reachable. Make sure Ollama is running on the owner's laptop."
}
```

### Model missing

```json
{
  "detail": "Model not found. Pull the model using ollama pull MODEL_NAME."
}
```

---

## Minimum Working Version

Build this first:

```txt
1. Backend health route
2. SQLite database
3. Create API key route
4. List API keys route
5. OpenAI-compatible proxy route
6. Usage logging
7. Dashboard stats route
8. Simple Next.js dashboard
9. Simple chat page
10. Cloudflare Tunnel setup docs
```

---

## Future Improvements

After MVP works:

```txt
JWT admin login
Streaming responses
Charts for usage
PostgreSQL/Supabase support
User accounts
Per-key model permissions
Per-key monthly limits
Per-key token limits
Better billing simulation
Docker support
Windows startup scripts
System tray launcher
```

---

## Acceptance Criteria

The project is complete only when:

```txt
1. Owner can run Ollama locally.
2. Owner can run FastAPI backend locally.
3. Owner can expose backend through Cloudflare Tunnel.
4. Frontend can be deployed online.
5. Friend can open frontend from another device.
6. Friend can enter API key and send message.
7. AI response comes from owner's local Ollama model.
8. Friend's GPU/RAM is not used for model inference.
9. Dashboard shows total requests.
10. Dashboard shows latency.
11. Dashboard shows active API keys.
12. Dashboard shows logs.
13. API key can be created.
14. API key can be disabled.
15. Invalid API key is rejected.
```

---

## Important Build Notes for AI Agent

- Do not combine frontend and backend in one folder.
- Do not expose Ollama directly.
- Do not store full API keys.
- Do not hard-code API keys in frontend.
- Use OpenAI-compatible `/v1/chat/completions` route.
- Keep backend local on owner's laptop.
- Use Cloudflare Tunnel for public access.
- Make the UI clean, modern, dark, and dashboard-style.
- Keep the code simple enough for a beginner to run.
- Include README files with step-by-step commands.
- Include `.env.example` files for both frontend and backend.
- Include Windows-friendly commands because the owner is likely using Windows.
- First build a working MVP, then add advanced features.

---

## Official References

- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
- Cloudflare Tunnel setup: https://developers.cloudflare.com/tunnel/setup/
- TryCloudflare quick tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Ollama API introduction: https://docs.ollama.com/api/introduction
- Ollama OpenAI compatibility: https://docs.ollama.com/api/openai-compatibility
