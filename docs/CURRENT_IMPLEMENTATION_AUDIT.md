# FORENZA — Codebase Audit & Baseline Assessment Report
**Document ID:** `DOC-AUDIT-2026-001`  
**Generated Date:** 2026-09-01  
**Target:** FORENZA Enterprise Forensic Evidence Chain of Custody & Verification Platform  
**Status:** COMPLETE (Phase 0 Baseline)

---

## 1. Executive Summary & Repository Status

FORENZA is an existing multi-platform forensic evidence management platform covering Web, Mobile (Flutter), Desktop (Tauri 2.x), AI Microservice (FastAPI/ONNX), and PostgreSQL/Supabase database layers.

The current codebase is in a functional MVP/intermediate state with passing unit and integration tests (9 test suites, 59 tests in Vitest). It implements initial versions of evidence capture, GPS geofencing, QR handover tokens, basic blockchain-style SHA-256 custody chains, Supabase RLS, and a Gemini-backed AI analysis service.

However, moving from the current system to the target **Next-Generation Forensics Architecture** requires significant upgrades across state immutability, hardware-backed device trust, non-destructive branching, divergence detection (FZ-DIV), provenance reconciliation (EPRA), human adjudication (FZ-ADJ), authenticated encryption (AES-256-GCM replacing naive XOR), independent cryptographic passports (FZ-PASS/FZ-VERIFY), and judicial read-only workspace expansion.

---

## 2. Existing Architecture Overview

```
                                  +---------------------------------------+
                                  |            CLIENT LAYER               |
                                  | - Web (Next.js 15, React 19, TS 5)    |
                                  | - Mobile (Flutter 3.16+, Riverpod)    |
                                  | - Desktop (Tauri 2.x, Rust, Webview)  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       EDGE & AUTHORIZATION GATEWAY    |
                                  | - Middleware session check            |
                                  | - In-memory IP/user rate limiter      |
                                  | - RBAC role-permission matrix         |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         APPLICATION CORE              |
                                  | - Next.js App Router API Routes       |
                                  | - Web Crypto SHA-256 Custody Engine   |
                                  | - JOSE JWT QR & Handover Engine       |
                                  | - jsPDF Legal Dossier Generator       |
                                  | - Gemini 2.0 Flash AI Integration     |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +----------------------+
                     v                                                                 v
+---------------------------------------+                             +---------------------------------------+
|        AI SERVICE (FastAPI)           |                             |      DATA PERSISTENCE (Supabase)      |
| - EfficientNet-B0 ONNX Model          |                             | - PostgreSQL 15 (17 Migrations)       |
| - Classification endpoint             |                             | - Row Level Security (RLS)            |
| - Internal Bearer Auth                |                             | - Append-only & Immutability Triggers |
+---------------------------------------+                             | - Private Storage Buckets             |
                                                                      +---------------------------------------+
```

---

## 3. Existing Feature Inventory

