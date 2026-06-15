# Frontend — Local Ollama AI Dashboard

Next.js (App Router) + TypeScript + Tailwind CSS. A dark, premium dashboard for
managing API keys, viewing usage/logs, and a chat page that talks to the
backend proxy.

## Requirements

- Node.js 18.18+ (Node 20+ recommended)
- The backend running (locally or via Cloudflare Tunnel)

## Setup

```bash
cd frontend
npm install
copy .env.example .env.local      # Windows  (cp on macOS/Linux)
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | Backend base URL. Local: `http://localhost:8000`. Online: your Cloudflare Tunnel URL. |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Optional fallback admin password. You can also set it at runtime in the dashboard top bar (stored in the browser). |

## Pages

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Overview cards (requests, latency, tokens, spend…) |
| `/dashboard/keys` | Create / list / disable / delete API keys |
| `/dashboard/logs` | Paginated, filterable request logs |
| `/dashboard/usage` | Token totals, fake spend, usage per key |
| `/chat` | Chat UI — enter an API key + model and message the local model |

## How auth works in the UI

- **Dashboard pages** call admin endpoints and send the `X-Admin-Password`
  header. Set the password in the top-right field (saved to `localStorage`) or
  via `NEXT_PUBLIC_ADMIN_PASSWORD`.
- **Chat page** uses a per-user API key (the `sk-ollama-...` key created in the
  dashboard), sent as `Authorization: Bearer ...`. It is saved in the browser
  for convenience and never committed.

## Deploy

Deploy to Vercel (recommended), Netlify, or Cloudflare Pages. Set
`NEXT_PUBLIC_BACKEND_URL` to your Cloudflare Tunnel public URL. See
[`../docs/deployment-guide.md`](../docs/deployment-guide.md).
