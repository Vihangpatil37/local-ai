import type {
  ApiKey,
  ChatCompletionResponse,
  ChatMessage,
  CreatedApiKey,
  DashboardStats,
  UsageLogList,
  UsageSummary,
} from "./types";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const ADMIN_PASSWORD_STORAGE_KEY = "ollama_dashboard_admin_password";

/** Read the admin password: localStorage (set in the UI) wins, env is fallback. */
export function getAdminPassword(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
}

export function setAdminPassword(password: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
  }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": getAdminPassword(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- Dashboard ----------
export const getStats = () =>
  adminRequest<DashboardStats>("/api/dashboard/stats");

export const getUsage = () =>
  adminRequest<UsageSummary>("/api/dashboard/usage");

export function getLogs(params: {
  page?: number;
  limit?: number;
  api_key_id?: number;
  status?: string;
  model?: string;
} = {}): Promise<UsageLogList> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) query.set(k, String(v));
  });
  const qs = query.toString();
  return adminRequest<UsageLogList>(`/api/dashboard/logs${qs ? `?${qs}` : ""}`);
}

// ---------- API keys ----------
export const listKeys = () => adminRequest<ApiKey[]>("/api/dashboard/keys");

export const createKey = (name: string) =>
  adminRequest<CreatedApiKey>("/api/dashboard/keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const disableKey = (id: number) =>
  adminRequest<ApiKey>(`/api/dashboard/keys/${id}/disable`, {
    method: "PATCH",
  });

export const deleteKey = (id: number) =>
  adminRequest<ApiKey>(`/api/dashboard/keys/${id}`, {
    method: "DELETE",
  });

// ---------- Chat (uses a user API key, not the admin password) ----------
export async function sendChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<ChatCompletionResponse> {
  const res = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }

  return (await res.json()) as ChatCompletionResponse;
}