| Feature | Status | Primary Files | Dependencies | Tests | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication (Password + TOTP MFA)** | Working | `web/app/api/auth/*`, `web/lib/supabase/*` | Supabase Auth, `@supabase/ssr` | Manual / E2E | **MODIFY:** Add Passkeys/WebAuthn, hardware attestation, local PIN/Biometric unlock protocol. |
| **RBAC Authorization** | Working | `web/lib/rbac.ts`, `web/middleware.ts` | Custom matrix (7 roles) | `web/__tests__/rbac.test.ts` (5 tests) | **MODIFY:** Upgrade to hybrid RBAC + ABAC with case/evidence-level grants. |
| **Evidence Sealing & Master Hash** | Working | `web/lib/crypto/evidence-hash.ts`, `web/app/api/evidence/[id]/seal/route.ts` | Web Crypto API (SHA-256) | `web/__tests__/evidence-hash.test.ts` (13 tests) | **MODIFY:** Upgrade to canonical deterministic manifest + Ed25519 signature layer. |
| **Custody Hash Chain** | Working | `web/lib/crypto/custody-chain.ts`, `web/app/api/evidence/[id]/transfer/route.ts` | Web Crypto API | `web/__tests__/custody-chain.test.ts` (13 tests) | **MODIFY:** Connect into immutable `evidence_states` graph with parent state hashing. |
| **Single-Use QR Handover** | Working | `web/lib/tokens.ts`, `web/app/api/evidence/[id]/transfer/route.ts` | `jose` (JWT with JTI/exp) | `web/__tests__/tamper-detection.test.ts` | **MODIFY:** Harden with sender-receiver cryptographic binding and single-use server nonce check. |
| **Geofencing & Distance Checks** | Working | `web/lib/geofence.ts`, `web/app/api/evidence/[id]/capture/route.ts` | Haversine Formula | `web/__tests__/geofence.test.ts` (8 tests) | **KEEP / EXTEND:** Add temporal drift and multi-signal location integrity analysis. |
| **Lab Sample Depletion** | Working | `supabase/migrations/20240001000010_create_lab.sql`, `web/app/api/lab/[id]/sample/route.ts` | PostgreSQL Triggers | `web/__tests__/e2e-mvp.test.ts` | **MODIFY:** Expand to full multi-tier sample lineage tree. |
| **Court Dossier Generation** | Working | `web/components/forensic/CourtDossierModal.tsx`, `web/app/api/dossier/[caseId]/route.ts` | `jspdf`, `jspdf-autotable` | `web/__tests__/compliance-ethics.test.ts` | **MODIFY:** Include state branches, adjudication records, and independent verification manifest. |
| **AI Classifier & Assistant** | Working | `web/lib/ai/gemini.ts`, `ai-service/app/main.py`, `ai-service/app/classifier.py` | Google Gemini API, FastAPI, ONNX Runtime | `web/__tests__/compliance-ethics.test.ts` | **MODIFY:** Add AI Provenance recording (model hashes), claim source validation, and strict "HUMAN REVIEW REQUIRED" badges. |
| **Mobile Field App (Flutter)** | Partial / Basic | `mobile/lib/core/*`, `mobile/lib/screens/*` | Riverpod, MobileScanner, Geolocator | Flutter unit tests missing | **MODIFY:** Replace naive XOR offline storage with AES-256-GCM authenticated vault and SQLite event journal. |
| **Desktop Client (Tauri)** | Stub | `desktop/src-tauri/src/lib.rs` | Tauri 2.x, Rust | None | **MODIFY:** Add native secure credential storage (DPAPI/Keychain/SecretService) and offline verification engine. |
| **Compliance & Legal Layer** | Working | `supabase/migrations/20240001000017_compliance_legal_layer.sql`, `web/lib/compliance.ts` | PostgreSQL RLS / Triggers | `web/__tests__/compliance-ethics.test.ts` | **KEEP / EXTEND:** Map to ISO/IEC 27037, ISO/IEC 27038, NIST SP 800-86. |

---

## 4. Existing Database Schema Audit

Database consists of 17 migrations (`20240001000001` through `20240001000017`) in `supabase/migrations/`:
1. `001_create_enums.sql`: Defines `evidence_status`, `custody_action`, `device_status`, `case_status`, `app_role`, `media_type`, `evidence_event_type`, `audit_category`.
2. `002_create_profiles.sql`: User profiles and `user_roles` linking Supabase auth users to roles.
3. `003_create_devices.sql`: `approved_devices` table with hashed hardware identifiers.
4. `004_create_cases.sql`: `cases` and `case_officers` assignments.
5. `005_create_evidence.sql`: `evidence` and `evidence_media` (immutable storage paths).
6. `006_create_classifications.sql`: `evidence_classifications` storing AI/manual labels and qualitative confidence.
7. `007_create_custody.sql`: `custody_logs` (hash chained), `evidence_events`, and `handover_tokens`.
8. `008_create_transit.sql`: `transit_telemetry` storing location coordinates during evidence transport.
9. `009_create_vault.sql`: `vault_inventory` for physical rack/shelf/bin storage.
10. `010_create_lab.sql`: `lab_samples` and `lab_reports` with consumption constraint triggers.
11. `011_create_audit.sql`: `audit_logs` append-only immutable ledger.
12. `012_create_qr.sql`: `qr_tokens` tracking generated QR tokens.
13. `013_create_rls.sql`: RLS policies isolating data across the 7 application roles.
14. `014_create_indexes.sql`: Composite and performance B-Tree/GIN indexes.
15. `015_create_functions.sql`: Triggers for hash protection, audit append-only enforcement, state transitions.
16. `016_create_storage_buckets.sql`: Storage configuration for `evidence-media`, `lab-reports`, `dossiers`.
17. `017_compliance_legal_layer.sql`: `legal_authorizations`, `legal_holds`, `derived_artifacts`, `security_events`.

---

## 5. Existing API Surface Audit

