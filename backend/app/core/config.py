from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Focus Sessions API"
    secret_key: str = "change-me-in-production-use-env-SECRET_KEY"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    database_url: str = "sqlite:///./focus_sessions.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auto_create_tables: bool = False

    # Local AI coach via Ollama (ollama run qwen2.5-coder:7b)
    ollama_enabled: bool = True
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    ollama_timeout_seconds: float = 30.0
    ollama_temperature: float = 0.7
    ollama_max_tokens: int = 80

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
