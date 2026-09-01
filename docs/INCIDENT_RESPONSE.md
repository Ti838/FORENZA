# FORENZA — Security Incident Response Plan
**Document ID:** `DOC-INCIDENT-2026-001`

---

## 1. Incident Classification

| Severity | Definition | Examples | Response Window |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Compromise of cryptographic master keys, evidence tampering detection in sealed state, or unauthorized database mutation. | `HASH_MISMATCH`, `SIGNATURE_FAILURE`, database trigger alert. | Immediate (< 15 mins) |
| **HIGH** | Lost or stolen field device, active replay attack detection, multiple failed MFA attempts indicating brute-force. | `TOKEN_REPLAY`, stolen mobile device reporting. | < 1 hour |
| **MEDIUM** | Location perimeter breach without supervisor override, offline sync sequence rollback attempt. | `LOCATION_CONFLICT`, `ROLLBACK_ATTEMPT`. | < 4 hours |
| **LOW** | Minor metadata drift, AI discrepancy requiring routine analyst review. | AI claim discrepancy, routine audit log warnings. | Next business day |

---

## 2. Response Procedures

1. **Detection & Triage:** Automated detection via Security Event Center (FZ-SECURITY) alerts administrators and compliance officers.
2. **Containment:**
   * If device is compromised: Instantly update device status to `REVOKED` in `device_keys`. All subsequent API and sync requests from that device are blocked immediately.
   * If state conflict is detected: Quarantined automatically into a non-destructive branch (`FZ-BRANCH`) preventing corruption of the primary ledger.
3. **Investigation:** Forensic auditors use `FZ-DIV` and `FZ-IMPACT` to isolate the first divergence state and calculate all affected downstream artifacts.
4. **Remediation & Adjudication:** Human judicial authority reviews conflict and issues digitally signed adjudication ruling (`FZ-ADJ`).
5. **Post-Incident Review:** Document incident in tamper-proof audit ledger with root-cause analysis.