* **Authentication:**
  * `POST /api/auth/login`: Email/password authentication, device status check, rate limiting.
  * `POST /api/auth/register`: User registration with role assignment.
  * `POST /api/auth/mfa`: TOTP verification.
  * `POST /api/auth/logout`: Session termination.
  * `GET /api/auth/session`: User profile, device validation, and permissions.
* **Cases:**
  * `GET /api/cases`, `POST /api/cases`: Case management.
  * `GET /api/cases/[id]`, `PATCH /api/cases/[id]`: Case details & status updates.
* **Evidence:**
  * `GET /api/evidence`, `POST /api/evidence`: Evidence registration.
  * `GET /api/evidence/[id]`: Full evidence record with media and latest custody.
  * `POST /api/evidence/[id]/capture`: GPS location, distance check, geofence verification.
  * `POST /api/evidence/[id]/seal`: Master SHA-256 hash generation and immutability lock.
  * `POST /api/evidence/[id]/transfer`: Handover token generation and receipt.
  * `POST /api/evidence/[id]/receive`: Transfer confirmation and hash chain update.
  * `GET /api/evidence/[id]/verify`: Full chain recalculation and tamper check.
  * `POST /api/evidence/[id]/vault`: Vault rack/bin assignment.
* **AI & Laboratory:**
  * `POST /api/evidence/[id]/classify`: Calls Python AI microservice or Gemini.
  * `POST /api/ai/assistant`: Authorized case Q&A assistant.
  * `POST /api/ai/compare-reports`: Discrepancy detector between officer notes and lab findings.
  * `POST /api/lab/[id]/sample`, `POST /api/lab/[id]/report`, `POST /api/lab/[id]/receive`.
* **Judicial & Dossier:**
  * `GET /api/judicial/[caseId]/timeline`: Complete chronological chain for trial.
  * `GET /api/dossier/[caseId]`: Generates signed PDF court dossier.
* **Overrides & Admin:**
  * `GET /api/overrides`, `POST /api/overrides`, `PATCH /api/overrides/[id]`: Supervisor exception approvals.
  * `GET /api/admin/stats`, `GET/PATCH /api/admin/devices`, `GET /api/admin/users`.
  * `GET /api/audit`: Immutable audit log query.

---

## 6. Existing Security Controls & Identified Weaknesses

### 6.1. Strong Existing Controls
* **Immutable Audit & Custody:** PostgreSQL trigger `prevent_audit_modification` rejects `UPDATE` and `DELETE` queries on `audit_logs` and `custody_logs`.
* **Master Hash Protection:** PostgreSQL trigger `protect_master_hash` forbids altering `master_hash` once sealed.
* **Role-Based Access Control:** Dual enforcement (Middleware/Route guards + Database RLS).
* **AI Key Isolation:** `GEMINI_API_KEY` is isolated to the server backend.

### 6.2. Critical Security Gaps & Weaknesses
1. **Offline Vault Encryption (Mobile):** Currently uses a primitive XOR cipher in `mobile/lib/core/services/offline_vault_service.dart`. Must be upgraded to **AES-256-GCM** using device-bound hardware-backed keys.
2. **Device Trust & Public Key Signatures:** `approved_devices` only tracks a static identifier string. There is no asymmetric device key pair (`device_public_key`, Ed25519), attestation token, or per-event digital signature.
3. **State Mutability vs State Graph:** Evidence updates mutate rows in `evidence` rather than appending immutable state nodes (`evidence_states` with `parent_state_id` and cryptographic state hashes).
4. **No Fork/Branch Reconciliation:** If two devices submit conflicting offline histories for the same evidence, the system lacks an automated divergence engine (FZ-DIV) and non-destructive branching engine (FZ-BRANCH).
5. **No Evidence Integrity Passport / Independent Verifier:** Verification is tightly coupled to the database; there is no portable self-contained JSON-LD/schema package (FZ-PASS) verifiable by an offline third party (FZ-VERIFY).
6. **Rate Limiting:** `middleware.ts` uses an in-memory Map which resets on serverless cold starts.

---

## 7. Cryptographic & Verification Architecture Gap Analysis

