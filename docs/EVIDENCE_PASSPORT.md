# FORENZA — Evidence Integrity Passport (FZ-PASS) & Independent Cryptographic Verifier (FZ-VERIFY)
**Document ID:** `DOC-PASS-2026-001`

---

## 1. Evidence Integrity Passport (`FZ-PASS`)

The **Evidence Integrity Passport** is a standardized, portable, zero-trust JSON package containing complete cryptographic proofs of an evidence item's entire lifecycle without exposing raw sensitive media bytes.

### Passport Structure:
```json
{
  "manifest_version": "FZ-PASS-v1",
  "evidence_id": "FZ-2026-CASE001-EV000001",
  "case_id": "CASE-2026-001",
  "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "metadata_hash": "a1b2c3d4...",
  "master_hash": "f6e5d4c3...",
  "sealing_signature": "304502...",
  "sealing_key_id": "DEV-OFFICER-KEY-01",
  "state_history": [ ... ],
  "provenance_graph": { ... },
  "adjudications": [ ... ],
  "generated_at_utc": "2026-09-01T12:00:00Z",
  "issuer_identity": "FORENZA_ROOT_AUTHORITY"
}
```

---

## 2. Independent Offline Verifier (`FZ-VERIFY`)

`FZ-VERIFY` is a standalone verification tool that runs locally in modern browsers, Node.js, or offline workstations without requiring connection to the FORENZA database.

### Verification Execution Sequence:
1. **Passport Packaging Integrity:** Recomputes SHA-256 of canonical payload and matches against `passport_hash`.
2. **Initial Sealing Integrity:** Verifies Ed25519 signature of `master_hash` against officer/device public key.
3. **State History Integrity:** Recomputes all intermediate `event_hash` and `state_hash` nodes from genesis $E_0$ to current head $E_n$, checking every parent hash link and digital signature.
4. **Adjudication Integrity:** Verifies judicial rulings against judicial chamber public keys.
5. **Output Verdict:** `PASS`, `FAIL`, `PARTIALLY_VERIFIABLE`, or `UNVERIFIABLE`.
