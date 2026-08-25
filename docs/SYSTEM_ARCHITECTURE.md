# FORENZA — System Architecture & Technical Specification

> **Trusted Evidence. True Justice.**  
> Enterprise Forensic Evidence Chain of Custody & Tamper-Evident Audit Platform

---

## 1. Executive Summary

**FORENZA** is a forensic security platform engineered to manage the complete lifecycle of physical and digital forensic evidence from crime-scene acquisition under verified GPS geofences to courtroom judicial review under Federal Rules of Evidence Rule 902(14).

The system enforces:
- Strict evidence identity and metadata immutability.
- GPS perimeter verification with Haversine geofence calculation.
- Edge AI-assisted object identification with human-in-the-loop overrides.
- Blockchain-style SHA-256 custody hash chaining.
- Encrypted single-use QR handover tokens.
- Real-time transit telemetry tracking with security decoy responses.
- Laboratory scientific sample depletion control.
- Automated judicial court dossier generation with cryptographic verification.

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications Layer"]
        Mobile["📱 Flutter Field Mobile App<br/>(Investigating Officer / Vault Custodian)"]
        WebPortal["💻 Next.js 15 Web Workstations<br/>(Supervisor / Judge / Lab / Auditor / Admin)"]
    end

    subgraph EdgeSecurity["Edge Security & Gateway"]
        AuthMiddleware["🛡️ Next.js Route Middleware<br/>(Session & Device Binding Validation)"]
        RateLimiter["⏱️ In-Memory Rate Limiting<br/>(5 Attempts / 5 Min Window)"]
    end

    subgraph CoreServices["Application Services Layer"]
        APIRoutes["⚡ Next.js App Router API Handlers<br/>(/api/cases, /api/evidence, /api/auth)"]
        CryptoEngine["🔐 Web Crypto SHA-256 Engine<br/>(Canonical Evidence Hashing & Chain Extension)"]
        GeofenceEngine["📍 Haversine Geofence Engine<br/>(Perimeter Verification & Override Routing)"]
        TokenService["🔑 JOSE JWT Token Service<br/>(Signed QR & Handover Tokens)"]
        DossierGen["📄 jsPDF Certified Dossier Generator<br/>(Rule 902 Certified Judicial PDF)"]
    end

    subgraph AIService["AI Inference Microservice (FastAPI)"]
        FastAPI["🚀 FastAPI Microservice (Port 8000)"]
        ONNXModel["🧠 ONNX Runtime (EfficientNet-B0)<br/>Forensic Category Classifier"]
    end

    subgraph DataStorage["Data & Storage Infrastructure (Supabase)"]
        PostgresDB[("🗄️ PostgreSQL 15+ Database<br/>(15 Migration Schemas + RLS Policies)")]
        AppendTriggers["⚡ Append-Only Database Triggers<br/>(Tamper-Proof Audit & Custody Logs)"]
        StateMachineTrigger["⚙️ State Machine Transition Validator<br/>(DB Enforced Lifecycle)"]
        ObjectStorage["📦 Encrypted Storage Buckets<br/>(evidence-media, lab-reports, dossiers)"]
    end

    Mobile -->|HTTPS / REST| AuthMiddleware
    WebPortal -->|HTTPS / REST| AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> APIRoutes

    APIRoutes --> CryptoEngine
    APIRoutes --> GeofenceEngine
    APIRoutes --> TokenService
    APIRoutes --> DossierGen

    APIRoutes -->|POST /classify| FastAPI
    FastAPI --> ONNXModel

    APIRoutes -->|Authenticated / RLS Client| PostgresDB
    APIRoutes -->|Signed URLs / Uploads| ObjectStorage
    PostgresDB --> AppendTriggers
    PostgresDB --> StateMachineTrigger
```

---

## 3. Component Breakdown

### 3.1. Web Application (`/web`)
- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5.
- **Styling**: Tailwind CSS v4, custom CSS variable design tokens (`globals.css`), Lucide icons.
- **Design System**: Dual-mode (Obsidian Dark `#0B0F19` and Crisp Light `#F8FAFC`), theme persistence.
- **Role Portals**: Dedicated workstations for 7 distinct roles:
  1. *Investigating Officer* (`/officer/*`)
  2. *Supervisor Command* (`/supervisor/*`)
  3. *Central Evidence Vault* (`/vault/*`)
  4. *Forensic Laboratory* (`/lab/*`)
  5. *Judicial Chamber & Trial* (`/judge/*`)
  6. *Master Forensic Auditor* (`/auditor/*`)
  7. *System Administration* (`/admin/*`)

