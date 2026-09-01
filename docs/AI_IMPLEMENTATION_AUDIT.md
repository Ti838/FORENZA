# FORENZA — Multi-Model Forensic AI Implementation Audit (FZ-AI)
**Document ID:** `DOC-AI-AUDIT-2026-001`
**Author:** Forenza Cryptographic & AI Engineering Team
**Date:** September 2026

---

## 1. Executive Summary

This audit establishes the baseline for upgrading FORENZA's existing single-provider AI integration (`web/lib/ai/gemini.ts`) into **FZ-AI ORCHESTRATOR** — a provider-agnostic, multi-model forensic AI subsystem featuring specialized NVIDIA models, DeepSeek V4 Flash reasoning, Nemotron OCR/Embed/Lightning, Riva translation, and Gemini fallback.

---

## 2. Current State Assessment

### 2.1 Existing AI Architecture & Components
* **`web/lib/ai/gemini.ts`:** Centralized Google Gemini REST client implementing `classifyEvidence`, `analyzeDocument`, `compareOfficerAndLabReport`, and `assistantQuery`. Uses server-side API key retrieval with honest qualitative confidence (`HIGH`, `MEDIUM`, `LOW`).
* **`web/lib/ai/ai-provenance.ts`:** Implements `AIRunRecord` and `AIClaimItem` hashing (`input_hash`, `prompt_hash`, `output_hash`) and attaches the mandatory disclaimer: `"AI GENERATED — HUMAN REVIEW REQUIRED"`.
* **Database Schema (Migration 18):** Contains `ai_runs` and `ai_claims` tables with RLS and immutable audit triggers.
* **API Routes:**
  * `POST /api/evidence/[id]/analyze` — Primary media classifier.
  * `POST /api/ai/assistant` — Context-bounded assistant with user RLS client.
  * `POST /api/ai/compare-reports` — Officer note vs. lab report discrepancy checker.

### 2.2 Security Boundaries & Critical Rules
1. **Server-Side Key Isolation:** Provider API keys are strictly server-side (`process.env`). They are never bundled into client JS, mobile APKs, or desktop binaries.
2. **Cryptographic Boundary Invariant:** AI is strictly **assistive**. AI does not compute or modify SHA-256 evidence hashes, Ed25519 digital signatures, Merkle state DAGs, single-use custody nonces, or authoritative database records.
3. **Data Minimization:** AI context builders filter out passwords, unredacted credentials, unrelated case items, and private keys before dispatching payloads to external providers.

---

## 3. Required Modifications & Target Architecture

```
Application (Web / Mobile / Desktop via API)
      ↓
FZ-AI API Gateways (/api/ai/orchestrate, /api/ai/pipeline/*)
      ↓
FZ-AI Orchestrator (FZAiOrchestrator)
      ↓
Task Router & Policy Engine (TaskRouter)
      ↓
Specialized AI Providers (NVIDIA / DeepSeek / Nemotron / Riva / Gemini / Mock)
      ↓
Structured Output Validator & Schema Guard
      ↓
Source Provenance & Hash Grounding (AIProvenanceService)
      ↓
Human Review Lifecycle (AIHumanReviewService)
      ↓
Immutable AI Audit Trail (AuditLogger)
```

---

## 4. Model Responsibility Matrix

| Task Type | Primary Model / Engine | Provider | Fallback Engine | Role & Forensic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Reasoning & Analysis** | DeepSeek V4 Flash (`deepseek-ai/deepseek-r1`) | NVIDIA NIM | Gemini 2.0 Flash | Complex timeline reasoning, custody chain explanation, EPRA discrepancy explanation, forensic report drafting. |
| **Vision & Visual Observation** | Muse Glimmer 30B (`nvidia/neva-22b` / vision) | NVIDIA NIM | Gemini 2.0 Flash | Evidence image description, visual anomaly suggestion, object identification. |
| **OCR & Text Extraction** | Nemotron OCR V2 (`nvidia/nemotron-ocr`) | NVIDIA NIM | Gemini 2.0 Flash | Evidence labels, serial numbers, printed forms, multilingual document OCR. |
| **Semantic Retrieval (RAG)** | Nemotron Embed 1B (`nvidia/nv-embedqa-e5-v5`) | NVIDIA NIM | Text-Embedding-004 | Semantic vector search across authorized cases, custody logs, and lab notes. |
| **Fast Classification** | Nemotron 3.5 Lightning 30B A3B | NVIDIA NIM | Gemini 2.0 Flash | Low-latency category tagging, metadata extraction, short summaries. |
| **Content Safety** | NVIDIA Nemoguard Safety | NVIDIA NIM | Gemini Safety | Input/output content safety check tailored for forensic contexts. |
| **Translation** | Riva Translate 4B | NVIDIA NIM | Gemini 2.0 Flash | Multilingual case notes and witness report translation with dual-text retention. |

---

## 5. Integration Risks & Mitigations

1. **Model ID Availability Drift:** NVIDIA NIM model identifiers are fully configurable via environment variables (`NVIDIA_REASONING_MODEL`, `NVIDIA_VISION_MODEL`, etc.) with intelligent fallback to compatible models and Gemini.
2. **Prompt Injection & Evidence Poisoning:** Evidence text is treated as **untrusted data**. Prompts wrap evidence text in rigid delimiters (`<evidence_content>`) with explicit system instructions to ignore commands inside evidence bodies.
3. **Cross-Tenant Vector Leakage:** All semantic embeddings are tagged with `case_id` and filtered using RLS and user authorization *prior* to similarity calculation.
