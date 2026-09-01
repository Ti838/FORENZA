# FORENZA — Evidence Provenance Reconciliation Algorithm (EPRA) & First Divergence Engine (FZ-DIV)
**Document ID:** `DOC-EPRA-2026-001`

---

## 1. Executive Purpose

In decentralized and multi-party forensic workflows (e.g. offline field capture, parallel lab transfers, independent auditor syncs), conflicting histories may arise. **EPRA** compares multi-source evidence state streams, identifies exact points of variance, evaluates conflict severity, and prevents silent overwriting of historical data.

---

## 2. Divergence Detection Algorithm (FZ-DIV)

Given two chronological state streams:
* Stream A: $E_0 \rightarrow E_1 \rightarrow E_2 \rightarrow E_3 \dots$
* Stream B: $E_0 \rightarrow E_1 \rightarrow E_2 \rightarrow E_3' \dots$

1. **Step 1:** Iterate chronologically from common root $E_0$.
2. **Step 2:** Compare $\text{state\_hash}_i(A) \stackrel{?}{=} \text{state\_hash}_i(B)$.
3. **Step 3:** At the first index $k$ where $\text{state\_hash}_k(A) \neq \text{state\_hash}_k(B)$, record:
   * **First Divergence Node:** $E_k(A)$ vs $E_k(B)$
   * **Common Ancestor Node:** $E_{k-1}$
   * **Conflicting Attributes:** Changed fields (e.g. `actor_id`, `timestamp`, `event_data`, `signature`, `location`).
   * **Downstream Affected States:** Count of subsequent dependent states on both branches.

---

## 3. Reconciliation Classification

| Verdict | Trigger Criteria | Action Taken |
| :--- | :--- | :--- |
| **`CONSISTENT`** | All state hashes and signatures match perfectly across streams. | Automatic fast-forward merge. |
| **`MINOR_CONFLICT`** | Non-critical metadata variance with unbroken parent state pointers. | Logged in Conflict Center; flag for review. |
| **`SIGNIFICANT_CONFLICT`** | Conflicting actors, locations, or timestamp drift beyond tolerance. | Escalated to Supervisor; requires review. |
| **`CRITICAL_CONFLICT`** | Broken state hash, invalid signature, or parent pointer mutation. | Immediate quarantine; parallel branches created (FZ-BRANCH); human adjudication required (FZ-ADJ). |
| **`UNRESOLVED`** | Conflicting streams with missing intermediate nodes or unverified keys. | Flagged in Judicial Workspace for trial determination. |

> **IMPORTANT FORENSIC PRINCIPLE:**  
> EPRA does not invent or declare "legal truth". It provides mathematically defensible, transparent, auditable comparison data for human judicial officers.
