export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  requests_count: number;
  total_tokens: number;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface CreatedApiKey {
  id: number;
  name: string;
  key_prefix: string;
  full_key: string;
  created_at: string;
}

export interface DashboardStats {
  requests_today: number;
  total_requests: number;
  average_latency_ms: number;
  active_keys: number;
  total_tokens_today: number;
  fake_spend_today: number;
  failed_requests_today: number;
}

export interface UsageLog {
  id: number;
  api_key_name: string | null;
  model: string;
  status: string;
  latency_ms: number;
  prompt_preview: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

export interface UsageLogList {
  items: UsageLog[];
  total: number;
}

export interface UsageByKey {
  api_key_id: number | null;
  api_key_name: string | null;
  requests: number;
  total_tokens: number;
  fake_spend: number;
}

export interface UsageSummary {
  total_tokens: number;
  total_requests: number;
  fake_spend: number;
  requests_today: number;
  by_key: UsageByKey[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
