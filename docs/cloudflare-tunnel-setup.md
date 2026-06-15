# Cloudflare Tunnel Setup

The backend runs locally on the owner's laptop at `http://localhost:8000`.
Cloudflare Tunnel exposes it to the internet at a public URL so the deployed
frontend can reach it.

```
Cloudflare Tunnel → FastAPI backend (localhost:8000) → Ollama (localhost:11434)
```

> **Only expose the FastAPI backend. Never expose Ollama directly.**

## Install cloudflared

- Windows: download from
  <https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/>
  or `winget install --id Cloudflare.cloudflared`.
- Verify: `cloudflared --version`

---

## Option A — Quick temporary tunnel (best for testing)

No Cloudflare account or domain required.

```bash
cloudflared tunnel --url http://localhost:8000
```

You'll get a temporary URL like:

```
https://random-name.trycloudflare.com
```

Put it in the frontend env:

```env
NEXT_PUBLIC_BACKEND_URL=https://random-name.trycloudflare.com
```

The URL changes every time you restart the tunnel.

---

## Option B — Named tunnel with a custom domain (stable)

Requires a domain managed in Cloudflare.

```bash
cloudflared tunnel login
cloudflared tunnel create local-ollama-ai
cloudflared tunnel route dns local-ollama-ai ai.yourdomain.com
```

Create the config file.

Windows path:

```
C:\Users\YOUR_NAME\.cloudflared\config.yml
```

Contents:

```yaml
tunnel: local-ollama-ai
credentials-file: C:\Users\YOUR_NAME\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: ai.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

Run it:

```bash
cloudflared tunnel run local-ollama-ai
```

Then set the frontend env:

```env
NEXT_PUBLIC_BACKEND_URL=https://ai.yourdomain.com
```

---

## After the tunnel is up

1. Add the tunnel/public URL **and** your deployed frontend URL to the backend
   `FRONTEND_URL` (comma-separated) so CORS allows the browser requests.
2. Restart the backend after editing `.env`.
3. Test from another device:

   ```bash
   curl https://ai.yourdomain.com/health
   ```

## Keep it running

For your friend to use the model, the owner's laptop must stay:

- Powered on and not sleeping
- Connected to the internet
- Running Ollama, the backend, and the tunnel

Tip (Windows): set Power & sleep to "Never" while hosting.

## References

- Cloudflare Tunnel: <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/>
- Setup guide: <https://developers.cloudflare.com/tunnel/setup/>
- TryCloudflare: <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/>
