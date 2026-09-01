# FORENZA — FZ-AI Multi-Model Forensic Architecture
**Document ID:** `DOC-AI-ARCH-2026-001`
**Standards Aligned:** ISO/IEC 27037, NIST SP 800-86, FRE Rule 902(14)

---

## 1. High-Level System Architecture

The **FZ-AI Orchestrator** decouples FORENZA's application logic from underlying AI model vendors. It orchestrates task dispatching, context minimization, adversarial prompt injection defense, multi-model pipelines, immutable AI run provenance, and human review gating.

```
                    APPLICATION CLIENT TIER
          (Web / Mobile Android / Windows / macOS / Linux)
                              ↓
              ZERO-TRUST REST API GATEWAYS
          (/api/ai/orchestrate, /api/ai/pipeline/*)
                              ↓
                    FZ-AI ORCHESTRATOR
         (Data Minimization, Untrusted Data Wrapping)
                              ↓
                      TASK ROUTER
         (Complexity, Modality & Health Policy)
                              ↓
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
    NVIDIA NIM         GOOGLE GEMINI 2.0        MOCK AI
 (DeepSeek, Muse,      (Fallback Provider &   (Local Dev,
 Nemotron, Riva)          Cross-Checker)        Offline)
         └────────────────────┬────────────────────┘
                              ↓
              OUTPUT VALIDATOR & SCHEMA GUARD
                              ↓
             IMMUTABLE AI PROVENANCE RECORDER
         (SHA-256 Input / Prompt / Output Hashes)
                              ↓
              HUMAN JUDICIAL & ANALYST REVIEW
          ("AI GENERATED — HUMAN REVIEW REQUIRED")
```

---

## 2. Core Architectural Guarantees

1. **Deterministic Cryptographic Invariant:** AI is strictly **assistive**. AI does not compute or modify SHA-256 evidence digests, Ed25519 digital signatures, Merkle state DAGs, custody nonces, or authoritative database tables.
2. **Server-Side Key Isolation:** Provider credentials (`NVIDIA_API_KEY`, `GEMINI_API_KEY`) reside exclusively in server environments and are never shipped to client JS, mobile APKs, or desktop binaries.
3. **Multi-Model Specialization:** Low-latency tasks use Nemotron Lightning, document OCR uses Nemotron OCR V2, deep reasoning uses DeepSeek V4 Flash, and visual observations use Muse Glimmer 30B.
4. **Immutable Provenance:** Every AI inference is immutably logged with canonical input/output hashes, model identifiers, duration, and reviewer status.
