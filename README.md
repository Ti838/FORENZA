<div align="center">

  <img src="web/public/brand/forenza-banner.svg" alt="FORENZA Forensic Platform" width="100%" />

  <br/><br/>

  <a href="https://github.com/Ti838/FORENZA">
    <img src="web/public/brand/logo.png" alt="FORENZA Official Logo" width="130" style="border-radius: 50%; box-shadow: 0 0 30px rgba(56, 189, 248, 0.4);" />
  </a>

  <br/><br/>

  # 🛡️ FORENZA
  ### *Zero-Trust Evidence Chain-of-Custody & Multi-Model Forensic Intelligence*

  [![License](https://img.shields.io/badge/License-Source--Available%20%2F%20Inspection%20Only-0284C7?style=for-the-badge&logo=shield)](LICENSE.md)
  [![Build Status](https://img.shields.io/badge/Build-Passing%20(0%20Errors)-059669?style=for-the-badge&logo=githubactions)](https://github.com/Ti838/FORENZA)
  [![Test Suite](https://img.shields.io/badge/Vitest-116%2F116%20Passed%20(100%25)-3B82F6?style=for-the-badge&logo=vitest)](https://github.com/Ti838/FORENZA)
  [![Standards](https://img.shields.io/badge/Standards-ISO%2FIEC%2027037%20%7C%20FRE%20902(14)-8B5CF6?style=for-the-badge&logo=codeforces)](docs/COMPLIANCE_MAPPING.md)
  [![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%20%2B%20Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
  [![Cryptography](https://img.shields.io/badge/Crypto-Ed25519%20%7C%20SHA--256%20%7C%20AES--256--GCM-EF4444?style=for-the-badge&logo=keybase)](docs/CRYPTOGRAPHIC_SPECIFICATION.md)

  <br/>

  **[⚡ What FORENZA Can Do & Security Specs](docs/PLATFORM_CAPABILITIES_AND_SECURITY.md) • [✨ Live Features](#-core-forensic-engines) • [📐 Architecture](#-system-architecture) • [🧮 Algorithms](docs/FORENZA_Algorithm_Documentation.md) • [🚀 Quickstart](#-quickstart--deployment) • [📚 Master Docs](docs/README.md)**

</div>

---

## 📌 Executive Summary

**FORENZA** is a next-generation forensic evidence acquisition, cryptographic preservation, and multi-model artificial intelligence platform engineered for law-enforcement agencies, forensic science laboratories, and judicial chambers.

Built from the ground up to satisfy **ISO/IEC 27037:2012** and **Federal Rules of Evidence Rule 902(14)**, FORENZA replaces vulnerable paper trails and centralized databases with **mathematically defensible Merkle state DAGs**, **Ed25519 hardware signatures**, **asynchronous offline reconciliation**, and **assistive multi-model AI reasoning**.

```
   EVIDENCE ACQUISITION ──► RFC 8785 JCS ──► SHA-256 MASTER HASH ──► Ed25519 HARDWARE SIGN
                                                                             │
   JUDICIAL REVIEW ◄── FZ-AI MULTI-MODEL ◄── FZ-EPRA DIVERGENCE ◄── MERKLE STATE DAG
```

---

## ⚡ Key Highlights & Core Metrics

| Forensic Invariant | Mathematical Guarantee | Operational Result |
| :--- | :--- | :--- |
| **Tamper-Evident Lineage** | Merkle State DAG ($H_n = \text{SHA256}(H_{n-1} \parallel \text{Event}_n)$) | Retroactive deletion or modification breaks downstream state pointers. |
| **Legal Non-Repudiation** | Asymmetric Ed25519 Curve25519 Signatures | Every state event is cryptographically bound to an attested hardware key. |
| **Offline Sealing** | AES-256-GCM + Monotonic Sequence Counters | Field officers can securely capture evidence offline without network access. |
| **Conflict Resolution** | FZ-EPRA & FZ-DIV Graph Traversal | Detects first divergence points across devices non-destructively. |
| **Perimeter Verification** | Haversine Geodesic Distance Formula | Mathematically validates evidence capture within crime scene radius. |
| **Assistive AI Invariant** | Isolated Provenance ($H_{\text{input}} \parallel H_{\text{prompt}} \parallel H_{\text{output}}$) | AI analyzes data with zero ability to mutate authoritative evidence hashes. |

---

## 🏛️ System Architecture

FORENZA unifies **5 client tiers** around one zero-trust backend with cryptographic state trees and non-destructive reconciliation:

```
                            CLIENT APPLICATIONS
    ┌─────────────────────────────────┬─────────────────────────────────┐
    ▼                                 ▼                                 ▼
Web Workstation (Next.js 15)      Android Field Client (Flutter)    Desktop App (Tauri 2.x)
(Investigator / Lab / Judge)      (Offline AES-256-GCM Vault)       (Windows / macOS / Linux)
    └─────────────────────────────────┬─────────────────────────────────┘
                                      │
                                      ▼
                   ZERO-TRUST AUTHORIZATION & IDENTITY GATEWAY
    ├── FZ-ID: WebAuthn, TOTP AAL2 Multi-Factor Authentication & Device Keys
    ├── RBAC Matrix: 7 Operational Workstations (Officer, Lab, Custodian, Judge, etc.)
    └── Edge Rate Limiting & Tamper Alert Logging
                                      │
                                      ▼
                            FORENZA CORE ENGINES
    ├── 🛡️ FZ-SEAL: RFC 8785 Canonical JSON Serialization & SHA-256 Master Digest
    ├── ⛓️ FZ-TWIN: Merkle Evidence State DAG History (E0 -> E1 -> E2 ...)
    ├── 🔏 FZ-CHAIN: Single-Use Nonce-Protected Custody Transfer Handover
    ├── 🔄 FZ-EPRA: Evidence Provenance Reconciliation & First Divergence (FZ-DIV)
    ├── 📱 FZ-VAULT: Authenticated Encryption (AES-256-GCM) with Rollback Defense
    ├── 📍 FZ-GEOFENCE: Haversine Great-Circle Geodesic Perimeter Enforcement
    ├── 📇 FZ-PASS: Self-Contained Evidence Passport Container & Standalone Verifier
    └── 🤖 FZ-AI: Multi-Model Forensic Intelligence Orchestrator
```

---

## 🤖 FZ-AI Multi-Model Orchestrator

The **FZ-AI Orchestrator** decouples FORENZA's application logic from underlying model vendors. Every AI inference is strictly assistive, data-minimized, prompt-injection protected, and badged with **`AI GENERATED — HUMAN REVIEW REQUIRED`**.

```
                   FZ-AI ORCHESTRATOR & ROUTER
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
Groq Cloud (120B)       Google Gemini 3.6       Open-Source NIM
• Timeline Reasoning    • Multimodal Vision     • Nemotron OCR V2
• EPRA Explanation      • Verbatim OCR Scan     • Nemotron Embed 1B
• Discrepancy Detection • Cross-Verification    • Riva Translate 4B
• Report Synthesis      • Fallback Engine       • Nemoguard Safety
       └───────────────────────┬───────────────────────┘
                               ▼
        TRIPARTITE PROVENANCE RECORDER & HUMAN REVIEW
```

---

## 🧮 Implemented Algorithms

FORENZA contains **11 verified mathematical, cryptographic, and spatial algorithms** backed by 112 automated unit tests:

```
├── [01] RFC 8785 JSON Canonicalization (JCS) ──────► Deterministic JSON dictionary key sorting
├── [02] Secure Hash Algorithm 256 (SHA-256) ────────► 256-bit immutable master evidence digest
├── [03] Recursive Merkle DAG State Hashing ─────────► Chronological custody state linkage
├── [04] Ed25519 Curve25519 Digital Signatures ──────► Device hardware key attestation & non-repudiation
├── [05] AES-256-GCM Authenticated Encryption ───────► Confidential offline vault storage
├── [06] Haversine Great-Circle Distance ────────────► 500m crime scene geofence validation
├── [07] FZ-EPRA & FZ-DIV Graph Traversal ───────────► Linear first-divergence node detection
├── [08] Monotonic Sequence Replay Guard ────────────► Rollback & replay attack prevention
├── [09] Cosine Vector Similarity (RAG) ─────────────► High-dimensional case-isolated search
├── [10] Prompt Injection Sanitization ──────────────► XML boundary delimiter isolation
└── [11] HMAC-SHA256 Token Signing ──────────────────► Single-use QR custody transfer nonces
```

📄 **Complete Technical Document:** [docs/FORENZA_Algorithm_Documentation.md](docs/FORENZA_Algorithm_Documentation.md) | [Download PDF](docs/FORENZA_Algorithm_Documentation.pdf) | [Download Word DOCX](docs/FORENZA_Algorithm_Documentation.docx)

---

## 🚀 Quickstart & Deployment

### Prerequisites
* **Node.js:** `v20.x` or `v22.x`
* **Package Manager:** `npm` or `pnpm`
* **Database:** PostgreSQL 15+ (or Supabase Cloud)

### 1. Clone & Configure
```bash
git clone https://github.com/Ti838/FORENZA.git
cd FORENZA/web
cp ../.env.example .env.local
```

### 2. Install Dependencies & Run Tests
```bash
npm install
npm test
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📚 Master Documentation Index

All technical documents are maintained in the [`/docs`](docs/README.md) directory:

| Document | Topic | Description |
| :--- | :--- | :--- |
| [📁 REPOSITORY_STRUCTURE.md](docs/REPOSITORY_STRUCTURE.md) | System Blueprint | Complete directory and file tree breakdown. |
| [🧮 Algorithm Documentation](docs/FORENZA_Algorithm_Documentation.md) | Algorithms & Math | LaTeX formulas, complexity analysis, and verification. |
| [📐 SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Architecture | End-to-end topology and trust boundaries. |
| [⚡ CRYPTOGRAPHIC_SPEC.md](docs/CRYPTOGRAPHIC_SPECIFICATION.md) | Cryptography | Ed25519, SHA-256, and RFC 8785 specifications. |
| [🔄 EPRA.md](docs/EPRA.md) | Reconciliation | FZ-EPRA reconciliation and divergence detection. |
| [🤖 AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) | AI Subsystem | Multi-model orchestration and task routing. |
| [🔍 AI_LIVE_VERIFICATION.md](docs/AI_LIVE_VERIFICATION.md) | Live Testing | Real API latency and response verification log. |
| [🛡️ THREAT_MODEL.md](docs/THREAT_MODEL.md) | Security | STRIDE matrix, attack surfaces, and mitigations. |
| [📋 COMPLIANCE_MAPPING.md](docs/COMPLIANCE_MAPPING.md) | Standards | ISO/IEC 27037, NIST SP 800-86, and FRE 902(14). |

---

## 📜 Proprietary License & Ownership

**Copyright © 2024–2026 Timon Biswas. All Rights Reserved.**  
**Creator & Sole Rights Holder:** Timon Biswas (`timonbiswas33@gmail.com`)

```
================================================================================
PUBLIC INSPECTION PERMITTED — ZERO COMMERCIAL OR ARCHITECTURAL REPLICATION
================================================================================
This repository is SOURCE-AVAILABLE for educational study, research review, and
security audits. However, the system architecture, Merkle state engines, EPRA
reconciliation flows, and proprietary inventions are the exclusive property of
Timon Biswas.

Replicating or cloning this architecture in ANY programming language (Go, Rust,
Python, Java, etc.) or using this software commercially without written consent
is strictly prohibited and subject to international legal enforcement.
================================================================================
```

For commercial licensing, enterprise pilot inquiries, or official authorization:  
📧 **Direct Contact:** `timonbiswas33@gmail.com` | [View Full License](LICENSE.md)
