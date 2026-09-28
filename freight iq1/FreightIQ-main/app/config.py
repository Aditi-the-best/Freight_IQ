"""
Central app settings. DATABASE_URL is intentionally read from env / .env so
whoever owns the DB (Postgres/Supabase) can drop their connection string in
without touching code. Nothing here creates or migrates tables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "SAIL Freight Forecasting & Vessel Chartering API"
    ENV: str = "development"

    # Filled in by whoever owns the DB. Falls back to sqlite so the rest of
    # the app is runnable/testable standalone before that's wired up.
    DATABASE_URL: str = "sqlite:///./dev_fallback.db"

    # Forecast horizon defaults
    DEFAULT_FORECAST_HORIZON_DAYS: int = 30
    SHOULD_HAVE_WAITED_WINDOW_DAYS: int = 14  # N days used for the derived label

    # CORS
    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()
