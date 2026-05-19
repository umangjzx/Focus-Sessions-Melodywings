from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    app_name: str = "Focus Sessions API"
    environment: str = "development"
    version: str = "1.0.0"
    
    # Security
    secret_key: str = "change-me-in-production-use-env-SECRET_KEY"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    # Database
    database_url: str = "sqlite:///./focus_sessions.db"
    auto_create_tables: bool = False
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    # Server
    server_host: str = "0.0.0.0"
    server_port: int = 8000
    server_reload: bool = False
    
    # Logging
    log_level: str = "info"
    
    # Documentation
    disable_docs: bool = False
    disable_redoc: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
