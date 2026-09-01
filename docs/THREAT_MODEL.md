# FORENZA — Threat Model & Security Architecture
**Document ID:** `DOC-THREAT-2026-001`  
**Classification:** Technical Security Specification  
**Standard Mapping:** STRIDE, NIST SP 800-86, ISO/IEC 27037

---

## 1. Threat Matrix & Mitigations

| Threat | Attack Surface | Mitigation Strategy | Detection Mechanism | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Malicious Insider** | Database or API direct access | Immutable database triggers, Ed25519 digital signatures, Merkle state hash verification. | Automated chain recalculation (FZ-VERIFY) detects missing or altered states. | Compromised officer key before initial seal. |
| **Compromised Device** | Mobile/Desktop endpoint | Device Trust (FZ-ID), Hardware Attestation (Android Keystore / Secure Enclave), Instant Revocation. | Device status evaluations reject any non-`TRUSTED` device sessions. | Zero-day OS-level kernel exploit. |
| **Stolen Credentials** | Web/API login | Mandatory TOTP Multi-Factor Authentication (MFA), WebAuthn/Passkeys, rate limiting. | Security Event Center alerts on multiple consecutive `MFA_FAILURE` events. | Session hijacking before expiration. |
| **Database Compromise** | PostgreSQL server | Append-only triggers prevent row modification/deletion; cryptographic states are client-signed. | Forensic auditors detect broken state hashes immediately. | Denial of Service (dropping whole database). |
| **Offline Device Theft** | Stolen field tablet/phone | Authenticated **AES-256-GCM** encryption with device-bound hardware Keystore keys. | Remote device revocation in FZ-ID marks device status as `COMPROMISED`. | Physical extraction if device PIN/biometric is coerced. |
| **Replay Attack** | Handover QR / Custody tokens | Cryptographically random single-use nonces (UUIDv4) recorded in spending ledger. | `CustodyEngine` rejects any duplicate nonce instantly. | Network interception within validity window before use. |
| **Rollback Attack** | Offline sync stream | Monotonic sequence counters enforced per device (`local_sequence > lastKnownSequence`). | `OfflineSyncEngine` flags sequence violations as `REJECTED_SEQUENCE_ROLLBACK`. | None within verified sequence stream. |
| **Evidence Substitution** | Swapping physical/digital files | Canonical SHA-256 content hashing & Merkle state hashing bound to original seal manifest. | `IndependentVerifier` and `FZ-SEAL` detect content hash mismatch. | None (cryptographically infeasible collision). |
| **Metadata Manipulation** | Changing location or timestamp | RFC 8785 JSON Canonicalization Scheme (JCS) deterministically binds metadata into manifest hash. | Master hash recalculation detects single-byte variance. | Incorrect initial manual entry at scene. |
| **Clock Manipulation** | Altering device time settings | Device time vs Server time drift comparison, monotonic sequence ordering, RFC 3161 timestamp anchor. | Temporal integrity validation flags impossible timeline drift. | Subtle sub-second drift. |
| **Location Manipulation** | Mock GPS / Spoofing | Haversine geofence boundary verification, supervisor override requirement for out-of-perimeter events. | Security alert `LOCATION_CONFLICT` generated on perimeter boundary breach. | Sophisticated RF-level GPS simulator. |
| **Malicious Administrator** | Admin portal | Separation of duties: Admin cannot sign evidence or alter cryptographic state ledgers. | Independent audit ledger records all administrative actions. | Admin revocation of legitimate user accounts. |
| **AI Hallucination / Drift** | AI Assistant / Classifier | AI Provenance logging (input/prompt/output hashes), evidence claim validation, mandatory badges. | `AIProvenanceService` flags unsupported claims with `UNSUPPORTED` status. | Subjective interpretation bias. |
| **API Abuse / DoS** | Public endpoints | In-memory and gateway rate limiting, strict payload size caps (20MB), structured schema validation. | Security Event Center records `UPLOAD_VIOLATION` and IP blocking. | Distributed volumetric bandwidth exhaustion. |

---

## 2. Core Security Invariants

1. **Immutability Invariant:** Once an evidence item is sealed ($E_0$), its `master_hash` and initial state can never be modified. All subsequent events append new immutable state nodes ($E_n$).
2. **Provenance Invariant:** Every derivative artifact must explicitly link to its parent node via a cryptographic input hash.
3. **No Silent Overwrite:** Conflicting multi-source histories are quarantined into non-destructive branches ($E_{10} \rightarrow E_{11\text{-A}} \parallel E_{11\text{-B}}$) for human adjudication.
4. **Zero-Trust Independent Verification:** Verification does not trust backend database claims; it independently recomputes all SHA-256 hashes and verifies Ed25519 digital signatures.
