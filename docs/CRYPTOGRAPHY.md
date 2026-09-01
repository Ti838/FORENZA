# FORENZA — Cryptographic Specification & Key Architecture
**Document ID:** `DOC-CRYPTO-2026-001`  
**Standard Mapping:** FIPS 180-4 (SHA-256), RFC 8032 (Ed25519), RFC 8785 (JCS), NIST SP 800-38D (AES-GCM)

---

## 1. Cryptographic Primitives

| Purpose | Algorithm | Specification | Usage |
| :--- | :--- | :--- | :--- |
| **Content Hashing** | SHA-256 | FIPS 180-4 | Cryptographic digest of raw media and evidence bytes. |
| **JSON Canonicalization** | RFC 8785 JCS | RFC 8785 | Deterministic, byte-for-byte serialization across all platforms. |
| **Digital Signatures** | Ed25519 | RFC 8032 / Edwards-curve | Asymmetric device and officer signatures for all state transitions. |
| **Offline Vault Encryption** | AES-256-GCM | NIST SP 800-38D | Authenticated symmetric encryption with 96-bit random IVs and 128-bit auth tags. |
| **Handover Tokens** | HMAC-SHA256 (JWT) | RFC 7519 | Opaque, short-lived, single-use signed tokens with UUIDv4 nonces. |
| **External Anchoring** | RFC 3161 | RFC 3161 / Merkle Tree | Optional trusted external time-stamping authority proofs. |

---

## 2. Multi-Layer Evidence Sealing (FZ-SEAL)

Sealing physical or digital evidence requires 3 deterministic cryptographic layers:

$$\text{content\_hash} = \text{SHA-256}(\text{raw evidence bytes})$$

$$\text{metadata\_hash} = \text{SHA-256}(\text{JCS}(\text{canonical metadata}))$$

$$\text{master\_hash} = \text{SHA-256}(\text{JCS}(\text{canonical manifest}))$$

$$\text{signature} = \text{Ed25519\_Sign}(\text{master\_hash}, \text{private\_key}_{\text{device/officer}})$$

---

## 3. Merkle Evidence State Engine (FZ-TWIN)

Evidence state transitions ($E_0 \rightarrow E_1 \rightarrow E_2 \dots$) form an append-only cryptographic Merkle DAG:

$$\text{event\_hash}_n = \text{SHA-256}(\text{JCS}(\text{event\_data}_n))$$

$$\text{state\_hash}_n = \text{SHA-256}(\text{JCS}(\{ \text{previous\_state\_hash}_{n-1}, \text{event\_hash}_n, \text{actor\_id}, \text{device\_id}, \text{timestamp\_utc}, \text{location} \}))$$

$$\text{signature}_n = \text{Ed25519\_Sign}(\text{state\_hash}_n, \text{private\_key}_{\text{device}})$$
