from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "ArthSena Financial Intelligence System"
    app_version: str = "1.0.0"
    database_url: str = "sqlite:///./student_budget_tracker.db"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 120
    allowed_origins: str = "http://localhost:8081,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"
    ai_provider: str = "local"
    ai_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    ai_request_timeout_seconds: int = 20
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()
