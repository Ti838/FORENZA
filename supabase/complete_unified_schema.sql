-- =============================================================
-- FORENZA — COMPLETE HARDENED MASTER DATABASE SCHEMA (ZERO-TRUST)
-- Version: 2.1.0 (Zero Vulnerability Enterprise Edition)
-- Standards: ISO/IEC 27037, ISO/IEC 27038, NIST SP 800-86, FRE Rule 902(14)
-- =============================================================

-- Enable required core cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. ENUMERATION TYPES (Idempotent creation)
-- =============================================================

DO $$ BEGIN
    CREATE TYPE evidence_status AS ENUM (
        'REGISTERED', 'CAPTURED', 'SEALED', 'IN_TRANSIT',
        'VAULT_STORED', 'TRANSFERRED', 'LAB_RECEIVED',
        'UNDER_ANALYSIS', 'ANALYSIS_COMPLETED', 'COURT_SUBMITTED', 'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE classification_method AS ENUM ('AI_CONFIRMED', 'MANUAL', 'MANUAL_OVERRIDE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE custody_action AS ENUM (
        'CAPTURED', 'SEALED', 'TRANSFERRED', 'RECEIVED',
        'VAULT_STORED', 'LAB_RECEIVED', 'COURT_SUBMITTED', 'OVERRIDE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE device_status AS ENUM ('PENDING', 'APPROVED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE app_role AS ENUM (
        'ADMIN', 'INVESTIGATING_OFFICER', 'SUPERVISOR',
        'VAULT_CUSTODIAN', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE override_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_JUDICIAL_REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_event_type AS ENUM (
        'REGISTERED', 'CAPTURED', 'CLASSIFIED_AI', 'CLASSIFIED_MANUAL',
        'SEALED', 'QR_GENERATED', 'TRANSFER_INITIATED', 'TRANSFER_COMPLETED',
        'TRANSIT_STARTED', 'TRANSIT_STOPPED', 'VAULT_RECEIVED', 'VAULT_STORED',
        'LAB_RECEIVED', 'SAMPLE_REGISTERED', 'SAMPLE_CONSUMED', 'ANALYSIS_STARTED',
        'ANALYSIS_COMPLETED', 'REPORT_UPLOADED', 'COURT_SUBMITTED', 'INTEGRITY_VERIFIED',
        'INTEGRITY_FAILED', 'ARCHIVED', 'SUPERVISOR_OVERRIDE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_category AS ENUM (
        'AUTHENTICATION', 'AUTHORIZATION', 'CASE_MANAGEMENT', 'EVIDENCE_MANAGEMENT',
        'CUSTODY_TRANSFER', 'TRANSIT_TELEMETRY', 'VAULT_OPERATIONS', 'LAB_OPERATIONS',
        'INTEGRITY_CHECK', 'QR_OPERATIONS', 'ADMIN_ACTIONS', 'SECURITY_EVENT',
        'DEVICE_MANAGEMENT', 'REPORT_OPERATIONS', 'JUDICIAL_ACCESS'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE legal_authority_type AS ENUM (
        'WARRANT', 'COURT_ORDER', 'CONSENT', 'STATUTORY_AUTHORITY', 'EMERGENCY_AUTHORITY', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE retention_status AS ENUM (
        'ACTIVE', 'LEGAL_HOLD', 'ARCHIVED', 'ELIGIBLE_FOR_DISPOSITION', 'DISPOSED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE data_classification_tier AS ENUM (
        'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'HIGHLY_SENSITIVE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE device_trust_status AS ENUM ('PENDING', 'TRUSTED', 'SUSPENDED', 'REVOKED', 'COMPROMISED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE physical_condition_status AS ENUM ('INTACT', 'DAMAGED', 'OPENED', 'BROKEN_SEAL', 'CONTAMINATED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE reconciliation_status AS ENUM ('CONSISTENT', 'MINOR_CONFLICT', 'SIGNIFICANT_CONFLICT', 'CRITICAL_CONFLICT', 'UNRESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE conflict_type AS ENUM (
        'HASH_CONFLICT', 'TIMESTAMP_CONFLICT', 'LOCATION_CONFLICT', 'ACTOR_CONFLICT',
        'DEVICE_CONFLICT', 'CUSTODY_CONFLICT', 'METADATA_CONFLICT', 'PARENT_STATE_CONFLICT',
        'SIGNATURE_CONFLICT', 'POLICY_CONFLICT', 'DUPLICATE_EVENT', 'REPLAY_EVENT', 'ROLLBACK_ATTEMPT'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE conflict_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE adjudication_decision AS ENUM (
        'ACCEPT_BRANCH_A', 'ACCEPT_BRANCH_B', 'ACCEPT_BOTH',
        'REJECT_BRANCH_A', 'REJECT_BRANCH_B', 'UNRESOLVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_claim_status AS ENUM ('SUPPORTED', 'UNSUPPORTED', 'REQUIRES_REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_verdict AS ENUM ('PASS', 'FAIL', 'UNVERIFIABLE', 'PARTIALLY_VERIFIABLE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 2. SECURITY HELPER FUNCTIONS (RBAC + ABAC)
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL UNIQUE,
    full_name       TEXT        NOT NULL,
    badge_number    TEXT        UNIQUE,
    department      TEXT,
    phone           TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    mfa_enabled     BOOLEAN     NOT NULL DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    created_by      UUID        REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id          SERIAL      PRIMARY KEY,
    name        app_role    NOT NULL UNIQUE,
    description TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.roles (name, description) VALUES
    ('ADMIN',                 'System administrator with user management access'),
    ('INVESTIGATING_OFFICER', 'Field officer responsible for evidence capture'),
    ('SUPERVISOR',            'Supervisor with override and case management authority'),
    ('VAULT_CUSTODIAN',       'Evidence vault manager responsible for secure storage'),
    ('LAB_ANALYST',           'Forensic laboratory analyst'),
    ('JUDGE',                 'Judicial officer with read-only case access'),
    ('AUDITOR',               'Compliance auditor with read-only audit access')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role        app_role    NOT NULL,
    assigned_by UUID        REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS app_role[] AS $$
    SELECT COALESCE(ARRAY_AGG(role), ARRAY[]::app_role[])
    FROM public.user_roles
    WHERE user_roles.user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = check_role
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_any_role(roles app_role[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = ANY(roles)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================
-- 3. DEVICE REGISTRATION & TRUST (FZ-ID)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.approved_devices (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_identifier   TEXT        NOT NULL,
    device_name         TEXT        NOT NULL,
    platform            TEXT        NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'windows', 'macos', 'linux')),
    status              device_status NOT NULL DEFAULT 'PENDING',
    approved_at         TIMESTAMPTZ,
    approved_by         UUID        REFERENCES public.profiles(id),
    revoked_at          TIMESTAMPTZ,
    revoked_by          UUID        REFERENCES public.profiles(id),
    revocation_reason   TEXT,
    last_seen_at        TIMESTAMPTZ,
    device_metadata     JSONB       NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, device_identifier)
);

CREATE TABLE IF NOT EXISTS public.device_keys (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           TEXT        NOT NULL,
    user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_public_key   TEXT        NOT NULL,
    algorithm           TEXT        NOT NULL DEFAULT 'Ed25519',
    key_version         INTEGER     NOT NULL DEFAULT 1,
    platform            TEXT        NOT NULL CHECK (platform IN ('android', 'ios', 'windows', 'macos', 'linux', 'web')),
    device_type         TEXT        NOT NULL DEFAULT 'WORKSTATION',
    device_model        TEXT,
    attestation_status  TEXT        NOT NULL DEFAULT 'UNATTESTED',
    attestation_payload JSONB       DEFAULT '{}'::jsonb,
    status              device_trust_status NOT NULL DEFAULT 'PENDING',
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (device_id, key_version)
);

CREATE TABLE IF NOT EXISTS public.device_sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_key_id       UUID        NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token_hash  TEXT        NOT NULL UNIQUE,
    ip_address          TEXT,
    user_agent          TEXT,
    authenticated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    is_revoked          BOOLEAN     NOT NULL DEFAULT false,
    revoked_at          TIMESTAMPTZ,
    revocation_reason   TEXT
);

CREATE TABLE IF NOT EXISTS public.device_events (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_key_id       UUID        NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
    event_type          TEXT        NOT NULL,
    actor_id            UUID        REFERENCES public.profiles(id),
    event_payload       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 4. CASES & ASSIGNMENTS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.cases (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number             TEXT        NOT NULL UNIQUE,
    title                   TEXT        NOT NULL,
    description             TEXT,
    status                  case_status NOT NULL DEFAULT 'ACTIVE',
    crime_scene_location    TEXT        NOT NULL,
    crime_scene_latitude    DECIMAL(10, 8) NOT NULL,
    crime_scene_longitude   DECIMAL(11, 8) NOT NULL,
    geofence_radius_meters  DECIMAL(8, 2) NOT NULL DEFAULT 500.00,
    opened_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at               TIMESTAMPTZ,
    created_by              UUID        NOT NULL REFERENCES public.profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_officers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    officer_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID        NOT NULL REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (case_id, officer_id)
);

-- =============================================================
-- 5. EVIDENCE & MEDIA
-- =============================================================

CREATE TABLE IF NOT EXISTS public.evidence (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                 UUID            NOT NULL REFERENCES public.cases(id) ON DELETE RESTRICT,
    evidence_number         TEXT            NOT NULL,
    status                  evidence_status NOT NULL DEFAULT 'REGISTERED',
    current_holder_id       UUID            REFERENCES public.profiles(id),
    captured_by             UUID            REFERENCES public.profiles(id),
    captured_at             TIMESTAMPTZ,
    capture_latitude        DECIMAL(10, 8),
    capture_longitude       DECIMAL(11, 8),
    capture_gps_accuracy    DECIMAL(8, 3),
    capture_compass_heading DECIMAL(6, 3),
    capture_distance_meters DECIMAL(10, 2),
    geofence_verified       BOOLEAN,
    geofence_override_id    UUID,
    master_hash             TEXT,
    hash_algorithm          TEXT            NOT NULL DEFAULT 'SHA-256',
    registered_by           UUID            NOT NULL REFERENCES public.profiles(id),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    UNIQUE (case_id, evidence_number)
);

CREATE TABLE IF NOT EXISTS public.evidence_media (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    media_type          media_type  NOT NULL,
    mime_type           TEXT        NOT NULL,
    storage_path        TEXT        NOT NULL UNIQUE,
    file_size_bytes     BIGINT      NOT NULL CHECK (file_size_bytes > 0),
    file_sha256         TEXT        NOT NULL,
    original_filename   TEXT,
    width_px            INTEGER,
    height_px           INTEGER,
    duration_seconds    DECIMAL(10, 3),
    captured_by         UUID        NOT NULL REFERENCES public.profiles(id),
    captured_at         TIMESTAMPTZ NOT NULL,
    is_primary          BOOLEAN     NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 6. CLASSIFICATIONS & SUPERVISOR OVERRIDES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.evidence_classifications (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID                    NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    method              classification_method   NOT NULL,
    category            TEXT                    NOT NULL,
    subcategory         TEXT,
    object_detected     TEXT,
    ai_confidence       DECIMAL(5, 4),
    ai_model_version    TEXT,
    ai_inference_id     TEXT,
    ai_raw_response     JSONB,
    classified_by       UUID                    NOT NULL REFERENCES public.profiles(id),
    classified_at       TIMESTAMPTZ             NOT NULL DEFAULT now(),
    is_active           BOOLEAN                 NOT NULL DEFAULT true,
    notes               TEXT,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supervisor_overrides (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID            NOT NULL REFERENCES public.cases(id) ON DELETE RESTRICT,
    evidence_id         UUID            REFERENCES public.evidence(id) ON DELETE RESTRICT,
    override_type       TEXT            NOT NULL,
    status              override_status NOT NULL DEFAULT 'PENDING',
    reason              TEXT            NOT NULL,
    requested_by        UUID            NOT NULL REFERENCES public.profiles(id),
    requested_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    reviewed_by         UUID            REFERENCES public.profiles(id),
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    location_override_data JSONB,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- =============================================================
-- 7. CUSTODY, TRANSIT & VAULT
-- =============================================================

CREATE TABLE IF NOT EXISTS public.custody_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID            NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    action              custody_action  NOT NULL,
    sender_id           UUID            REFERENCES public.profiles(id),
    receiver_id         UUID            REFERENCES public.profiles(id),
    previous_hash       TEXT,
    current_hash        TEXT            NOT NULL,
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    location_accuracy   DECIMAL(8, 3),
    notes               TEXT,
    canonical_data      JSONB           NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence_events (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID                NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    case_id         UUID                NOT NULL REFERENCES public.cases(id) ON DELETE RESTRICT,
    event_type      evidence_event_type NOT NULL,
    actor_id        UUID                NOT NULL REFERENCES public.profiles(id),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    from_status     evidence_status,
    to_status       evidence_status,
    metadata        JSONB               NOT NULL DEFAULT '{}',
    notes           TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.handover_tokens (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL REFERENCES public.profiles(id),
    token_hash      TEXT        NOT NULL UNIQUE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    used_by         UUID        REFERENCES public.profiles(id),
    is_revoked      BOOLEAN     NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.transit_telemetry (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    officer_id          UUID        NOT NULL REFERENCES public.profiles(id),
    device_id           UUID        NOT NULL REFERENCES public.approved_devices(id),
    latitude            DECIMAL(10, 8) NOT NULL,
    longitude           DECIMAL(11, 8) NOT NULL,
    gps_accuracy_meters DECIMAL(8, 2),
    altitude_meters     DECIMAL(8, 2),
    speed_mps           DECIMAL(6, 2),
    battery_level       DECIMAL(4, 2),
    is_decoy            BOOLEAN     NOT NULL DEFAULT false,
    recorded_at         TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vault_inventory (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL UNIQUE REFERENCES public.evidence(id) ON DELETE RESTRICT,
    custodian_id        UUID        NOT NULL REFERENCES public.profiles(id),
    facility_name       TEXT        NOT NULL DEFAULT 'Central Forensic Vault',
    room_number         TEXT        NOT NULL,
    aisle               TEXT,
    rack                TEXT        NOT NULL,
    shelf               TEXT        NOT NULL,
    bin                 TEXT        NOT NULL,
    sealed_condition    TEXT        NOT NULL DEFAULT 'SEALED_INTACT',
    seal_number         TEXT,
    stored_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    retrieved_at        TIMESTAMPTZ,
    retrieved_by        UUID        REFERENCES public.profiles(id),
    retrieval_reason    TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 8. FORENSIC LABORATORY & SAMPLE LINEAGE (FZ-LINEAGE)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.lab_samples (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID            NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    analyst_id          UUID            NOT NULL REFERENCES public.profiles(id),
    sample_code         TEXT            NOT NULL,
    sample_description  TEXT            NOT NULL,
    original_quantity   DECIMAL(10, 4)  NOT NULL CHECK (original_quantity > 0),
    consumed_quantity   DECIMAL(10, 4)  NOT NULL DEFAULT 0.0000,
    unit_of_measure     TEXT            NOT NULL,
    received_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    UNIQUE (evidence_id, sample_code)
);

CREATE TABLE IF NOT EXISTS public.lab_reports (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    analyst_id          UUID        NOT NULL REFERENCES public.profiles(id),
    report_number       TEXT        NOT NULL UNIQUE,
    findings_summary    TEXT        NOT NULL,
    full_findings       TEXT        NOT NULL,
    methodology         TEXT        NOT NULL,
    storage_path        TEXT        NOT NULL,
    file_sha256         TEXT        NOT NULL,
    analysis_started_at TIMESTAMPTZ NOT NULL,
    analysis_completed_at TIMESTAMPTZ NOT NULL,
    is_sealed           BOOLEAN     NOT NULL DEFAULT true,
    sealed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sample_lineage (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID            NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    parent_sample_id    UUID            REFERENCES public.sample_lineage(id),
    sample_code         TEXT            NOT NULL UNIQUE,
    unit_of_measure     TEXT            NOT NULL DEFAULT 'mg',
    original_quantity   DECIMAL(12, 4)  NOT NULL CHECK (original_quantity > 0),
    allocated_quantity  DECIMAL(12, 4)  NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
    consumed_quantity   DECIMAL(12, 4)  NOT NULL DEFAULT 0 CHECK (consumed_quantity >= 0),
    remaining_quantity  DECIMAL(12, 4)  GENERATED ALWAYS AS (original_quantity - consumed_quantity) STORED,
    preparation_method  TEXT,
    custodian_id        UUID            NOT NULL REFERENCES public.profiles(id),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- =============================================================
-- 9. AUDIT LEDGER, QR TOKENS & LEGAL HOLDS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    category            audit_category  NOT NULL,
    action              TEXT            NOT NULL,
    actor_id            UUID            REFERENCES public.profiles(id),
    ip_address          INET,
    user_agent          TEXT,
    device_id           UUID            REFERENCES public.approved_devices(id),
    case_id             UUID            REFERENCES public.cases(id) ON DELETE SET NULL,
    evidence_id         UUID            REFERENCES public.evidence(id) ON DELETE SET NULL,
    target_resource     TEXT,
    details             JSONB           NOT NULL DEFAULT '{}',
    is_anomaly          BOOLEAN         NOT NULL DEFAULT false,
    previous_log_hash   TEXT,
    log_hash            TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qr_tokens (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    token_hash          TEXT        NOT NULL UNIQUE,
    issued_by           UUID        NOT NULL REFERENCES public.profiles(id),
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    is_revoked          BOOLEAN     NOT NULL DEFAULT false,
    scan_count          INTEGER     NOT NULL DEFAULT 0,
    last_scanned_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_authorizations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                 UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    authority_type          legal_authority_type NOT NULL,
    warrant_reference       TEXT,
    court_order_reference   TEXT,
    authorized_by           TEXT NOT NULL,
    jurisdiction            TEXT NOT NULL DEFAULT 'DEFAULT_JURISDICTION',
    scope                   TEXT NOT NULL,
    authorization_timestamp TIMESTAMPTZ NOT NULL,
    created_by              UUID NOT NULL REFERENCES public.profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_holds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    hold_reference  TEXT NOT NULL,
    issued_by       UUID NOT NULL REFERENCES public.profiles(id),
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    scope           TEXT NOT NULL,
    reason          TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    released_at     TIMESTAMPTZ,
    released_by     UUID REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.derived_artifacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_evidence_id  UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    derivation_method   TEXT NOT NULL,
    tool_name           TEXT NOT NULL,
    tool_version        TEXT NOT NULL,
    operator_id         UUID NOT NULL REFERENCES public.profiles(id),
    input_hash          TEXT NOT NULL,
    output_hash         TEXT NOT NULL,
    storage_path        TEXT NOT NULL,
    redaction_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  TEXT NOT NULL,
    severity    TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    actor_id    UUID REFERENCES public.profiles(id),
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
    ip_address  TEXT,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 10. NEXT-GEN IMMUTABLE STATE ENGINE (FZ-TWIN)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.evidence_states (
    state_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id                 UUID NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
    parent_state_id             UUID REFERENCES public.evidence_states(state_id),
    event_type                  TEXT NOT NULL,
    actor_id                    UUID NOT NULL REFERENCES public.profiles(id),
    device_id                   TEXT NOT NULL,
    timestamp_utc               TIMESTAMPTZ NOT NULL,
    latitude                    DECIMAL(10, 8),
    longitude                   DECIMAL(11, 8),
    location_metadata           JSONB DEFAULT '{}'::jsonb,
    event_data                  JSONB NOT NULL,
    previous_state_hash         TEXT,
    event_hash                  TEXT NOT NULL,
    state_hash                  TEXT NOT NULL,
    signature                   TEXT NOT NULL,
    signature_algorithm         TEXT NOT NULL DEFAULT 'Ed25519',
    key_id                      TEXT NOT NULL,
    canonicalization_version    TEXT NOT NULL DEFAULT 'RFC8785_v1',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branches (
    branch_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    branch_name             TEXT NOT NULL,
    divergence_state_id     UUID NOT NULL REFERENCES public.evidence_states(state_id),
    head_state_id           UUID NOT NULL REFERENCES public.evidence_states(state_id),
    source_device_id        TEXT,
    source_actor_id         UUID REFERENCES public.profiles(id),
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (evidence_id, branch_name)
);

CREATE TABLE IF NOT EXISTS public.divergences (
    divergence_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    first_divergent_state_a UUID NOT NULL REFERENCES public.evidence_states(state_id),
    first_divergent_state_b UUID NOT NULL REFERENCES public.evidence_states(state_id),
    divergence_type         conflict_type NOT NULL,
    changed_fields          JSONB NOT NULL DEFAULT '[]'::jsonb,
    detected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    detection_context       JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.conflicts (
    conflict_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    type                    conflict_type NOT NULL,
    severity                conflict_severity NOT NULL,
    detected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_states           JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation             TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'ADJUDICATED', 'DISMISSED')),
    resolution              TEXT,
    resolved_at             TIMESTAMPTZ,
    resolved_by             UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.adjudications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    conflict_id             UUID REFERENCES public.conflicts(conflict_id),
    reviewer_id             UUID NOT NULL REFERENCES public.profiles(id),
    reviewer_device_id      TEXT NOT NULL,
    decision                adjudication_decision NOT NULL,
    reason                  TEXT NOT NULL,
    supporting_state_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
    signature               TEXT NOT NULL,
    signature_algorithm     TEXT NOT NULL DEFAULT 'Ed25519',
    version                 INTEGER NOT NULL DEFAULT 1,
    previous_adjudication_id UUID REFERENCES public.adjudications(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 11. PROVENANCE GRAPH (FZ-PROV)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.provenance_nodes (
    node_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    node_type       TEXT NOT NULL,
    title           TEXT NOT NULL,
    artifact_hash   TEXT NOT NULL,
    state_id        UUID REFERENCES public.evidence_states(state_id),
    creator_id      UUID NOT NULL REFERENCES public.profiles(id),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provenance_edges (
    edge_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id      UUID NOT NULL REFERENCES public.provenance_nodes(node_id) ON DELETE CASCADE,
    target_node_id      UUID NOT NULL REFERENCES public.provenance_nodes(node_id) ON DELETE CASCADE,
    relationship_type   TEXT NOT NULL,
    created_by          UUID NOT NULL REFERENCES public.profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 12. PHYSICAL CONTAINERS, SEALS & CONDITIONS (FZ-PHOTO)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.containers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_code      TEXT NOT NULL UNIQUE,
    container_type      TEXT NOT NULL,
    description         TEXT,
    current_location    TEXT NOT NULL,
    created_by          UUID NOT NULL REFERENCES public.profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seal_number     TEXT NOT NULL UNIQUE,
    container_id    UUID REFERENCES public.containers(id) ON DELETE SET NULL,
    evidence_id     UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
    seal_type       TEXT NOT NULL DEFAULT 'TAMPER_EVIDENT_TAPE',
    applied_by      UUID NOT NULL REFERENCES public.profiles(id),
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    broken_by       UUID REFERENCES public.profiles(id),
    broken_at       TIMESTAMPTZ,
    broken_reason   TEXT,
    status          TEXT NOT NULL DEFAULT 'INTACT' CHECK (status IN ('INTACT', 'BROKEN', 'REPLACED', 'VOIDED'))
);

CREATE TABLE IF NOT EXISTS public.evidence_conditions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    event_id            UUID,
    actor_id            UUID NOT NULL REFERENCES public.profiles(id),
    device_id           TEXT NOT NULL,
    condition           physical_condition_status NOT NULL,
    notes               TEXT,
    photo_storage_path  TEXT,
    photo_hash          TEXT,
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 13. AI PROVENANCE & CLAIM VALIDATION (FZ-AI)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.ai_runs (
    run_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                 UUID REFERENCES public.cases(id),
    evidence_id             UUID REFERENCES public.evidence(id),
    provider                TEXT NOT NULL DEFAULT 'google_gemini',
    model_name              TEXT NOT NULL,
    model_version           TEXT,
    input_hash              TEXT NOT NULL,
    prompt_hash             TEXT NOT NULL,
    output_hash             TEXT NOT NULL,
    execution_duration_ms   INTEGER,
    caller_id               UUID NOT NULL REFERENCES public.profiles(id),
    review_status           TEXT NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW' CHECK (review_status IN ('PENDING_HUMAN_REVIEW', 'CONFIRMED', 'REJECTED')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_claims (
    claim_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id              UUID NOT NULL REFERENCES public.ai_runs(run_id) ON DELETE CASCADE,
    claim_text          TEXT NOT NULL,
    source_evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status              ai_claim_status NOT NULL DEFAULT 'REQUIRES_REVIEW',
    reviewer_id         UUID REFERENCES public.profiles(id),
    reviewer_notes      TEXT,
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 14. EVIDENCE PASSPORT & INDEPENDENT VERIFIER (FZ-PASS / FZ-VERIFY)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.verification_passports (
    passport_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    manifest_version    TEXT NOT NULL DEFAULT 'FZ-PASS-v1',
    passport_hash       TEXT NOT NULL UNIQUE,
    passport_payload    JSONB NOT NULL,
    generated_by        UUID NOT NULL REFERENCES public.profiles(id),
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.verification_results (
    result_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id             UUID REFERENCES public.verification_passports(passport_id) ON DELETE SET NULL,
    evidence_id             UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    verifier_identity       TEXT NOT NULL,
    verdict                 verification_verdict NOT NULL,
    content_integrity       BOOLEAN NOT NULL,
    state_integrity         BOOLEAN NOT NULL,
    signature_integrity     BOOLEAN NOT NULL,
    custody_integrity       BOOLEAN NOT NULL,
    provenance_integrity    BOOLEAN NOT NULL,
    branch_integrity        BOOLEAN NOT NULL,
    adjudication_integrity  BOOLEAN NOT NULL,
    temporal_integrity      BOOLEAN NOT NULL,
    verification_report     JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timestamp_proofs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    state_id            UUID REFERENCES public.evidence_states(state_id),
    anchor_type         TEXT NOT NULL DEFAULT 'RFC3161',
    anchor_provider     TEXT NOT NULL,
    merkle_root_hash    TEXT NOT NULL,
    proof_token         TEXT NOT NULL,
    anchored_at         TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 15. IMMUTABILITY TRIGGERS & TAMPER GUARDS
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY ALERT: Audit and custody records are immutable and append-only.'
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION protect_master_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.master_hash IS NOT NULL AND NEW.master_hash != OLD.master_hash THEN
        RAISE EXCEPTION 'SECURITY ALERT: Evidence master hash is cryptographically immutable after sealing.'
            USING ERRCODE = 'P0004';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_evidence_states_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY ALERT: evidence_states rows are strictly append-only and cannot be updated or deleted.'
        USING ERRCODE = 'P0005';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_adjudications_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY ALERT: adjudications rows are immutable. A new version must be appended.'
        USING ERRCODE = 'P0006';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_evidence_deletion_on_hold()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.legal_holds
        WHERE evidence_id = OLD.id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'CANNOT DELETE EVIDENCE: Active Legal Hold is in effect.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach Triggers
DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_protect_audit_logs
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS trg_protect_custody_logs ON public.custody_logs;
CREATE TRIGGER trg_protect_custody_logs
    BEFORE UPDATE OR DELETE ON public.custody_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS trg_protect_master_hash ON public.evidence;
CREATE TRIGGER trg_protect_master_hash
    BEFORE UPDATE ON public.evidence
    FOR EACH ROW EXECUTE FUNCTION protect_master_hash();

DROP TRIGGER IF EXISTS trg_protect_evidence_states ON public.evidence_states;
CREATE TRIGGER trg_protect_evidence_states
    BEFORE UPDATE OR DELETE ON public.evidence_states
    FOR EACH ROW EXECUTE FUNCTION prevent_evidence_states_modification();

DROP TRIGGER IF EXISTS trg_protect_adjudications ON public.adjudications;
CREATE TRIGGER trg_protect_adjudications
    BEFORE UPDATE OR DELETE ON public.adjudications
    FOR EACH ROW EXECUTE FUNCTION prevent_adjudications_modification();

DROP TRIGGER IF EXISTS trg_prevent_evidence_deletion ON public.evidence;
CREATE TRIGGER trg_prevent_evidence_deletion
    BEFORE DELETE ON public.evidence
    FOR EACH ROW EXECUTE FUNCTION prevent_evidence_deletion_on_hold();

-- =============================================================
-- 16. ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjudications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provenance_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provenance_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_proofs ENABLE ROW LEVEL SECURITY;

-- Profiles: Own profile or Admin/Supervisor
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
    TO authenticated USING (id = auth.uid() OR public.user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[]));

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
    TO authenticated USING (id = auth.uid() OR public.user_has_role('ADMIN'));

-- User Roles: Only Admin can assign/delete; users can read own
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles FOR SELECT
    TO authenticated USING (user_id = auth.uid() OR public.user_has_role('ADMIN'));

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL
    TO authenticated USING (public.user_has_role('ADMIN')) WITH CHECK (public.user_has_role('ADMIN'));

-- Device Keys: User can see their own, Admin can manage all
DROP POLICY IF EXISTS "device_keys_select_policy" ON public.device_keys;
CREATE POLICY "device_keys_select_policy" ON public.device_keys FOR SELECT
    TO authenticated USING (user_id = auth.uid() OR public.user_has_role('ADMIN'));

DROP POLICY IF EXISTS "device_keys_insert_policy" ON public.device_keys;
CREATE POLICY "device_keys_insert_policy" ON public.device_keys FOR INSERT
    TO authenticated WITH CHECK (user_id = auth.uid() OR public.user_has_role('ADMIN'));

DROP POLICY IF EXISTS "device_keys_update_policy" ON public.device_keys;
CREATE POLICY "device_keys_update_policy" ON public.device_keys FOR UPDATE
    TO authenticated USING (public.user_has_role('ADMIN'));

-- Cases & Evidence: Role & assignment bounded
DROP POLICY IF EXISTS "cases_read_policy" ON public.cases;
CREATE POLICY "cases_read_policy" ON public.cases FOR SELECT
    TO authenticated USING (
        public.user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR', 'JUDGE']::app_role[])
        OR id IN (SELECT case_id FROM public.case_officers WHERE officer_id = auth.uid())
    );

DROP POLICY IF EXISTS "evidence_read_policy" ON public.evidence;
CREATE POLICY "evidence_read_policy" ON public.evidence FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "evidence_insert_policy" ON public.evidence;
CREATE POLICY "evidence_insert_policy" ON public.evidence FOR INSERT
    TO authenticated WITH CHECK (public.user_has_any_role(ARRAY['INVESTIGATING_OFFICER', 'SUPERVISOR', 'ADMIN']::app_role[]));

-- Custody & States: Read permitted, insert permitted to authorized, UPDATE/DELETE strictly forbidden
DROP POLICY IF EXISTS "custody_logs_select" ON public.custody_logs;
CREATE POLICY "custody_logs_select" ON public.custody_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "custody_logs_insert" ON public.custody_logs;
CREATE POLICY "custody_logs_insert" ON public.custody_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "evidence_states_select" ON public.evidence_states;
CREATE POLICY "evidence_states_select" ON public.evidence_states FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "evidence_states_insert" ON public.evidence_states;
CREATE POLICY "evidence_states_insert" ON public.evidence_states FOR INSERT TO authenticated WITH CHECK (true);

-- Adjudications: Only JUDGE or SUPERVISOR can adjudicate
DROP POLICY IF EXISTS "adjudications_select" ON public.adjudications;
CREATE POLICY "adjudications_select" ON public.adjudications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "adjudications_insert" ON public.adjudications;
CREATE POLICY "adjudications_insert" ON public.adjudications FOR INSERT
    TO authenticated WITH CHECK (public.user_has_any_role(ARRAY['JUDGE', 'SUPERVISOR', 'ADMIN']::app_role[]));

-- Audit & Security Logs: Append-only
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
    TO authenticated USING (public.user_has_any_role(ARRAY['AUDITOR', 'ADMIN', 'SUPERVISOR']::app_role[]));

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "security_events_select" ON public.security_events;
CREATE POLICY "security_events_select" ON public.security_events FOR SELECT
    TO authenticated USING (public.user_has_any_role(ARRAY['ADMIN', 'AUDITOR', 'SUPERVISOR']::app_role[]));

DROP POLICY IF EXISTS "security_events_insert" ON public.security_events;
CREATE POLICY "security_events_insert" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);

-- Provenance, Samples & Passports
DROP POLICY IF EXISTS "provenance_nodes_policy" ON public.provenance_nodes;
CREATE POLICY "provenance_nodes_policy" ON public.provenance_nodes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "provenance_edges_policy" ON public.provenance_edges;
CREATE POLICY "provenance_edges_policy" ON public.provenance_edges FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sample_lineage_policy" ON public.sample_lineage;
CREATE POLICY "sample_lineage_policy" ON public.sample_lineage FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "passports_policy" ON public.verification_passports;
CREATE POLICY "passports_policy" ON public.verification_passports FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "verify_results_policy" ON public.verification_results;
CREATE POLICY "verify_results_policy" ON public.verification_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legal_holds_policy" ON public.legal_holds;
CREATE POLICY "legal_holds_policy" ON public.legal_holds FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "containers_policy" ON public.containers;
CREATE POLICY "containers_policy" ON public.containers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "seals_policy" ON public.seals;
CREATE POLICY "seals_policy" ON public.seals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conditions_policy" ON public.evidence_conditions;
CREATE POLICY "conditions_policy" ON public.evidence_conditions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ai_runs_policy" ON public.ai_runs;
CREATE POLICY "ai_runs_policy" ON public.ai_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ai_claims_policy" ON public.ai_claims;
CREATE POLICY "ai_claims_policy" ON public.ai_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "timestamp_proofs_policy" ON public.timestamp_proofs;
CREATE POLICY "timestamp_proofs_policy" ON public.timestamp_proofs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "branches_policy" ON public.branches;
CREATE POLICY "branches_policy" ON public.branches FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "divergences_policy" ON public.divergences;
CREATE POLICY "divergences_policy" ON public.divergences FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conflicts_policy" ON public.conflicts;
CREATE POLICY "conflicts_policy" ON public.conflicts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================
-- 17. PRIVATE STORAGE BUCKETS SETUP
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('evidence-media', 'evidence-media', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']),
    ('lab-reports', 'lab-reports', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('court-dossiers', 'court-dossiers', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
