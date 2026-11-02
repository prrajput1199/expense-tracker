from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables or a .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Expense Tracker API"
    # Defaults to SQLite so the project runs with zero setup.
    # Set DATABASE_URL to a PostgreSQL / MySQL URL for real deployments.
    database_url: str = "sqlite:///./expenses.db"
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
