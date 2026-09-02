"""FORENZA AI Service — Pydantic Schemas"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str] = None
    service_version: str


class ClassificationResponse(BaseModel):
    available: bool = True
    message: Optional[str] = None
    # Classification fields (None if unavailable)
    object: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Confidence percentage 0–100",
    )
    model_version: Optional[str] = None
    processing_time_ms: Optional[float] = None


class ClassificationRequest(BaseModel):
    """For JSON-body classification (alternative to file upload)."""
    pass


class ErrorResponse(BaseModel):
    detail: str
