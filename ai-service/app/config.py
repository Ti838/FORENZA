"""FORENZA AI Service — Configuration"""
from __future__ import annotations
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Model
    ai_model_path: str = "./models/efficientnet_b0.onnx"
    ai_confidence_threshold: float = 0.50

    # Security
    ai_service_api_key: str = "dev-key-change-in-production"

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Sentry
    sentry_dsn: Optional[str] = None
    environment: str = "development"

    # Logging
    log_level: str = "info"


settings = Settings()
