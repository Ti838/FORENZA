# FORENZA — Forensic Evidence Lifecycle & State Machine

> Comprehensive specification of forensic evidence state transitions, geofence verification, supervisory overrides, and laboratory custody tracking.

---

## 1. Evidence State Machine

FORENZA enforces an explicit, deterministic state machine at both the application API layer and via PostgreSQL database triggers (`validate_evidence_transition`). Any state jump outside the allowed directed graph is rejected with a `409 Conflict` database exception.

```mermaid
stateDiagram-v2
    [*] --> REGISTERED: Officer Registers Item in Case

    REGISTERED --> CAPTURED: Field Media Acquired & Geotagged
    
    CAPTURED --> SEALED: SHA-256 Master Seal Applied & QR Generated
    
    SEALED --> IN_TRANSIT: Transfer Initiated (Telemetry Active)
    SEALED --> TRANSFERRED: Direct Physical Handover
    
    IN_TRANSIT --> TRANSFERRED: Custody Handover Received
    
    TRANSFERRED --> VAULT_STORED: Vault Custodian Indexes Rack/Shelf/Bin
    TRANSFERRED --> LAB_RECEIVED: Forensic Lab Intake Logged
    
    VAULT_STORED --> IN_TRANSIT: Dispatched to Lab / Court
    VAULT_STORED --> LAB_RECEIVED: Transferred to Scientific Lab
    
    LAB_RECEIVED --> UNDER_ANALYSIS: Scientific Testing Initiated
    
    UNDER_ANALYSIS --> ANALYSIS_COMPLETED: Sample Consumed & Tests Concluded
    
    ANALYSIS_COMPLETED --> VAULT_STORED: Returned to Vault
    ANALYSIS_COMPLETED --> COURT_SUBMITTED: Submitted to Court Record
    
    VAULT_STORED --> COURT_SUBMITTED: Admitted to Judicial Trial
    
    COURT_SUBMITTED --> ARCHIVED: Case Concluded & Retention Locked
    
    ARCHIVED --> [*]
```

---

## 2. State Transition Matrix & Permissions

| Current State | Allowed Next States | Required RBAC Permission | Key Pre-Conditions |
|---|---|---|---|
| `REGISTERED` | `CAPTURED` | `evidence:capture` | Case is `ACTIVE`; Officer assigned. |
| `CAPTURED` | `SEALED` | `evidence:seal` | Primary media SHA-256 computed; GPS coordinates within perimeter or override approved. |
| `SEALED` | `IN_TRANSIT`, `TRANSFERRED` | `custody:transfer` | Single-use Handover JWT generated (15-min TTL). |
| `IN_TRANSIT` | `TRANSFERRED`, `VAULT_STORED` | `custody:receive` | Receiver scans and validates handover token; GPS telemetry stopped. |
| `TRANSFERRED` | `VAULT_STORED`, `LAB_RECEIVED` | `vault:receive` / `lab:receive` | Custodian confirms physical item receipt and condition. |
| `VAULT_STORED` | `IN_TRANSIT`, `LAB_RECEIVED`, `COURT_SUBMITTED` | `vault:dispatch` | Dispatch authorized by Case Lead or Supervisor. |
| `LAB_RECEIVED` | `UNDER_ANALYSIS` | `lab:analyze` | Sample registered with initial quantity balance. |
| `UNDER_ANALYSIS` | `ANALYSIS_COMPLETED` | `lab:report` | Certified laboratory PDF report uploaded and SHA-256 sealed. |
| `ANALYSIS_COMPLETED` | `VAULT_STORED`, `COURT_SUBMITTED` | `custody:transfer` | Remaining sample balance reconciled in audit log. |
| `COURT_SUBMITTED` | `ARCHIVED` | `evidence:archive` | Judicial verdict entered; retention period locked. |

---

## 3. Geofence Verification & Supervisor Override Flow

When evidence is captured in the field, its coordinates are compared against the authorized crime scene origin using the **Haversine formula**.

```mermaid
flowchart TD
    Start["📸 Officer Captures Evidence Media (Mobile / Web)"] --> ReadGPS["📍 Read Device GPS (Lat, Lon, Accuracy)"]
    ReadGPS --> CalcDistance["📏 Compute Haversine Distance (d) to Scene Center"]
    
    CalcDistance --> CheckPerimeter{"Is d ≤ 500m (Allowed Radius)?"}
    
    CheckPerimeter -->|YES: Perimeter Verified| AllowSeal["✅ Status: PERIMETER_VERIFIED<br/>Allow Immediate Evidence Sealing"]
    
    CheckPerimeter -->|NO: Outside Perimeter| FlagException["⚠️ Status: OUTSIDE_PERIMETER<br/>Direct Sealing Blocked"]
    
    FlagException --> OfficerPrompt["📝 Officer Enters Exigency Reason<br/>(e.g. Fleeing suspect discarded weapon)"]
    OfficerPrompt --> SubmitOverride["📤 Submit Override Request to Supervisor"]
    
    SubmitOverride --> SupReview["👀 Supervisor Command Center Review"]
    
    SupReview --> Decision{"Supervisor Decision"}
    
    Decision -->|APPROVED| OverrideApproved["🟢 Override Approved in DB<br/>Audit Log Created (SUPERVISOR_OVERRIDE)<br/>Allow Officer to Apply SHA-256 Seal"]
    Decision -->|REJECTED| OverrideRejected["🔴 Override Rejected<br/>Evidence Blocked from Forensic Sealing"]
    
    AllowSeal --> SealDone["🔐 Apply SHA-256 Master Hash & Generate QR Badge"]
    OverrideApproved --> SealDone
```

---

## 4. Custody Handover & Chain Extension Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 👮 Detective Marcus (Sender)
    actor Vault as 🏛️ Sgt. Rodriguez (Receiver)
    participant Client as 📱 Mobile Terminal
    participant API as ⚡ FORENZA API
    participant DB as 🗄️ PostgreSQL DB
    participant Auditor as 📋 Append-Only Audit Ledger

    Officer->>Client: Select Item (EVD-2024-0089)
    Officer->>Client: Tap "Generate Handover QR Token"
    Client->>API: POST /api/evidence/EVD-0089/transfer {notes}
    API->>API: Generate Handover JWT (15-min TTL, signed HS256)
    API->>DB: Insert handover_tokens (hash, expires_at)
    API->>Auditor: Write TRANSFER_TOKEN_GENERATED
    API-->>Client: Return signed Handover Token
    Client->>Officer: Display Handover QR Code

    Vault->>Client: Scan Officer's Handover QR Code
    Client->>API: POST /api/evidence/EVD-0089/receive {token, receiver_id}
    
    API->>API: Verify JWT Signature & Expiration (15-min TTL)
    API->>DB: Query handover_tokens (token_hash, used = FALSE)
    
    alt Token Expired or Already Used
        API-->>Client: 401 Unauthorized (Invalid / Expired Handover Token)
    else Token Valid
        API->>DB: Fetch latest custody_log (previous_hash)
        API->>API: Compute extendCustodyChain(previous_hash, event_data)
        API->>DB: Insert custody_logs (previous_hash, current_hash, sender, receiver)
        API->>DB: Update evidence (current_holder_id = Vault.id, status = 'TRANSFERRED')
        API->>DB: Mark handover_token as used = TRUE
        API->>Auditor: Write CUSTODY_TRANSFERRED
        API-->>Client: 200 OK (Handover Complete, Chain Extended)
        Client->>Vault: Prompt to Index Vault / Rack / Shelf / Bin
    end
```
