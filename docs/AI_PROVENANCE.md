# FORENZA — FZ-AI Provenance & Human Review Lifecycle
**Document ID:** `DOC-AI-PROV-2026-001`

---

## 1. Immutable AI Provenance

Every inference executed across FORENZA generates a cryptographic **`AIRunRecord`** stored in the database and audit ledger:

```json
{
  "run_id": "c7a8b9d0-1234-5678-9abc-def012345678",
  "case_id": "CASE-2026-001",
  "evidence_id": "EV-001",
  "provider": "nvidia",
  "model_name": "deepseek-ai/deepseek-r1",
  "input_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "prompt_hash": "a1b2c3d4e5f6...",
  "output_hash": "f6e5d4c3b2a1...",
  "execution_duration_ms": 420,
  "caller_id": "OFFICER-USER-UUID",
  "review_status": "PENDING_HUMAN_REVIEW",
  "disclaimer": "AI GENERATED — HUMAN REVIEW REQUIRED"
}
```

---

## 2. Human Review & Modification Workflow

1. **Mandatory Badging:** All AI findings are presented with the prominent banner:  
   `⚠️ AI GENERATED — HUMAN REVIEW REQUIRED`
2. **Review Actions:**
   * **Accept as Assistive Note:** Adopts the AI analysis into the case file with its source model stamped.
   * **Reject:** Flags the AI output as inaccurate; marks run record as `REJECTED`.
   * **Modify & Accept:** Records the human analyst's revised text in `human_modified_version` while **strictly preserving** the original AI output in `original_ai_output`.