### 3.2. Mobile Application (`/mobile`)
- **Framework**: Flutter / Dart (Riverpod 2.5, GoRouter 14).
- **Hardware Integration**: Camera viewfinder HUD, Geolocator GPS, MobileScanner QR reader, QrFlutter generator.
- **Field UX**: Large touch targets, one-handed operation, dark mode field optimization, offline resilience.

### 3.3. AI Microservice (`/ai-service`)
- **Framework**: FastAPI (Python 3.11), Pydantic v2, ONNX Runtime.
- **Model**: Pre-trained EfficientNet-B0 fine-tuned for forensic categories (Weapons, Biological, Documents, Electronics, Substances, Trace).
- **Resilience**: Automatic fallback to graceful stub inference if ONNX weights are unmounted.

### 3.4. Supabase Database & Security Layer
- **PostgreSQL 15**: 15 migration scripts covering 14 tables with composite, GIN, and partial indexes.
- **Row-Level Security (RLS)**: Fine-grained declarative policies enforcing least-privilege data access per role.
- **Trigger-Level Security**:
  - `prevent_audit_modification`: Blocks `UPDATE` and `DELETE` on audit and custody logs.
  - `protect_master_hash`: Rejects alterations to sealed evidence hashes.
  - `validate_sample_consumption`: Prevents laboratory sample over-consumption.
  - `enforce_evidence_state_machine`: Rejects illegal state jumps.

---

## 4. Authentication & Hardware Device Binding Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 👮 Officer (Mobile / Web)
    participant Client as 📱 FORENZA Client
    participant AuthAPI as 🛡️ Auth API (/api/auth/login)
    participant SupabaseAuth as 🔐 Supabase Auth
    participant DB as 🗄️ PostgreSQL DB
    participant Auditor as 📋 Audit Ledger

    Officer->>Client: Enter Email & Password
    Client->>Client: Retrieve/Generate Hardware Device Token (UUID)
    Client->>AuthAPI: POST /api/auth/login {email, pass, device_id, platform}
    
    AuthAPI->>AuthAPI: Check Rate Limiter (Max 5 attempts / 5 min)
    AuthAPI->>SupabaseAuth: signInWithPassword(email, password)
    
    alt Invalid Credentials
        SupabaseAuth-->>AuthAPI: Auth Error
        AuthAPI->>Auditor: Write LOGIN_FAILED audit log
        AuthAPI-->>Client: 401 Unauthorized
    else Valid Credentials
        SupabaseAuth-->>AuthAPI: User Session Data
        AuthAPI->>DB: Query approved_devices (user_id, device_identifier)
        
        alt Device Not Registered
            DB-->>AuthAPI: Not Found
            AuthAPI->>DB: Insert approved_devices (status: PENDING)
            AuthAPI->>Auditor: Write LOGIN_FAILED_DEVICE_PENDING
            AuthAPI-->>Client: 403 Forbidden (Device Pending Admin Approval)
        else Device Revoked
            DB-->>AuthAPI: Status: REVOKED
            AuthAPI->>Auditor: Write LOGIN_FAILED_DEVICE_REVOKED
            AuthAPI-->>Client: 403 Forbidden (Device Revoked)
        else Device Approved
            DB-->>AuthAPI: Status: APPROVED
            AuthAPI->>DB: Fetch user_roles (user_id)
            AuthAPI->>DB: Update profiles (last_login_at = NOW())
            AuthAPI->>Auditor: Write LOGIN_SUCCESS
            AuthAPI-->>Client: 200 OK {user, roles, session, mfa_required}
            
            opt MFA Required
                Client->>Officer: Prompt for 6-digit TOTP
                Officer->>Client: Enter TOTP code
                Client->>AuthAPI: POST /api/auth/mfa {code, session_id}
                AuthAPI-->>Client: 200 OK (MFA Verified)
            end
            
            Client->>Officer: Route to Role-Based Workstation
        end
    end
```
