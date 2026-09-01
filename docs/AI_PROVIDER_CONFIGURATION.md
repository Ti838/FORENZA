# FORENZA — FZ-AI Provider Configuration Runbook
**Document ID:** `DOC-AI-CONFIG-2026-001`

---

## 1. Environment Variable Specification

Configure the following variables in `web/.env.local`:

```env
# -------------------------------------------------------------
# FZ-AI ORCHESTRATOR PROVIDER CONFIGURATION
# -------------------------------------------------------------
AI_PRIMARY_PROVIDER=nvidia
AI_FALLBACK_PROVIDER=gemini

# NVIDIA NIM Integration (OpenAI-compatible endpoints)
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Specialized Model Identifiers (Configurable)
NVIDIA_REASONING_MODEL=deepseek-ai/deepseek-r1
NVIDIA_VISION_MODEL=nvidia/neva-22b
NVIDIA_OCR_MODEL=nvidia/nemotron-ocr
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
NVIDIA_FAST_MODEL=nvidia/nemotron-4-340b-instruct
NVIDIA_TRANSLATION_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_SAFETY_MODEL=nvidia/llama-3.1-nemoguard-8b-content-safety

# Fallback Provider
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash

# Execution Boundaries
AI_TIMEOUT_MS=15000
AI_MAX_REQUEST_SIZE=52428800
```

---

## 2. Local Offline / Test Mode

To run FORENZA in full offline or simulated mode without calling cloud endpoints:
```env
AI_PROVIDER=mock
```
Output will be generated instantly and stamped with `[MOCK_AI]`.
