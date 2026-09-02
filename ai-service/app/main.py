"""
FORENZA AI Classification Service
Forensic Evidence Image Classifier using EfficientNet-B0 via ONNX Runtime
"""
from __future__ import annotations

import io
import os
import time
import uuid
import hashlib
import logging
from contextlib import asynccontextmanager
from typing import Optional

import structlog
import sentry_sdk
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.classifier import ForensicClassifier
from app.schemas import (
    ClassificationRequest,
    ClassificationResponse,
    HealthResponse,
    ErrorResponse,
)
from app.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Sentry
# ---------------------------------------------------------------------------
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.1,
        environment=settings.environment,
    )

# ---------------------------------------------------------------------------
# Classifier (loaded at startup)
# ---------------------------------------------------------------------------
classifier: Optional[ForensicClassifier] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global classifier
    logger.info("forenza_ai_startup", model_path=settings.ai_model_path)
    try:
        classifier = ForensicClassifier(model_path=settings.ai_model_path)
        logger.info("forenza_ai_model_loaded", model_version=classifier.model_version)
    except Exception as exc:
        logger.error("forenza_ai_model_load_failed", error=str(exc))
        # Classifier remains None — endpoints will return graceful failure
    yield
    logger.info("forenza_ai_shutdown")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FORENZA AI Classification Service",
    description="Forensic evidence image classification using EfficientNet-B0",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    redoc_url=None,
)

# ---------------------------------------------------------------------------
# CORS — only allow internal calls from Next.js backend
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def verify_api_key(request: Request) -> None:
    """Verify internal API key from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header.removeprefix("Bearer ")
    # Constant-time comparison
    expected = settings.ai_service_api_key
    if len(token) != len(expected) or not hmac_compare(token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )


def hmac_compare(a: str, b: str) -> bool:
    """Constant-time string comparison to prevent timing attacks."""
    import hmac as _hmac
    return _hmac.compare_digest(a.encode(), b.encode())


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Service health check — returns model status."""
    return HealthResponse(
        status="healthy",
        model_loaded=classifier is not None,
        model_version=classifier.model_version if classifier else None,
        service_version="1.0.0",
    )


@app.post(
    "/classify",
    response_model=ClassificationResponse,
    tags=["Classification"],
    dependencies=[Depends(verify_api_key)],
    summary="Classify a forensic evidence image",
)
async def classify_image(
    request: Request,
    file: UploadFile = File(..., description="Image file (JPEG/PNG/WEBP, max 20MB)"),
) -> ClassificationResponse:
    """
    Classify a forensic evidence image using EfficientNet-B0.

    Returns:
        ClassificationResponse with object, category, subcategory, confidence, model_version

    On AI failure:
        Returns ClassificationResponse with available=False — caller must fall back to manual.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    log = logger.bind(request_id=request_id, filename=file.filename)

    # Validate content type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        log.warning("forenza_ai_invalid_content_type", content_type=file.content_type)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WEBP",
        )

    # Read and size-check
    image_bytes = await file.read()
    max_size = 20 * 1024 * 1024  # 20MB
    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds 20MB limit",
        )

    # Compute image SHA-256 for audit reference
    image_sha256 = hashlib.sha256(image_bytes).hexdigest()
    log = log.bind(image_sha256=image_sha256, image_size_bytes=len(image_bytes))

    # Check classifier availability
    if classifier is None:
        log.warning("forenza_ai_classifier_unavailable")
        return ClassificationResponse(
            available=False,
            message="AI classification service unavailable. Manual classification required.",
        )

    try:
        start_time = time.monotonic()
        result = classifier.classify(image_bytes)
        elapsed_ms = round((time.monotonic() - start_time) * 1000, 2)

        log.info(
            "forenza_ai_classification_success",
            object=result.object,
            category=result.category,
            confidence=result.confidence,
            elapsed_ms=elapsed_ms,
        )

        return ClassificationResponse(
            available=True,
            object=result.object,
            category=result.category,
            subcategory=result.subcategory,
            confidence=result.confidence,
            model_version=result.model_version,
            processing_time_ms=elapsed_ms,
        )

    except Exception as exc:
        log.error("forenza_ai_classification_error", error=str(exc))
        sentry_sdk.capture_exception(exc)
        # Graceful failure — never block evidence registration
        return ClassificationResponse(
            available=False,
            message="AI classification failed. Manual classification required.",
        )


# ---------------------------------------------------------------------------
# Global error handler — never expose stack traces
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    sentry_sdk.capture_exception(exc)
    logger.error("forenza_ai_unhandled_error", error=str(exc), path=str(request.url))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
