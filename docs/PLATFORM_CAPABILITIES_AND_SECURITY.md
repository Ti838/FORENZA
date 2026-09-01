# 🛡️ FORENZA — Platform Capabilities & Security Specifications
**Creator, Inventor & Intellectual Property Owner:** Timon Biswas (`timonbiswas33@gmail.com`)  
**Document ID:** `DOC-CAP-2026-V1`  
**Classification:** Operational & Cryptographic Capability Overview  
**Aligned Standards:** ISO/IEC 27037:2012, NIST SP 800-86, Federal Rules of Evidence Rule 902(14)  

---

```
                                      🌟 FORENZA AT A GLANCE
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │  • 100% Mathematically Verifiable Digital & Physical Chain of Custody                 │
    │  • Tamper-Evident Merkle State DAG (FZ-TWIN) + Asymmetric Ed25519 Hardware Signatures  │
    │  • Military-Grade AES-256-GCM Offline Vault with Monotonic Sequence Rollback Defense   │
    │  • Tactical GPS Geofencing (Haversine 500m) + 25-Node Decoy Cloaking Against Hackers  │
    │  • Non-Destructive Multi-Device Reconciliation & First-Divergence Pointer (FZ-EPRA)    │
    │  • Multi-Model Assistive AI Orchestration with Tripartite Provenance & Injection Guard │
    │  • Self-Contained Judicial Evidence Passports (FZ-PASS) & Standalone Offline Verifier  │
    └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 1. What You Can ACTUALLY Do With FORENZA

FORENZA replaces vulnerable paper logs, easily manipulated databases, and unverified files with a zero-trust forensic platform where every single event is cryptographically bound to hardware keys and immutable state trees.

---

### 📸 1.1 Field Evidence Acquisition & Instant Sealing
* **Instant Digital Sealing:** Field officers take photos or record videos at a crime scene. FORENZA instantly computes a canonical **RFC 8785 JSON manifest** and **SHA-256 cryptographic master digest**.
* **Hardware Key Binding:** The evidence digest is digitally signed on the officer's device using an **Ed25519 asymmetric private key** tied to that specific phone or laptop.
* **Result:** No one—not even the database admin or server owner—can alter the photo or claim the officer was not the one who took it.

---

### 📍 1.2 GPS Crime Scene Geofencing & Hacker Cloaking Defense
* **500-Meter Crime Scene Validation:** Uses the **Haversine Great-Circle Geodesic formula** to verify that the officer was physically within 500 meters of the registered crime scene when capturing evidence.
* **Anti-Spoofing & Teleportation Detection:** Detects fake GPS apps (Mock Location) by analyzing velocity ($\Delta d / \Delta t$). Any impossible jump ($>162\text{ km/h}$) is flagged as `IMPOSSIBLE_VELOCITY`.
* **Tactical Decoy Cloaking (Anti-Hacker Defense):** If an adversary or hacker sniffs network telemetry to track the officer, the system broadcasts **25 fluctuating phantom decoy nodes** across a 15km mesh. The hacker gets confused by erratic jumps, while **authorized supervisors and judges see the true, decrypted pinpoint location**.

---

### 📱 1.3 Offline Field Vault with Zero Network Dependency
* **Remote Capture Without Internet:** Officers in basements, jungles, or areas without cellular coverage can continue seizing and cataloging evidence.
* **AES-256-GCM Encrypted Storage:** All media is encrypted on the local device with a 96-bit random IV and 128-bit GMAC authentication tag.
* **Monotonic Sequence Replay Guard:** When the device reconnects to Wi-Fi/4G, synchronization checks sequential monotonic counters to prevent replay attacks and state rollback tampering.

---

### 🔄 1.4 Non-Destructive Multi-Device Reconciliation (FZ-EPRA)
* **Conflict Resolution Without Data Loss:** If two officers work offline on the same case and create divergent histories, FORENZA does **NOT** overwrite either version.
* **FZ-DIV First Divergence Detection:** The **Evidence Provenance Reconciliation Algorithm (FZ-EPRA)** traverses both state trees in linear time ($O(\min(N_A, N_B))$) and pinpoints the exact node where histories diverged.
* **Human Judicial Adjudication:** The supervisor and judge review both branches side-by-side and sign an authoritative adjudication state.

---

### 🔬 1.5 Forensic Laboratory Sample Lineage DAG
* **Sub-Sample Splitting:** When forensic scientists split seized evidence into sub-samples (e.g., Blood Sample $\rightarrow$ DNA Extract + Toxicology Vial), the system maintains a parent-child Merkle Directed Acyclic Graph (DAG).
* **Consumption Tracking:** Tracks chemical consumption, remaining volume, and test parameters with immutable hashes.
* **Report Extraction:** Analysts upload lab reports; optical character recognition (OCR) extracts key findings and binds the document's SHA-256 hash to the case.

---

### 🔏 1.6 Single-Use QR Custody Handover
* **Officer-to-Vault / Officer-to-Lab Handover:** When transferring physical evidence, the releasing officer generates a dynamic, time-limited **HMAC-SHA256 QR token**.
* **One-Time Nonce Protection:** The receiving custodian scans the QR code. The system validates the single-use cryptographic nonce, logs both officers' device IDs, and atomically transfers custody.

---

### 🤖 1.7 Multi-Model Assistive AI Forensic Intelligence (FZ-AI)
* **120B Timeline & Reasoning Engine:** Analyzes complex case histories, flags timeline discrepancies, and synthesizes executive case summaries via **GPT-OSS 120B / DeepSeek R1**.
* **Multimodal Vision & Verbatim OCR:** Inspects evidence photos, extracts serial numbers, and cross-checks documents via **Gemini 3.6 Multimodal Vision** and **Nemotron OCR**.
* **Case-Isolated Semantic RAG Search:** Cosine vector search ($\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$) strictly pre-filtered by tenant access (`WHERE case_id = $1`).
* **Tripartite AI Provenance & Human-in-the-Loop:** Every AI output records an immutable hash triple ($H_{\text{input}} \parallel H_{\text{prompt}} \parallel H_{\text{output}}$) and carries a mandatory banner: **`AI GENERATED — HUMAN REVIEW REQUIRED`**. AI never alters evidence hashes.

---

### ⚖️ 1.8 Courtroom Judicial Review & Evidence Passport (FZ-PASS)
* **Courtroom Interactive Timeline:** Judges can scrub through the complete interactive Merkle state timeline from crime scene to court.
* **Self-Contained Portable Dossier (FZ-PASS):** Generates a cryptographic archive containing all media, manifests, and signatures that can be verified offline by independent defense attorneys or judges using the standalone **FZ-VERIFY** engine.
* **Signed Adjudication:** Judges issue digitally signed rulings (`ADMISSIBLE`, `INADMISSIBLE`, `CONTESTED`) that append an immutable verdict node to the state chain.

---

## 🔒 2. Comprehensive Defense-in-Depth Security Matrix

| Threat Vector | Potential Attack | FORENZA Defense Mechanism | Operational Result |
| :--- | :--- | :--- | :--- |
| **Evidence Tampering** | Changing a photo or file after seizure | SHA-256 master hashing + Merkle DAG chain pointer ($H_n = \text{SHA256}(H_{n-1} \parallel E_n)$) | Any 1-bit change breaks downstream state hashes; immediate red alert. |
| **Repudiation** | Officer denies seizing or transferring an item | Asymmetric Ed25519 digital signature over Curve25519 hardware keys | Legally self-authenticating under FRE Rule 902(14). |
| **Offline Replay Attack** | Replaying an old sync payload to roll back custody | Monotonic sequence counters + processed event ID cache | Out-of-order or duplicate payloads are rejected with `REJECTED_REPLAY`. |
| **GPS Spoofing** | Using fake location apps to fake crime scene presence | Haversine velocity check ($\Delta d / \Delta t > 162\text{ km/h}$) + perimeter bounds | Flags `IMPOSSIBLE_VELOCITY` or `OUTSIDE_PERIMETER`. |
| **Adversary Tracking** | Hacker intercepts network traffic to pinpoint officer | 25-node dynamic honey-decoy location cloaking | Hacker sees 25 fluctuating phantom points; true location is encrypted. |
| **Prompt Injection** | Hostile document injects instructions into AI | XML delimiter isolation (`<untrusted_evidence_content>`) + regex suppression | Neutralizes malicious instructions before LLM execution. |
| **Unauthorized Access** | Rogue officer accesses judicial or admin screens | 7-tier strict RBAC + Supabase Row Level Security (RLS) + Middleware | `403 Forbidden` on unauthorized route or database access. |
| **Device Theft** | Stolen laptop or mobile trying to access system | Hardware Device Attestation & Instant Remote Revocation in `/admin` | Admin revokes device key; stolen device is instantly locked out. |

---

## 🧮 3. Mathematically Verified Test Suite (116/116 Passed)

All platform features, cryptographic state machines, reconciliation routines, and security defenses are audited by an automated test suite:

```bash
 ✓ __tests__/custody-chain.test.ts (13 tests)
 ✓ __tests__/phase1-crypto-device.test.ts (6 tests)
 ✓ __tests__/phase2-state-custody.test.ts (2 tests)
 ✓ __tests__/phase3-reconciliation-branching.test.ts (3 tests)
 ✓ __tests__/phase4-physical-lineage-assurance.test.ts (3 tests)
 ✓ __tests__/phase5-offline-vault-sync.test.ts (2 tests)
 ✓ __tests__/phase6-ai-provenance.test.ts (2 tests)
 ✓ __tests__/phase7-security-lab-impact.test.ts (3 tests)
 ✓ __tests__/phase8-passport-verifier.test.ts (1 test)
 ✓ __tests__/phase9-security-matrix.test.ts (15 tests)
 ✓ __tests__/phase-ai-orchestrator.test.ts (16 tests)
 ✓ __tests__/evidence-hash.test.ts (13 tests)
 ✓ __tests__/tamper-detection.test.ts (4 tests)
 ✓ __tests__/compliance-ethics.test.ts (5 tests)
 ✓ __tests__/offline-sync.test.ts (3 tests)
 ✓ __tests__/geofence.test.ts (12 tests)
 ✓ __tests__/theme-system.test.ts (7 tests)
 ✓ __tests__/rbac.test.ts (5 tests)
 ✓ __tests__/e2e-mvp.test.ts (1 test)

 Test Files  19 passed (19)
      Tests  116 passed (116)
   Pass Rate 100% (0 Errors)
```

---

## 📜 Proprietary Ownership & Commercial Inquiries

**Copyright © 2024–2026 Timon Biswas. All Rights Reserved.**  
**Creator & Sole Intellectual Property Owner:** Timon Biswas (`timonbiswas33@gmail.com`)  
**License:** Source-Available Public Inspection & Proprietary Architecture License ([View License](../LICENSE.md))
