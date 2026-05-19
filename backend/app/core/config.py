from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Focus Sessions API"
    secret_key: str = "change-me-in-production-use-env-SECRET_KEY"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    database_url: str = "sqlite:///./focus_sessions.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auto_create_tables: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
