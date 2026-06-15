# API Reference

Base URL (local): `http://localhost:8000`
Base URL (public): your Cloudflare Tunnel URL, e.g. `https://ai.yourdomain.com`

There are two auth schemes:

- **Admin** (dashboard endpoints): header `X-Admin-Password: <ADMIN_PASSWORD>`
- **API key** (proxy endpoint): header `Authorization: Bearer sk-ollama-...`

---

## Health

```
GET /health
```

```json
{ "status": "ok", "ollama": "connected" }
```

`ollama` is `"connected"` or `"disconnected"`.

---

## Create API Key  · admin

```
POST /api/dashboard/keys
```

Body:

```json
{ "name": "Friend Laptop" }
```

Response (the **only** time `full_key` is returned):

```json
{
  "id": 1,
  "name": "Friend Laptop",
  "key_prefix": "sk-ollama-abcd",
  "full_key": "sk-ollama-abcd1234...",
  "created_at": "2026-06-15T10:00:00Z"
}
```

---

## List API Keys  · admin

```
GET /api/dashboard/keys
```

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

## Disable API Key  · admin

```
PATCH /api/dashboard/keys/{key_id}/disable
```

Marks the key inactive. Logs are preserved. Returns the updated key.

---

## Delete API Key  · admin

```
DELETE /api/dashboard/keys/{key_id}
```

Soft-delete: sets `active = false` (logs kept). Returns the updated key.

---

## Dashboard Stats  · admin

```
GET /api/dashboard/stats
```

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

## Usage Summary  · admin

```
GET /api/dashboard/usage
```

```json
{
  "total_tokens": 45000,
  "total_requests": 350,
  "fake_spend": 0.045,
  "requests_today": 42,
  "by_key": [
    {
      "api_key_id": 1,
      "api_key_name": "Friend Laptop",
      "requests": 120,
      "total_tokens": 18000,
      "fake_spend": 0.018
    }
  ]
}
```

---

## Usage Logs  · admin

```
GET /api/dashboard/logs?page=1&limit=20&api_key_id=1&status=success&model=llama3
```

All query params optional. Response:

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

## Chat Completions (proxy)  · API key

OpenAI-compatible. This is what the chat page and external clients call.

```
POST /v1/chat/completions
Authorization: Bearer sk-ollama-your-key
Content-Type: application/json
```

Body:

```json
{
  "model": "llama3",
  "messages": [{ "role": "user", "content": "Hi" }],
  "stream": false
}
```

`model` is optional; the backend falls back to `OLLAMA_DEFAULT_MODEL`.
Streaming is not supported in the first version (`stream` is forced to `false`).

Response (OpenAI style):

```json
{
  "id": "chatcmpl-local",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "llama3",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Hello! How can I help you?" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 10, "completion_tokens": 35, "total_tokens": 45 }
}
```

---

## Errors

| Status | `detail` | When |
| --- | --- | --- |
| 401 | `Missing API key` | No/blank `Authorization` header |
| 401 | `Invalid API key` | Key not found |
| 403 | `API key is disabled` | Key exists but inactive |
| 401 | `Invalid or missing admin password` | Bad/missing `X-Admin-Password` |
| 429 | `Rate limit exceeded` | Per-key per-minute limit hit |
| 503 | `Ollama is not reachable...` | Ollama not running |
| 504 | `Ollama request timed out.` | Ollama too slow |
| 404 | `Model not found. Pull the model using ollama pull MODEL_NAME.` | Model not pulled |
