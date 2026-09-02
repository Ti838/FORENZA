# FORENZA Web Database Architecture

## Overview
FORENZA relies on a robust PostgreSQL database hosted by Supabase. The database enforces strict Relational Row Level Security (RLS) to ensure multi-tenant and role-based data isolation.

## Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        string role
        string rank
        string badge_number
    }
    CASES {
        uuid id PK
        string case_number
        string status
        uuid lead_investigator_id FK
    }
    EVIDENCE {
        uuid id PK
        uuid case_id FK
        string type
        string status
        string location_status
        string current_custodian_id FK
        string hash_sha256
    }
    CUSTODY_CHAIN {
        uuid id PK
        uuid evidence_id FK
        uuid from_custodian_id FK
        uuid to_custodian_id FK
        timestamp transferred_at
        string reason
        string cryptographic_signature
    }
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        jsonb details
    }
    
    PROFILES ||--o{ CASES : leads
    CASES ||--o{ EVIDENCE : contains
    EVIDENCE ||--o{ CUSTODY_CHAIN : tracks
    PROFILES ||--o{ CUSTODY_CHAIN : transfers
```

## Security & Policies
- **Row Level Security (RLS):** Enabled on all tables.
- **Profiles:** Only accessible to authenticated users; users can only modify their own data unless they have `admin` privileges.
- **Evidence:** Immutable audit fields. Officers can only update evidence they have physical custody of or if they are assigned to the case.
- **Custody Chain:** Strictly append-only. No user (not even admins) can delete a custody chain record via the API.
