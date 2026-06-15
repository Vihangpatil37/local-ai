# Deployment Guide

This project has three pieces:

| Piece | Where it runs | Why |
| --- | --- | --- |
| Ollama | Owner's laptop | Runs the model on the owner's GPU/RAM |
| FastAPI backend | Owner's laptop | Must reach Ollama on localhost |
| Next.js frontend | Vercel / Netlify / Cloudflare Pages | Public site friends open |

The backend is published to the internet with **Cloudflare Tunnel** — see
[`cloudflare-tunnel-setup.md`](./cloudflare-tunnel-setup.md).

---

## 1. Prepare the owner's laptop

### Install + run Ollama

```bash
ollama serve
ollama pull llama3
ollama run llama3      # optional sanity check
```

### Run the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env`:

- Set a strong `API_KEY_SECRET_PEPPER`.
- Set a strong `ADMIN_PASSWORD`.
- Add your frontend URL(s) to `FRONTEND_URL` (comma-separated).

Start it:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

(Windows shortcut: just run `run_backend.bat`.)

Test: `curl http://localhost:8000/health`

### Start the tunnel

Quick test:

```bash
cloudflared tunnel --url http://localhost:8000
```

Stable: see the named-tunnel option in the Cloudflare doc.

Note the public URL it prints — you'll use it next.

---

## 2. Deploy the frontend

### Vercel (recommended)

1. Push this repo to GitHub.
2. In Vercel, **New Project → import the repo**.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Next.js** (auto-detected).
5. Add environment variable:

   ```
   NEXT_PUBLIC_BACKEND_URL = https://your-tunnel-url
   ```

6. Deploy. You get a URL like `https://your-app.vercel.app`.

### Netlify / Cloudflare Pages

Same idea: base directory `frontend`, build command `npm run build`, and set
`NEXT_PUBLIC_BACKEND_URL`. (Cloudflare Pages: use the Next.js preset.)

---

## 3. Wire CORS

Add the deployed frontend URL to the backend `FRONTEND_URL`, e.g.:

```env
FRONTEND_URL=http://localhost:3000,https://your-app.vercel.app
```

Restart the backend.

---

## 4. Give your friend access

1. Open your deployed dashboard, enter the **admin password** (top-right).
2. Go to **API Keys → New Key**, name it, and copy the full key once.
3. Send your friend the key + the chat URL (`https://your-app.vercel.app/chat`).
4. They paste the key into the chat page and start messaging. Inference runs on
   **your** laptop; their device only renders the UI.

---

## 5. Keep it alive

While hosting, the owner's laptop must stay powered on, awake, online, with
Ollama + backend + tunnel all running. If it sleeps or shuts down, the friend
can't use the model.

---

## Hardening checklist (before sharing widely)

- [ ] Strong, unique `ADMIN_PASSWORD` and `API_KEY_SECRET_PEPPER`
- [ ] `FRONTEND_URL` lists only real origins (no `*`)
- [ ] Rate limit set sensibly (`RATE_LIMIT_PER_MINUTE`)
- [ ] One API key per friend/device (easy to revoke)
- [ ] Ollama port (11434) **not** exposed by the tunnel — only port 8000
- [ ] Consider `LOG_PROMPTS=false` if prompts are sensitive
