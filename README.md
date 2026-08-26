# 🛡️ FORENZA — Enterprise Forensic Evidence Platform
### *Secure Evidence. Verified Chain. Defensible Truth.*

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=githubactions)](https://github.com/Ti838/FORENZA)
[![Test Suite](https://img.shields.io/badge/Tests-59%2F59%20Passed%20(100%25)-blue?style=for-the-badge&logo=vitest)](https://github.com/Ti838/FORENZA)
[![Compliance](https://img.shields.io/badge/Standards-ISO%2FIEC%2027037%20%7C%20NIST%20SP%20800--86-purple?style=for-the-badge&logo=shield)](https://github.com/Ti838/FORENZA)
[![Platforms](https://img.shields.io/badge/Platforms-Web%20%7C%20Android%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux-orange?style=for-the-badge&logo=googleplay)](https://github.com/Ti838/FORENZA)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%20%2B%20Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 📌 Executive Summary

**FORENZA** is an enterprise-grade digital and physical evidence chain-of-custody, cryptographic verification, and judicial review platform. Built for law-enforcement agencies, forensic science laboratories, and judicial chambers, FORENZA provides mathematically verifiable guarantees against evidence tampering, retroactive record alteration, and broken custody chains.

Designed with reference to internationally recognized standards:
* **ISO/IEC 27037:2012** — Guidelines for identification, collection, acquisition, and preservation of digital evidence.
* **ISO/IEC 27038:2014** — Specification for digital redaction.
* **NIST SP 800-86** — Guide to Integrating Forensic Techniques into Incident Response.
* **UNODC & Budapest Convention** aligned cyber-forensic chain of custody protocols.

---

## 🏛️ System Architecture Topology

FORENZA operates on a unified core architecture connecting 5 authorized native client applications to an append-only PostgreSQL database, W3C SubtleCrypto SHA-256 ledger, and private cloud storage buckets.

```mermaid
flowchart TD
    subgraph Clients["Authorized Client Tier"]
        WebClient["🌐 Web Workstation\n(Next.js 16 • React 19 • TypeScript)"]
        AndroidClient["📱 Android Field Client\n(Flutter 3.x • SQLite AES-256 Vault)"]
        WindowsClient["🖥️ Windows Desktop Client\n(Tauri 2.x • Rust • Inno Setup)"]
        MacClient["🍏 macOS Judicial Hub\n(Tauri 2.x • Universal DMG)"]
        LinuxClient["🐧 Linux Workstation\n(Tauri 2.x • AppImage / .deb)"]
    end

    subgraph Security["Zero-Trust Security & API Gateway"]
        AuthGW["🔐 Next.js Edge Middleware\n(JWT • MFA • Rate Limiter • RBAC)"]
        Honeypot["📡 Decoy Telemetry Engine\n(Honeypot Coordinate Masking)"]
        DeviceTrust["📱 Hardware Device Token Binding\n(TPM / Secure Enclave Registry)"]
    end

    subgraph Services["Core Subsystems & Engines"]
        CryptoEngine["⚡ W3C SubtleCrypto & Dart Crypto\n(Canonical SHA-256 Master Hashes)"]
        AIEngine["🤖 Google Gemini 2.0 Flash\n(Multimodal Classification & Discrepancy)"]
        MapEngine["🗺️ MapTiler Satellite Radar\n(Vector Tiles & GPS Geofences)"]
        DossierEngine["📜 jsPDF Court Dossier Engine\n(Rule 902(14) Certified PDF Streamer)"]
        SyncEngine["🔄 Idempotent Sync Engine\n(Dual Timestamp & Conflict Resolution)"]
    end

    subgraph Persistence["Storage & Persistence Tier (Supabase)"]
        PostgresDB[("🗄️ PostgreSQL 15 Database\n(17 Migrations • RLS Policies • SQL Triggers)")]
        PrivateStorage[("🔒 Private Object Storage\n(60s TTL Signed URLs • AES-256 Encrypted)")]
        AuditLedger[("📜 Immutable Audit Ledger\n(Append-Only Cryptographic Log)")]
    end

    Clients --> AuthGW
    AuthGW --> Security
    Security --> Services
    Services --> Persistence
```

---

## 🔄 9-Stage Evidentiary Lifecycle

Every physical and digital item follows an immutable 9-step state machine from crime-scene acquisition to courtroom trial:

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 👮 Investigating Officer
    participant Device as 📱 Field Client
    participant Server as ⚡ FORENZA Core API
    actor Custodian as 🏢 Vault Custodian
    actor Analyst as 🔬 Lab Analyst
    actor Judge as ⚖️ Judicial Chamber

    Officer->>Device: Authenticate via Biometric & Hardware Device Token
    Officer->>Device: Capture Raw Evidence Media in Viewfinder
    Device->>Device: Lock GPS (±3m) & Canonicalize: H = SHA256(Raw + Metadata)
    alt Online Mode
        Device->>Server: Ingest Evidence & Verify Master Seal
    else Offline Emergency Mode
        Device->>Device: Encrypt AES-256 in Local Private Vault -> "SAFE TO LEAVE"
        Device-->>Server: Automatic Idempotent Sync when network returns
    end
    Officer->>Device: Generate 15-Min Dynamic QR Handover Token
    Custodian->>Device: Scan QR & Dual-Sign Custody Transfer
    Custodian->>Server: Log Append-Only Custody Block (H_i = SHA256(H_i-1 + Event))
    Custodian->>Analyst: Handover Aliquot Sample for Chemical/Digital Analysis
    Analyst->>Server: Record Consumed Sample & Seal Digital PDF Findings
    Judge->>Server: Review Read-Only Vertical Timeline & Audit Proofs
    Judge->>Server: Export Self-Authenticating Rule 902(14) Court Dossier PDF
```

---

## ⚡ Multi-Platform Capability Matrix

FORENZA does not wrap websites inside WebViews. It provides native, platform-optimized applications sharing the same cryptographic backend:

| Feature / Capability | Android (Mobile) | Windows Desktop | macOS Desktop | Linux Desktop | Web Workstation |
|---|:---:|:---:|:---:|:---:|:---:|
| **Authentication & MFA** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **7-Tier Role Access Control (RBAC)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Hardware Camera Viewfinder** | 📸 Native Hardware | 📸 Supported | 📸 Supported | 📸 Supported | 📸 Web API |
| **Hardware GPS & 500m Geofence** | 📍 Native GPS Sensor | 📍 OS Location | 📍 OS Location | 📍 OS Location | 📍 Browser API |
| **Offline-First AES-256 Vault** | ⚡ Full Native Vault | ⚡ Local Secure | ⚡ Local Secure | ⚡ Local Secure | ⚡ PWA Cache |
| **Single-Use QR Handover Tokens** | 📷 Native Scanner | 🖥️ Display / Gen | 🖥️ Display / Gen | 🖥️ Display / Gen | 🖥️ Display / Gen |
| **Transit Telemetry & Decoy Defense** | 📡 Live Broadcast | 🗺️ Satellite HUD | 🗺️ Satellite HUD | 🗺️ Satellite HUD | 🗺️ Satellite HUD |
| **Lab Sample Depletion Tracking** | 🔬 Intake / View | 🔬 Full Desk | 🔬 Full Desk | 🔬 Full Desk | 🔬 Full Desk |
| **Judicial Timeline & Dossier Export** | ⚖️ View Only | 📜 Full jsPDF | 📜 Full jsPDF | 📜 Full jsPDF | 📜 Full jsPDF |
| **3-Mode Theme (Light/Dark/Auto)** | 🎨 System / L / D | 🎨 System / L / D | 🎨 System / L / D | 🎨 System / L / D | 🎨 System / L / D |
| **Packaging & Installer** | `.apk` / `.aab` | `.exe` (Inno Setup) | `.dmg` Drag-Drop | `.AppImage` / `.deb` | Cloud Web (Zero-Install) |

---

## 🔐 Cryptographic Integrity & Master Hashing

Evidence integrity is mathematically enforced using deterministic SHA-256 master hashing and recursive custody chains:

### 1. Deterministic Master Evidence Hash
$$H_{\text{master}} = \text{SHA-256}\Big(\text{RawMediaBytes} + \text{EvidenceID} + \text{CaseID} + \text{OfficerID} + \text{GPS}_{\text{lat,lng}} + \text{Timestamp}_{\text{UTC}}\Big)$$

### 2. Recursive Append-Only Custody Chain
$$H_0 = H_{\text{master}}$$
$$H_i = \text{SHA-256}\Big(H_{i-1} + \text{SenderID} + \text{ReceiverID} + \text{Timestamp} + \text{Location} + \text{Action}\Big)$$

If any byte in historical events or media is altered, recursive recalculation fails and flags the record as **`COMPROMISED / TAMPERED`**.

---

## 🗂️ Certified Role Workstations

FORENZA provides 7 segregated operational workstations enforced via PostgreSQL Row Level Security (RLS):

```
┌──────────────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Role Desk                            │ Primary Responsibilities & UI Features                                 │
├──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 1. Investigating Officer (/officer)  │ Camera viewfinder, GPS geofence radar, offline vault, and QR tokens.   │
│ 2. Vault Custodian (/vault)          │ Physical rack/bin indexing, intake barcode scanner, and custody ledger.│
│ 3. Forensic Laboratory (/lab)        │ Scientific aliquot sample depletion, report hash sealing, and AI diff. │
│ 4. Supervisor (/supervisor)          │ Multi-case oversight, officer telemetry tracking, and 500m overrides. │
│ 5. Judicial Chamber (/judge)         │ Read-only vertical timeline, evidence inspection, and Court Dossiers.  │
│ 6. System Administrator (/admin)     │ User RBAC, hardware device token approvals, and master audit ledger.   │
│ 7. Compliance Officer (/auditor)     │ ISO/IEC 27037 & NIST SP 800-86 international compliance dashboards.    │
└──────────────────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js**: v18.18.0+ or v20.x+
* **Flutter SDK**: v3.19+ (for Android development)
* **Rust & Cargo**: v1.75+ (for Desktop Tauri builds)
* **Git**

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Ti838/FORENZA.git
cd FORENZA

# Copy environment variables
cp .env.example web/.env.local
```

### 2. Run Web Platform
```bash
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Run Automated Vitest Test Suite
```bash
cd web
npm test
# Running 9 test suites: 59 passed (100%)
```

### 4. Run Mobile Field Client (Android)
```bash
cd mobile
flutter pub get
flutter run -d android
```

### 5. Run Native Desktop Application (Windows / Linux / macOS)
```bash
cd desktop
cargo tauri dev
```

---

## 🧪 Test Verification Suite

FORENZA includes a comprehensive test suite with **59 passing tests across 9 test suites**:

```bash
 ✓ __tests__/offline-sync.test.ts (3 tests)
 ✓ __tests__/theme-system.test.ts (7 tests)
 ✓ __tests__/tamper-detection.test.ts (4 tests)
 ✓ __tests__/compliance-ethics.test.ts (5 tests)
 ✓ __tests__/evidence-hash.test.ts (13 tests)
 ✓ __tests__/custody-chain.test.ts (13 tests)
 ✓ __tests__/e2e-mvp.test.ts (1 test)
 ✓ __tests__/rbac.test.ts (5 tests)
 ✓ __tests__/geofence.test.ts (8 tests)

 Test Files  9 passed (9)
      Tests  59 passed (59)
   Duration  1.40s (100% Pass Rate)
```

---

## 📜 Documentation Index

Deep technical architecture papers and operational runbooks are available in the [`/docs`](docs) directory:

* 📐 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Comprehensive system topology, microservices & data flow.
* 🔐 [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, cryptographic specs, and ISO 27037 compliance.
* ⚡ [`docs/API.md`](docs/API.md) — Complete REST endpoints, request/response schemas, and error codes.
* 💻 [`docs/PLATFORM_SUPPORT.md`](docs/PLATFORM_SUPPORT.md) — Multi-platform compilation and packaging guides.
* 🛠️ [`docs/SETUP.md`](docs/SETUP.md) — Production deployment and cloud configuration guide.

---

## ⚖️ Legal & Ethical Governance Notice

FORENZA is designed with reference to internationally recognized digital-evidence and information-security practices (including ISO/IEC 27037, ISO/IEC 27038, NIST SP 800-86, and Rule 902(14) data self-authentication principles). 

*All legal admissibility determinations remain strictly subject to competent judicial authority, applicable statutory law, and institutional standard operating procedures.*

---

© 2026 FORENZA Enterprise Forensics. All rights reserved.
