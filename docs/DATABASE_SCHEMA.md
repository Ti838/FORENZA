# FORENZA — Database Schema & Entity Relationship Model

> PostgreSQL 15+ relational schema, composite performance indexes, append-only triggers, and Row-Level Security (RLS) policies.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : has
    PROFILES ||--o{ APPROVED_DEVICES : registers
    PROFILES ||--o{ CASES : leads
    PROFILES ||--o{ EVIDENCE : holds
    PROFILES ||--o{ CUSTODY_LOGS : transfers
    PROFILES ||--o{ AUDIT_LOGS : generates

    CASES ||--|{ EVIDENCE : contains
    CASES ||--o{ CASE_OFFICERS : assigns
    CASES ||--o{ SUPERVISOR_OVERRIDES : logs

    EVIDENCE ||--|{ EVIDENCE_MEDIA : stores
    EVIDENCE ||--o| EVIDENCE_CLASSIFICATIONS : classifies
    EVIDENCE ||--|{ CUSTODY_LOGS : tracks
    EVIDENCE ||--|{ EVIDENCE_EVENTS : logs
    EVIDENCE ||--o{ TRANSIT_TELEMETRY : streams
    EVIDENCE ||--o| VAULT_LOCATIONS : stores_in
    EVIDENCE ||--o{ LAB_SAMPLES : divides_into
    EVIDENCE ||--o{ LAB_REPORTS : documents
    EVIDENCE ||--o{ QR_TOKENS : identifies
    EVIDENCE ||--o{ HANDOVER_TOKENS : transfers_via

    LAB_SAMPLES ||--o{ SAMPLE_CONSUMPTION : consumes

    PROFILES {
        uuid id PK
        string email
        string full_name
        string badge_number
        string department
        boolean is_active
        timestamp created_at
    }

    APPROVED_DEVICES {
        uuid id PK
        uuid user_id FK
        string device_identifier
        string device_name
        string platform
        string status
        timestamp approved_at
    }

    CASES {
        uuid id PK
        string case_number UK
        string title
        string crime_type
        double crime_scene_latitude
        double crime_scene_longitude
        int geofence_radius_meters
        string status
        uuid lead_officer_id FK
        timestamp incident_datetime
    }

    EVIDENCE {
        uuid id PK
        uuid case_id FK
        string evidence_number UK
        string status
        string master_hash
        timestamp sealed_at
        double capture_latitude
        double capture_longitude
        double capture_gps_accuracy
        uuid current_holder_id FK
    }

    EVIDENCE_MEDIA {
        uuid id PK
        uuid evidence_id FK
        string storage_path
        string file_sha256
        string media_type
        string mime_type
        bigint file_size_bytes
    }

    EVIDENCE_CLASSIFICATIONS {
        uuid id PK
        uuid evidence_id FK
        string ai_category
        string ai_object
        double ai_confidence
        string final_category
        string final_object
        string classification_method
        uuid classified_by FK
    }

    CUSTODY_LOGS {
        uuid id PK
        uuid evidence_id FK
        string action
        uuid sender_id FK
        uuid receiver_id FK
        string previous_hash
        string current_hash
        double latitude
        double longitude
        timestamp created_at
    }

    VAULT_LOCATIONS {
        uuid id PK
        uuid evidence_id FK
        string vault_id
        string rack
        string shelf
        string bin
        string location_label
        uuid custodian_id FK
        timestamp stored_at
    }

    LAB_SAMPLES {
        uuid id PK
        uuid evidence_id FK
        string sample_code UK
        double initial_quantity
        double consumed_quantity
        string unit
        string status
    }

    SAMPLE_CONSUMPTION {
        uuid id PK
        uuid sample_id FK
        double quantity_consumed
        string purpose
        uuid analyst_id FK
        timestamp consumed_at
    }

    LAB_REPORTS {
        uuid id PK
        uuid evidence_id FK
        int version
        string title
        string findings_summary
        string storage_path
        string file_sha256
        uuid analyst_id FK
        timestamp sealed_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string category
        string action
        uuid evidence_id FK
        uuid case_id FK
        boolean success
        string ip_address
        timestamp created_at
    }
```

---

## 2. Table Catalog & Foreign Keys

| Table Name | Description | Key Indexes | Immutability Trigger |
|---|---|---|---|
| `profiles` | User accounts and officer credentials | `id`, `email`, `badge_number` | None |
| `approved_devices` | Hardware device token registry | `(user_id, device_identifier)` | None |
| `cases` | Criminal investigation cases | `case_number`, `status`, `lead_officer_id` | None |
| `evidence` | Primary forensic evidence records | `evidence_number`, `case_id`, `status`, `master_hash` | `protect_master_hash` |
| `evidence_media` | Image, video, and audio file hashes | `evidence_id`, `file_sha256` | `prevent_media_tampering` |
| `evidence_classifications` | AI inference vs human confirmation | `evidence_id`, `classified_by` | Immutable after insert |
| `custody_logs` | Append-only custody hash chain | `evidence_id`, `current_hash`, `created_at` | `prevent_audit_modification` |
| `evidence_events` | Granular audit event timeline | `evidence_id`, `event_type`, `created_at` | `prevent_audit_modification` |
| `transit_telemetry` | GPS transit route breadcrumbs | `evidence_id`, `recorded_at` | Append-only |
| `vault_locations` | Physical storage indexing (Vault/Rack/Shelf/Bin) | `evidence_id`, `vault_id` | None |
| `lab_samples` | Divided physical sample quantities | `evidence_id`, `sample_code` | `validate_sample_consumption` |
| `sample_consumption` | Sample depletion logging | `sample_id`, `consumed_at` | Append-only |
| `lab_reports` | Certified scientific PDF findings | `evidence_id`, `file_sha256` | Immutable after sealing |
| `audit_logs` | System-wide security audit ledger | `actor_id`, `category`, `created_at` | `prevent_audit_modification` |
| `supervisor_overrides` | Geofence exception approvals/rejections | `evidence_id`, `supervisor_id` | Immutable decision log |
