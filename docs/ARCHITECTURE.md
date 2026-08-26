# 🏛️ FORENZA — Master System Architecture Document
### Enterprise Digital & Physical Evidence Chain-of-Custody Infrastructure

---

## 1. Architectural Philosophy

FORENZA is architected as a **Zero-Trust, Append-Only Cryptographic Evidence Ledger**. Every interaction—from crime-scene photon capture to judicial dossier review—is recorded into an immutable, mathematically verifiable state chain.

```mermaid
graph TD
    subgraph ClientLayer["1. Client Layer (Multi-Platform)"]
        Web["🌐 Web Client (Next.js 16 • React 19)"]
        Android["📱 Android Field App (Flutter 3.x Native)"]
        Desktop["🖥️ Desktop Workstations (Tauri 2.x • Rust)"]
    end

    subgraph GatewayLayer["2. Gateway & Edge Security"]
        EdgeMW["Edge Middleware & Auth Guard"]
        RateLimit["Token Bucket Rate Limiter"]
        Decoy["Honeypot Decoy Telemetry Engine"]
    end

    subgraph ServiceLayer["3. Core Forensic Services"]
        EvidenceSvc["Evidence Ingestion & Canonical Hashing"]
        CustodySvc["Dual-Sign Custody Handover Engine"]
        AIEngine["Gemini 2.0 Multimodal Classifier"]
        AuditSvc["Append-Only Audit Ledger Trigger"]
        DossierSvc["Rule 902(14) jsPDF Dossier Streamer"]
    end

    subgraph PersistenceLayer["4. Authoritative Persistence (PostgreSQL 15)"]
        DB[("PostgreSQL Database (17 Migrations)")]
        RLS["Row Level Security (RLS) Policies"]
        Storage[("Private Cloud Object Storage Buckets")]
    end

    ClientLayer --> GatewayLayer
    GatewayLayer --> ServiceLayer
    ServiceLayer --> PersistenceLayer
```

---

## 2. Cryptographic Master Hashing & Hash-Chaining

### 2.1 Canonical Evidence Hashing
To prevent single-bit alterations across varying JSON serializers, evidence metadata is normalized into canonical lexicographical key-value pairs before SHA-256 computation:

$$\text{CanonicalString} = \text{EvidenceID} + "|" + \text{CaseID} + "|" + \text{OfficerID} + "|" + \text{Latitude} + "|" + \text{Longitude} + "|" + \text{Timestamp}_{\text{UTC}}$$

$$H_{\text{master}} = \text{SHA-256}\Big(\text{RawMediaBytes} + \text{CanonicalString}\Big)$$

### 2.2 Custody Block Chaining
Custody events form an append-only cryptographic linked chain:

```mermaid
flowchart LR
    Genesis["H0 = H_master\n(Initial Capture)"] --> Block1["H1 = SHA256(H0 + Event1)\n(Scene to Vault)"]
    Block1 --> Block2["H2 = SHA256(H1 + Event2)\n(Vault to Lab)"]
    Block2 --> Block3["H3 = SHA256(H2 + Event3)\n(Lab to Court)"]
```

---

## 3. Database Entity-Relationship Overview

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ DEVICES : binds
    USERS ||--o{ AUDIT_LOGS : performs
    CASES ||--o{ EVIDENCE : contains
    EVIDENCE ||--o{ CUSTODY_EVENTS : records
    EVIDENCE ||--o{ LAB_SAMPLES : divides
    EVIDENCE ||--o{ LAB_REPORTS : analyzes
    EVIDENCE ||--o{ TRANSIT_LOGS : tracks

    USERS {
        uuid id PK
        string email
        string full_name
        string badge_number
        string department
        boolean is_active
    }

    EVIDENCE {
        uuid id PK
        uuid case_id FK
        string evidence_number
        string master_hash
        string category
        jsonb location_metadata
        string status
        boolean captured_offline
    }

    CUSTODY_EVENTS {
        uuid id PK
        uuid evidence_id FK
        uuid sender_id FK
        uuid receiver_id FK
        string previous_hash
        string current_hash
        timestamp created_at
    }
```

---

© 2026 FORENZA Enterprise Forensics.
