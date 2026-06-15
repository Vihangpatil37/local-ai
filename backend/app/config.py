"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "Local Ollama AI Dashboard"
    environment: str = "development"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Comma-separated list of allowed frontend origins.
    frontend_url: str = "http://localhost:3000"

    database_url: str = "sqlite:///./ollama_dashboard.db"

    ollama_base_url: str = "http://localhost:11434"
    ollama_default_model: str = "llama3"

    api_key_prefix: str = "sk-ollama"
    api_key_secret_pepper: str = "change-this-random-secret"

    fake_cost_per_token: float = 0.000001

    admin_password: str = "change-this-admin-password"

    # Privacy + limits
    log_prompts: bool = True
    prompt_preview_chars: int = 200
    rate_limit_per_minute: int = 60

    @property
    def cors_origins(self) -> List[str]:
        """Parse the comma-separated FRONTEND_URL into a clean list of origins."""
        return [
            origin.strip().rstrip("/")
            for origin in self.frontend_url.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