| Requirement | Current Status | Target Architecture |
| :--- | :--- | :--- |
| **Content Integrity** | SHA-256 of raw bytes | SHA-256 with streaming chunk support |
| **Metadata Canonicalization** | Alphabetically sorted JSON keys | RFC 8785 JSON Canonicalization Scheme (JCS) |
| **Asymmetric Signatures** | None (Symmetric JWT secrets only) | Ed25519 Device & Officer Signatures |
| **State Lineage** | Linear `custody_logs` table | Merkle-DAG `evidence_states` with DAG branching |
| **Conflict & Divergence Engine** | Basic timestamp check | EPRA (Reconciliation) + FZ-DIV (First Divergence) |
| **Replay & Rollback Defense** | Single-use JTI in memory/DB | Monotonic sequence counters + nonce ledger |
| **External Trust Anchoring** | None | RFC 3161 Timestamp Token / Merkle Root Anchor |
| **Portable Verification** | None | FZ-PASS Self-Contained Integrity Package |

---

## 8. Missing Modules & Components

1. **FZ-TWIN / FZ-STATE:** Immutable Evidence State Engine (`evidence_states`, parent-child state Merkle hashing).
2. **FZ-EPRA:** Evidence Provenance Reconciliation Algorithm (evaluates consistency across multi-source histories).
3. **FZ-DIV:** First Divergence Engine (pinpoints exact state node $E_k$ where divergence occurs).
4. **FZ-BRANCH & FZ-ADJ:** Non-destructive branching and signed human adjudication workflows.
5. **FZ-LINEAGE:** Recursive sample and derived artifact lineage tracking.
6. **FZ-PASS & FZ-VERIFY:** Portable cryptographic evidence passport generator and standalone offline verifier.
7. **FZ-LAB:** Synthetic Attack Laboratory (simulating tampering, rollback, signature forgery in developer mode).
8. **FZ-IMPACT:** Downstream integrity impact dependency analyzer.
9. **FZ-SECURITY:** Dedicated Security Event Center UI for administrators and compliance officers.

---

## 9. Comprehensive Upgrade Roadmap

* **Phase 1: Foundation & Data Architecture**
  * Database migrations for `evidence_states`, `devices` (public keys & attestation), `provenance_nodes/edges`, `conflicts`, `divergences`, `branches`, `adjudications`, `sample_lineage`, `ai_provenance`.
  * Canonical serialization engine (RFC 8785) & Ed25519 cryptographic sealing utilities.
* **Phase 2: Immutable State Engine & Custody (FZ-TWIN, FZ-SEAL, FZ-CHAIN)**
  * Implement `evidence_states` Merkle hash chain.
  * Upgrade custody handover with single-use nonce verification and Ed25519 signature checks.
* **Phase 3: Provenance, Reconciliation & Divergence (FZ-PROV, FZ-EPRA, FZ-DIV, FZ-BRANCH, FZ-ADJ)**
  * Implement EPRA multi-source comparison algorithm.
  * Implement FZ-DIV first divergence detector and non-destructive branch manager.
  * Implement Human Adjudication (FZ-ADJ) with signed rationale records.
* **Phase 4: Sample Lineage, Physical Evidence & Photo Verification (FZ-LINEAGE, FZ-PHOTO)**
  * Physical containers, tamper-evident seals, and condition tracking.
  * Multi-tier lab sample genealogy tree with depletion constraints.
* **Phase 5: Offline Forensic Vault & Sync Engine (Mobile & Desktop Hardening)**
  * Upgrade Mobile Flutter vault to authenticated **AES-256-GCM** with device-bound keys.
  * Implement conflict-resilient offline sync with replay and rollback protection.
* **Phase 6: AI Provenance & Claim Validation (FZ-AI)**
  * Model versioning, input/output hash auditing, and evidence-grounded claim validation.
* **Phase 7: Security Center, Synthetic Lab & Impact Analyzer (FZ-SECURITY, FZ-LAB, FZ-IMPACT)**
  * Security Event Center UI.
  * Synthetic attack generator for test validation.
  * Downstream blast radius impact analyzer.
* **Phase 8: Passport, Independent Verifier & Judicial Workspace (FZ-PASS, FZ-VERIFY, Judicial)**
  * Portable JSON Evidence Passport generator.
  * Standalone client-side/offline cryptographic verifier.
  * Judicial Chamber workspace upgrade and certified Court Dossier PDF engine.
* **Phase 9: Comprehensive Test Suite, Security Matrix & Performance Benchmarking**
  * 20+ scenario security test matrix (tampering, rollback, replay, RLS bypass).
  * Unit, integration, and E2E verification.
* **Phase 10: Complete Documentation, Compliance Mapping & Verification**
  * Update all docs in `/docs/`, architecture diagrams, threat models, and README.md.
