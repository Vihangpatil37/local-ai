"""Pydantic request/response schemas."""
from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Health ----------
class HealthResponse(BaseModel):
    status: str
    ollama: str


# ---------- API Keys ----------
class CreateApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class CreateApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    full_key: str  # shown only once
    created_at: datetime


class ApiKeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    key_prefix: str
    requests_count: int
    total_tokens: int
    active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime


# ---------- Stats ----------
class DashboardStats(BaseModel):
    requests_today: int
    total_requests: int
    average_latency_ms: int
    active_keys: int
    total_tokens_today: int
    fake_spend_today: float
    failed_requests_today: int


# ---------- Logs ----------
class UsageLogOut(BaseModel):
    id: int
    api_key_name: Optional[str] = None
    model: str
    status: str
    latency_ms: int
    prompt_preview: Optional[str] = None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    created_at: datetime


class UsageLogList(BaseModel):
    items: List[UsageLogOut]
    total: int


# ---------- Usage (per key) ----------
class UsageByKey(BaseModel):
    api_key_id: Optional[int] = None
    api_key_name: Optional[str] = None
    requests: int
    total_tokens: int
    fake_spend: float


class UsageSummary(BaseModel):
    total_tokens: int
    total_requests: int
    fake_spend: float
    requests_today: int
    by_key: List[UsageByKey]


# ---------- OpenAI-compatible chat ----------
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[ChatMessage]
    stream: bool = False
    temperature: Optional[float] = None
    # Allow passthrough of any extra OpenAI/Ollama options.
    model_config = ConfigDict(extra="allow")


class ChoiceMessage(BaseModel):
    role: str
    content: str


class Choice(BaseModel):
    index: int
    message: ChoiceMessage
    finish_reason: Optional[str] = "stop"


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatCompletionResponse(BaseModel):
    id: str
    object: Literal["chat.completion"] = "chat.completion"
    created: int
    model: str
    choices: List[Choice]
    usage: Usage
