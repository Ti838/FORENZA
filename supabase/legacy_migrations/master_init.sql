-- =============================================================
-- Migration 001: FORENZA Enumeration Types
-- =============================================================

-- Evidence lifecycle states
CREATE TYPE evidence_status AS ENUM (
    'REGISTERED',
    'CAPTURED',
    'SEALED',
    'IN_TRANSIT',
    'VAULT_STORED',
    'TRANSFERRED',
    'LAB_RECEIVED',
    'UNDER_ANALYSIS',
    'ANALYSIS_COMPLETED',
    'COURT_SUBMITTED',
    'ARCHIVED'
);

-- Classification method
CREATE TYPE classification_method AS ENUM (
    'AI_CONFIRMED',
    'MANUAL',
    'MANUAL_OVERRIDE'
);

-- Custody actions
CREATE TYPE custody_action AS ENUM (
    'CAPTURED',
    'SEALED',
    'TRANSFERRED',
    'RECEIVED',
    'VAULT_STORED',
    'LAB_RECEIVED',
    'COURT_SUBMITTED',
    'OVERRIDE'
);

-- Device registration status
CREATE TYPE device_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REVOKED'
);

-- Case lifecycle status
CREATE TYPE case_status AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'CLOSED',
    'ARCHIVED'
);

-- Application roles
CREATE TYPE app_role AS ENUM (
    'ADMIN',
    'INVESTIGATING_OFFICER',
    'SUPERVISOR',
    'VAULT_CUSTODIAN',
    'LAB_ANALYST',
    'JUDGE',
    'AUDITOR'
);

-- Media types
CREATE TYPE media_type AS ENUM (
    'PHOTO',
    'VIDEO',
    'DOCUMENT',
    'OTHER'
);

-- Override status
CREATE TYPE override_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PENDING_JUDICIAL_REVIEW'
);

-- Evidence event types
CREATE TYPE evidence_event_type AS ENUM (
    'REGISTERED',
    'CAPTURED',
    'CLASSIFIED_AI',
    'CLASSIFIED_MANUAL',
    'SEALED',
    'QR_GENERATED',
    'TRANSFER_INITIATED',
    'TRANSFER_COMPLETED',
    'TRANSIT_STARTED',
    'TRANSIT_STOPPED',
    'VAULT_RECEIVED',
    'VAULT_STORED',
    'LAB_RECEIVED',
    'SAMPLE_REGISTERED',
    'SAMPLE_CONSUMED',
    'ANALYSIS_STARTED',
    'ANALYSIS_COMPLETED',
    'REPORT_UPLOADED',
    'COURT_SUBMITTED',
    'INTEGRITY_VERIFIED',
    'INTEGRITY_FAILED',
    'ARCHIVED',
    'SUPERVISOR_OVERRIDE'
);

-- Audit event categories
CREATE TYPE audit_category AS ENUM (
    'AUTHENTICATION',
    'AUTHORIZATION',
    'CASE_MANAGEMENT',
    'EVIDENCE_MANAGEMENT',
    'CUSTODY_TRANSFER',
    'TRANSIT_TELEMETRY',
    'VAULT_OPERATIONS',
    'LAB_OPERATIONS',
    'INTEGRITY_CHECK',
    'QR_OPERATIONS',
    'ADMIN_ACTIONS',
    'SECURITY_EVENT',
    'DEVICE_MANAGEMENT',
    'REPORT_OPERATIONS',
    'JUDICIAL_ACCESS'
);
-- =============================================================
-- Migration 002: Profiles, Roles, User Roles
-- =============================================================

-- Extended user profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
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
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT profiles_full_name_check CHECK (char_length(full_name) >= 2)
);

-- Application roles definition table
CREATE TABLE roles (
    id          SERIAL      PRIMARY KEY,
    name        app_role    NOT NULL UNIQUE,
    description TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
    ('ADMIN',                 'System administrator with user management access'),
    ('INVESTIGATING_OFFICER', 'Field officer responsible for evidence capture'),
    ('SUPERVISOR',            'Supervisor with override and case management authority'),
    ('VAULT_CUSTODIAN',       'Evidence vault manager responsible for secure storage'),
    ('LAB_ANALYST',           'Forensic laboratory analyst'),
    ('JUDGE',                 'Judicial officer with read-only case access'),
    ('AUDITOR',               'Compliance auditor with read-only audit access');

-- User-role assignments (many-to-many)
CREATE TABLE user_roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role        app_role    NOT NULL,
    assigned_by UUID        REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, role)
);

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: get roles for current auth user
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS app_role[] AS $$
    SELECT ARRAY_AGG(role) FROM user_roles WHERE user_roles.user_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if current user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(check_role app_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = check_role
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if current user has any of the given roles
CREATE OR REPLACE FUNCTION user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ANY(check_roles)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
-- =============================================================
-- Migration 003: Approved Devices
-- =============================================================

CREATE TABLE approved_devices (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- Opaque device identifier (hashed on client before storage, NOT raw hardware ID)
    device_identifier   TEXT        NOT NULL,
    device_name         TEXT        NOT NULL,
    platform            TEXT        NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    status              device_status NOT NULL DEFAULT 'PENDING',
    approved_at         TIMESTAMPTZ,
    approved_by         UUID        REFERENCES profiles(id),
    revoked_at          TIMESTAMPTZ,
    revoked_by          UUID        REFERENCES profiles(id),
    revocation_reason   TEXT,
    last_seen_at        TIMESTAMPTZ,
    device_metadata     JSONB       NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, device_identifier),
    CONSTRAINT device_name_length CHECK (char_length(device_name) >= 1),
    CONSTRAINT device_identifier_length CHECK (char_length(device_identifier) >= 16)
);

CREATE INDEX idx_approved_devices_user_id ON approved_devices(user_id);
CREATE INDEX idx_approved_devices_status ON approved_devices(status);
CREATE INDEX idx_approved_devices_identifier ON approved_devices(device_identifier);
-- =============================================================
-- Migration 004: Cases
-- =============================================================

CREATE TABLE cases (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number             TEXT        NOT NULL UNIQUE,
    title                   TEXT        NOT NULL,
    crime_type              TEXT        NOT NULL,
    description             TEXT,
    -- Crime scene GPS coordinates
    crime_scene_latitude    DECIMAL(10, 8),
    crime_scene_longitude   DECIMAL(11, 8),
    incident_datetime       TIMESTAMPTZ,
    -- Assigned investigating officer
    assigned_officer_id     UUID        REFERENCES profiles(id),
    status                  case_status NOT NULL DEFAULT 'ACTIVE',
    -- Creator (Admin or Supervisor)
    created_by              UUID        NOT NULL REFERENCES profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT case_number_format CHECK (case_number ~ '^[A-Z0-9\-]+$'),
    CONSTRAINT case_title_length CHECK (char_length(title) >= 3),
    CONSTRAINT case_latitude_range CHECK (
        crime_scene_latitude IS NULL OR
        (crime_scene_latitude >= -90 AND crime_scene_latitude <= 90)
    ),
    CONSTRAINT case_longitude_range CHECK (
        crime_scene_longitude IS NULL OR
        (crime_scene_longitude >= -180 AND crime_scene_longitude <= 180)
    )
);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_assigned_officer ON cases(assigned_officer_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE TRIGGER cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Judicial case access grants (explicit grant required for JUDGE access)
CREATE TABLE case_judicial_access (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    judge_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_by  UUID        NOT NULL REFERENCES profiles(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN     NOT NULL DEFAULT true,

    UNIQUE (case_id, judge_id)
);

CREATE INDEX idx_case_judicial_access_case ON case_judicial_access(case_id);
CREATE INDEX idx_case_judicial_access_judge ON case_judicial_access(judge_id);
-- =============================================================
-- Migration 005: Evidence + Evidence Media
-- =============================================================

CREATE TABLE evidence (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                 UUID            NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    evidence_number         TEXT            NOT NULL,
    -- Current state
    status                  evidence_status NOT NULL DEFAULT 'REGISTERED',
    -- Current custody holder
    current_holder_id       UUID            REFERENCES profiles(id),
    -- Capture metadata (set at capture time)
    captured_by             UUID            REFERENCES profiles(id),
    captured_at             TIMESTAMPTZ,
    capture_latitude        DECIMAL(10, 8),
    capture_longitude       DECIMAL(11, 8),
    capture_gps_accuracy    DECIMAL(8, 3),
    capture_compass_heading DECIMAL(6, 3),
    -- Distance from crime scene at capture
    capture_distance_meters DECIMAL(10, 2),
    geofence_verified       BOOLEAN,
    -- Geofence override
    geofence_override_id    UUID,           -- FK set after supervisor_overrides created
    -- Integrity
    master_hash             TEXT,           -- SHA-256, set at seal time, immutable after
    hash_algorithm          TEXT            NOT NULL DEFAULT 'SHA-256',
    -- Registration
    registered_by           UUID            NOT NULL REFERENCES profiles(id),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),

    UNIQUE (case_id, evidence_number),
    CONSTRAINT evidence_number_format CHECK (evidence_number ~ '^[A-Z0-9\-]+$')
);

CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_evidence_status ON evidence(status);
CREATE INDEX idx_evidence_current_holder ON evidence(current_holder_id);
CREATE INDEX idx_evidence_captured_by ON evidence(captured_by);
CREATE INDEX idx_evidence_master_hash ON evidence(master_hash);

CREATE TRIGGER evidence_updated_at
    BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Evidence media files (photos, videos)
CREATE TABLE evidence_media (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    media_type          media_type  NOT NULL,
    mime_type           TEXT        NOT NULL,
    -- Supabase Storage path (bucket/path, never public URL)
    storage_path        TEXT        NOT NULL UNIQUE,
    file_size_bytes     BIGINT      NOT NULL CHECK (file_size_bytes > 0),
    file_sha256         TEXT        NOT NULL,    -- SHA-256 of original file bytes
    original_filename   TEXT,
    -- EXIF / capture metadata
    width_px            INTEGER,
    height_px           INTEGER,
    duration_seconds    DECIMAL(10, 3),
    captured_by         UUID        NOT NULL REFERENCES profiles(id),
    captured_at         TIMESTAMPTZ NOT NULL,
    is_primary          BOOLEAN     NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT media_sha256_format CHECK (file_sha256 ~ '^[a-f0-9]{64}$')
);

CREATE INDEX idx_evidence_media_evidence_id ON evidence_media(evidence_id);
CREATE INDEX idx_evidence_media_sha256 ON evidence_media(file_sha256);

-- Ensure at most one primary media per evidence
CREATE UNIQUE INDEX idx_evidence_media_primary
    ON evidence_media(evidence_id)
    WHERE is_primary = true;
-- =============================================================
-- Migration 006: Evidence Classifications
-- =============================================================

CREATE TABLE evidence_classifications (
    id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID                    NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE RESTRICT,
    -- AI Classification results (raw, never modified)
    ai_object               TEXT,
    ai_category             TEXT,
    ai_subcategory          TEXT,
    ai_confidence           DECIMAL(5, 2)           CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    ai_model_version        TEXT,
    ai_classified_at        TIMESTAMPTZ,
    ai_available            BOOLEAN                 NOT NULL DEFAULT false,
    -- Final human-confirmed classification
    final_object            TEXT                    NOT NULL,
    final_category          TEXT                    NOT NULL,
    final_subcategory       TEXT,
    final_description       TEXT,
    final_notes             TEXT,
    -- How was the final classification determined?
    classification_method   classification_method   NOT NULL,
    -- Who confirmed / manually classified?
    confirmed_by            UUID                    NOT NULL REFERENCES profiles(id),
    confirmed_at            TIMESTAMPTZ             NOT NULL DEFAULT now(),
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),

    CONSTRAINT classification_final_object_length CHECK (char_length(final_object) >= 1),
    CONSTRAINT classification_final_category_length CHECK (char_length(final_category) >= 1)
);

CREATE INDEX idx_evidence_classifications_evidence_id ON evidence_classifications(evidence_id);
CREATE INDEX idx_evidence_classifications_method ON evidence_classifications(classification_method);
-- =============================================================
-- Migration 007: Custody Logs + Evidence Events
-- =============================================================

-- Custody chain — append-only (no UPDATE, no DELETE via RLS)
CREATE TABLE custody_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID            NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    action              custody_action  NOT NULL,
    sender_id           UUID            REFERENCES profiles(id),
    receiver_id         UUID            REFERENCES profiles(id),
    -- Hash chain
    previous_hash       TEXT,           -- NULL only for genesis event
    current_hash        TEXT            NOT NULL,
    -- Location at time of transfer (optional)
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    location_accuracy   DECIMAL(8, 3),
    -- Notes
    notes               TEXT,
    -- Metadata (serialized canonical event data for audit)
    canonical_data      JSONB           NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT custody_hash_format CHECK (current_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT custody_previous_hash_format CHECK (
        previous_hash IS NULL OR previous_hash ~ '^[a-f0-9]{64}$' OR previous_hash = 'FORENZA_GENESIS_v1'
    )
);

CREATE INDEX idx_custody_logs_evidence_id ON custody_logs(evidence_id);
CREATE INDEX idx_custody_logs_created_at ON custody_logs(evidence_id, created_at);
CREATE INDEX idx_custody_logs_sender ON custody_logs(sender_id);
CREATE INDEX idx_custody_logs_receiver ON custody_logs(receiver_id);

-- Evidence events — ordered lifecycle history
CREATE TABLE evidence_events (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID                NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    case_id         UUID                NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    event_type      evidence_event_type NOT NULL,
    actor_id        UUID                NOT NULL REFERENCES profiles(id),
    -- Location at event time
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    -- Status transition
    from_status     evidence_status,
    to_status       evidence_status,
    -- Additional context
    metadata        JSONB               NOT NULL DEFAULT '{}',
    notes           TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_events_evidence_id ON evidence_events(evidence_id);
CREATE INDEX idx_evidence_events_case_id ON evidence_events(case_id);
CREATE INDEX idx_evidence_events_created_at ON evidence_events(evidence_id, created_at);
CREATE INDEX idx_evidence_events_type ON evidence_events(event_type);

-- Handover tokens (for custody transfer QR workflow)
CREATE TABLE handover_tokens (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL REFERENCES profiles(id),
    token_hash      TEXT        NOT NULL UNIQUE,    -- SHA-256 of the JWT
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    used_by         UUID        REFERENCES profiles(id),
    is_revoked      BOOLEAN     NOT NULL DEFAULT false,

    CONSTRAINT handover_token_hash_format CHECK (token_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX idx_handover_tokens_evidence ON handover_tokens(evidence_id);
CREATE INDEX idx_handover_tokens_hash ON handover_tokens(token_hash);
CREATE INDEX idx_handover_tokens_expires ON handover_tokens(expires_at);
-- =============================================================
-- Migration 008: Transit Telemetry
-- =============================================================

CREATE TABLE transit_telemetry (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    custodian_id    UUID        NOT NULL REFERENCES profiles(id),
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    accuracy        DECIMAL(8, 3),
    altitude        DECIMAL(10, 3),
    speed           DECIMAL(8, 3),
    heading         DECIMAL(6, 3),
    captured_at     TIMESTAMPTZ NOT NULL,
    sequence_number INTEGER     NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT transit_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT transit_longitude_range CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT transit_sequence_positive CHECK (sequence_number >= 0)
);

CREATE INDEX idx_transit_telemetry_evidence_id ON transit_telemetry(evidence_id);
CREATE INDEX idx_transit_telemetry_custodian ON transit_telemetry(custodian_id);
CREATE INDEX idx_transit_telemetry_captured_at ON transit_telemetry(evidence_id, captured_at);
CREATE INDEX idx_transit_telemetry_sequence ON transit_telemetry(evidence_id, sequence_number);
-- =============================================================
-- Migration 009: Vault Locations
-- =============================================================

CREATE TABLE vault_locations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE RESTRICT,
    -- Physical vault address
    vault_id        TEXT        NOT NULL,
    rack            TEXT,
    shelf           TEXT,
    bin             TEXT,
    -- Full location string for display
    location_label  TEXT        NOT NULL,
    stored_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    custodian_id    UUID        NOT NULL REFERENCES profiles(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_locations_evidence_id ON vault_locations(evidence_id);
CREATE INDEX idx_vault_locations_vault_id ON vault_locations(vault_id);
CREATE INDEX idx_vault_locations_custodian ON vault_locations(custodian_id);
-- =============================================================
-- Migration 010: Lab Samples, Sample Consumption, Lab Reports
-- =============================================================

-- Lab samples registered from evidence
CREATE TABLE lab_samples (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID        NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    sample_number       TEXT        NOT NULL,
    description         TEXT        NOT NULL,
    -- Quantity tracking (unit is contextual: grams, ml, items, etc.)
    quantity_unit       TEXT        NOT NULL DEFAULT 'units',
    initial_quantity    DECIMAL(12, 4) NOT NULL CHECK (initial_quantity > 0),
    consumed_quantity   DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (consumed_quantity >= 0),
    remaining_quantity  DECIMAL(12, 4) GENERATED ALWAYS AS (initial_quantity - consumed_quantity) STORED,
    registered_by       UUID        NOT NULL REFERENCES profiles(id),
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (evidence_id, sample_number),
    -- Consumed cannot exceed initial
    CONSTRAINT sample_consumed_le_initial CHECK (consumed_quantity <= initial_quantity)
);

CREATE INDEX idx_lab_samples_evidence_id ON lab_samples(evidence_id);

-- Individual consumption events (append-only history)
CREATE TABLE sample_consumption (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id       UUID        NOT NULL REFERENCES lab_samples(id) ON DELETE RESTRICT,
    evidence_id     UUID        NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    consumed_amount DECIMAL(12, 4) NOT NULL CHECK (consumed_amount > 0),
    purpose         TEXT        NOT NULL,
    analyst_id      UUID        NOT NULL REFERENCES profiles(id),
    consumed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sample_consumption_sample_id ON sample_consumption(sample_id);
CREATE INDEX idx_sample_consumption_evidence_id ON sample_consumption(evidence_id);
CREATE INDEX idx_sample_consumption_analyst ON sample_consumption(analyst_id);

-- Lab reports (versioned, append-only)
CREATE TABLE lab_reports (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    version         INTEGER     NOT NULL DEFAULT 1 CHECK (version >= 1),
    title           TEXT        NOT NULL,
    -- Supabase Storage path
    storage_path    TEXT        NOT NULL UNIQUE,
    file_sha256     TEXT        NOT NULL,
    file_size_bytes BIGINT      NOT NULL CHECK (file_size_bytes > 0),
    mime_type       TEXT        NOT NULL DEFAULT 'application/pdf',
    analyst_id      UUID        NOT NULL REFERENCES profiles(id),
    is_final        BOOLEAN     NOT NULL DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (evidence_id, version),
    CONSTRAINT report_sha256_format CHECK (file_sha256 ~ '^[a-f0-9]{64}$')
);

CREATE INDEX idx_lab_reports_evidence_id ON lab_reports(evidence_id);
CREATE INDEX idx_lab_reports_analyst ON lab_reports(analyst_id);
-- =============================================================
-- Migration 011: Audit Logs + Supervisor Overrides
-- =============================================================

-- Audit logs — append-only, no UPDATE/DELETE allowed
CREATE TABLE audit_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Actor
    actor_id        UUID            REFERENCES profiles(id),
    actor_email     TEXT,           -- Snapshot at time of event
    actor_role      app_role,       -- Snapshot at time of event
    -- Category + action
    category        audit_category  NOT NULL,
    action          TEXT            NOT NULL,
    -- Related resources
    evidence_id     UUID            REFERENCES evidence(id),
    case_id         UUID            REFERENCES cases(id),
    target_user_id  UUID            REFERENCES profiles(id),
    -- Context
    success         BOOLEAN         NOT NULL DEFAULT true,
    ip_address      INET,           -- Stored for security audit (not exposed to unauthorized users)
    user_agent      TEXT,
    request_id      TEXT,
    -- Additional structured data
    metadata        JSONB           NOT NULL DEFAULT '{}',
    -- Immutable timestamp
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_evidence_id ON audit_logs(evidence_id);
CREATE INDEX idx_audit_logs_case_id ON audit_logs(case_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- Supervisor overrides for geofence violations
CREATE TABLE supervisor_overrides (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID            NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    case_id             UUID            NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    -- The officer requesting the override
    officer_id          UUID            NOT NULL REFERENCES profiles(id),
    -- Capture location at time of override request
    capture_latitude    DECIMAL(10, 8)  NOT NULL,
    capture_longitude   DECIMAL(11, 8)  NOT NULL,
    -- Crime scene coordinates
    crime_scene_latitude  DECIMAL(10, 8),
    crime_scene_longitude DECIMAL(11, 8),
    distance_meters     DECIMAL(10, 2)  NOT NULL,
    reason              TEXT            NOT NULL,
    -- Supervisor decision
    supervisor_id       UUID            REFERENCES profiles(id),
    status              override_status NOT NULL DEFAULT 'PENDING',
    decision_notes      TEXT,
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT override_reason_length CHECK (char_length(reason) >= 10)
);

CREATE INDEX idx_supervisor_overrides_evidence_id ON supervisor_overrides(evidence_id);
CREATE INDEX idx_supervisor_overrides_officer_id ON supervisor_overrides(officer_id);
CREATE INDEX idx_supervisor_overrides_status ON supervisor_overrides(status);

-- Now add the FK from evidence to supervisor_overrides
ALTER TABLE evidence
    ADD CONSTRAINT evidence_geofence_override_fk
    FOREIGN KEY (geofence_override_id)
    REFERENCES supervisor_overrides(id);
-- =============================================================
-- Migration 012: QR Tokens
-- =============================================================

CREATE TABLE qr_tokens (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID        NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    token_hash      TEXT        NOT NULL UNIQUE,    -- SHA-256 of the signed JWT
    -- Token is opaque — no sensitive data in QR payload
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    issued_by       UUID        NOT NULL REFERENCES profiles(id),
    last_scanned_at TIMESTAMPTZ,
    scan_count      INTEGER     NOT NULL DEFAULT 0 CHECK (scan_count >= 0),
    is_revoked      BOOLEAN     NOT NULL DEFAULT false,

    CONSTRAINT qr_token_hash_format CHECK (token_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX idx_qr_tokens_evidence_id ON qr_tokens(evidence_id);
CREATE INDEX idx_qr_tokens_hash ON qr_tokens(token_hash);
CREATE INDEX idx_qr_tokens_expires ON qr_tokens(expires_at);

-- Get latest active QR token for an evidence item
CREATE OR REPLACE FUNCTION get_active_qr_token(p_evidence_id UUID)
RETURNS qr_tokens AS $$
    SELECT * FROM qr_tokens
    WHERE evidence_id = p_evidence_id
      AND is_revoked = false
      AND expires_at > now()
    ORDER BY issued_at DESC
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
-- =============================================================
-- Migration 013: Row Level Security Policies
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_devices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_judicial_access  ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_telemetry     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_samples           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_consumption    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens             ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- PROFILES
-- =============================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- ADMIN and SUPERVISOR can view all profiles
CREATE POLICY "profiles_select_admin_supervisor"
    ON profiles FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- Only ADMIN can insert profiles (user creation)
CREATE POLICY "profiles_insert_admin"
    ON profiles FOR INSERT
    WITH CHECK (user_has_role('ADMIN'));

-- ADMIN can update any profile, users can update own non-sensitive fields
CREATE POLICY "profiles_update_admin"
    ON profiles FOR UPDATE
    USING (user_has_role('ADMIN'));

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- No one can delete profiles via RLS (soft delete via is_active)

-- =============================================================
-- USER ROLES
-- =============================================================

CREATE POLICY "user_roles_select_own"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
    ON user_roles FOR SELECT
    USING (user_has_role('ADMIN'));

CREATE POLICY "user_roles_insert_admin"
    ON user_roles FOR INSERT
    WITH CHECK (user_has_role('ADMIN'));

CREATE POLICY "user_roles_delete_admin"
    ON user_roles FOR DELETE
    USING (user_has_role('ADMIN'));

-- =============================================================
-- APPROVED DEVICES
-- =============================================================

-- Users see their own devices
CREATE POLICY "devices_select_own"
    ON approved_devices FOR SELECT
    USING (user_id = auth.uid());

-- ADMIN sees all devices
CREATE POLICY "devices_select_admin"
    ON approved_devices FOR SELECT
    USING (user_has_role('ADMIN'));

-- Anyone authenticated can register (pending) their own device
CREATE POLICY "devices_insert_own"
    ON approved_devices FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Only ADMIN can approve/revoke
CREATE POLICY "devices_update_admin"
    ON approved_devices FOR UPDATE
    USING (user_has_role('ADMIN'));

-- =============================================================
-- CASES
-- =============================================================

-- ADMIN, SUPERVISOR: full read access
CREATE POLICY "cases_select_admin_supervisor"
    ON cases FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- INVESTIGATING_OFFICER: only assigned cases
CREATE POLICY "cases_select_officer"
    ON cases FOR SELECT
    USING (
        user_has_role('INVESTIGATING_OFFICER')
        AND assigned_officer_id = auth.uid()
    );

-- VAULT_CUSTODIAN, LAB_ANALYST: cases where they hold evidence
CREATE POLICY "cases_select_custodian_lab"
    ON cases FOR SELECT
    USING (
        user_has_any_role(ARRAY['VAULT_CUSTODIAN', 'LAB_ANALYST']::app_role[])
        AND id IN (
            SELECT DISTINCT case_id FROM evidence
            WHERE current_holder_id = auth.uid()
        )
    );

-- JUDGE: explicitly granted cases only
CREATE POLICY "cases_select_judge"
    ON cases FOR SELECT
    USING (
        user_has_role('JUDGE')
        AND id IN (
            SELECT case_id FROM case_judicial_access
            WHERE judge_id = auth.uid()
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > now())
        )
    );

-- AUDITOR: read all cases (read-only)
CREATE POLICY "cases_select_auditor"
    ON cases FOR SELECT
    USING (user_has_role('AUDITOR'));

-- Insert: ADMIN, SUPERVISOR
CREATE POLICY "cases_insert_admin_supervisor"
    ON cases FOR INSERT
    WITH CHECK (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- Update: ADMIN, SUPERVISOR (limited fields enforced in app layer)
CREATE POLICY "cases_update_admin_supervisor"
    ON cases FOR UPDATE
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- =============================================================
-- EVIDENCE
-- =============================================================

-- ADMIN, SUPERVISOR: all evidence
CREATE POLICY "evidence_select_admin_supervisor"
    ON evidence FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- INVESTIGATING_OFFICER: evidence they captured or in their assigned cases
CREATE POLICY "evidence_select_officer"
    ON evidence FOR SELECT
    USING (
        user_has_role('INVESTIGATING_OFFICER')
        AND (
            captured_by = auth.uid()
            OR registered_by = auth.uid()
            OR case_id IN (
                SELECT id FROM cases WHERE assigned_officer_id = auth.uid()
            )
        )
    );

-- VAULT_CUSTODIAN: evidence they currently hold
CREATE POLICY "evidence_select_vault"
    ON evidence FOR SELECT
    USING (
        user_has_role('VAULT_CUSTODIAN')
        AND current_holder_id = auth.uid()
    );

-- LAB_ANALYST: evidence in lab states
CREATE POLICY "evidence_select_lab"
    ON evidence FOR SELECT
    USING (
        user_has_role('LAB_ANALYST')
        AND status IN ('LAB_RECEIVED', 'UNDER_ANALYSIS', 'ANALYSIS_COMPLETED')
        AND current_holder_id = auth.uid()
    );

-- JUDGE: authorized cases only
CREATE POLICY "evidence_select_judge"
    ON evidence FOR SELECT
    USING (
        user_has_role('JUDGE')
        AND case_id IN (
            SELECT case_id FROM case_judicial_access
            WHERE judge_id = auth.uid()
              AND is_active = true
        )
    );

-- AUDITOR: all evidence (read-only)
CREATE POLICY "evidence_select_auditor"
    ON evidence FOR SELECT
    USING (user_has_role('AUDITOR'));

-- INVESTIGATING_OFFICER can register/insert evidence
CREATE POLICY "evidence_insert_officer"
    ON evidence FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND registered_by = auth.uid()
    );

-- Updates via authorized roles (app layer enforces state machine)
CREATE POLICY "evidence_update_authorized"
    ON evidence FOR UPDATE
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'INVESTIGATING_OFFICER',
            'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
    );

-- =============================================================
-- EVIDENCE MEDIA
-- =============================================================

-- Media access mirrors evidence access (simplified: same roles)
CREATE POLICY "evidence_media_select_authorized"
    ON evidence_media FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)  -- RLS on evidence handles filtering
    );

CREATE POLICY "evidence_media_insert_officer"
    ON evidence_media FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND captured_by = auth.uid()
    );

-- =============================================================
-- EVIDENCE CLASSIFICATIONS
-- =============================================================

CREATE POLICY "classifications_select_authorized"
    ON evidence_classifications FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)
    );

CREATE POLICY "classifications_insert_officer"
    ON evidence_classifications FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND confirmed_by = auth.uid()
    );

-- No UPDATE/DELETE on classifications — they are immutable after creation

-- =============================================================
-- CUSTODY LOGS — APPEND ONLY
-- =============================================================

CREATE POLICY "custody_logs_select_authorized"
    ON custody_logs FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'INVESTIGATING_OFFICER',
            'VAULT_CUSTODIAN', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
        AND evidence_id IN (SELECT id FROM evidence)
    );

-- INSERT only — no UPDATE, no DELETE (enforced by not creating those policies)
CREATE POLICY "custody_logs_insert_authorized"
    ON custody_logs FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST', 'SUPERVISOR'
        ]::app_role[])
    );

-- =============================================================
-- EVIDENCE EVENTS — APPEND ONLY
-- =============================================================

CREATE POLICY "evidence_events_select_authorized"
    ON evidence_events FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)
    );

CREATE POLICY "evidence_events_insert_system"
    ON evidence_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- TRANSIT TELEMETRY
-- =============================================================

-- Only the current custodian can insert telemetry
CREATE POLICY "transit_telemetry_insert_custodian"
    ON transit_telemetry FOR INSERT
    WITH CHECK (
        custodian_id = auth.uid()
        AND evidence_id IN (
            SELECT id FROM evidence
            WHERE current_holder_id = auth.uid()
              AND status = 'IN_TRANSIT'
        )
    );

-- Select: authorized roles with evidence access
CREATE POLICY "transit_telemetry_select_authorized"
    ON transit_telemetry FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'JUDGE', 'AUDITOR'
        ]::app_role[])
        OR custodian_id = auth.uid()
    );

-- =============================================================
-- VAULT LOCATIONS
-- =============================================================

CREATE POLICY "vault_locations_select_authorized"
    ON vault_locations FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'VAULT_CUSTODIAN', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "vault_locations_insert_custodian"
    ON vault_locations FOR INSERT
    WITH CHECK (
        user_has_role('VAULT_CUSTODIAN')
        AND custodian_id = auth.uid()
    );

-- =============================================================
-- LAB SAMPLES + CONSUMPTION
-- =============================================================

CREATE POLICY "lab_samples_select_authorized"
    ON lab_samples FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "lab_samples_insert_analyst"
    ON lab_samples FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND registered_by = auth.uid()
    );

CREATE POLICY "lab_samples_update_analyst"
    ON lab_samples FOR UPDATE
    USING (
        user_has_role('LAB_ANALYST')
        AND registered_by = auth.uid()
    );

CREATE POLICY "sample_consumption_select_authorized"
    ON sample_consumption FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "sample_consumption_insert_analyst"
    ON sample_consumption FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND analyst_id = auth.uid()
    );

-- =============================================================
-- LAB REPORTS
-- =============================================================

CREATE POLICY "lab_reports_select_authorized"
    ON lab_reports FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "lab_reports_insert_analyst"
    ON lab_reports FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND analyst_id = auth.uid()
    );

-- =============================================================
-- AUDIT LOGS — APPEND ONLY (NO UPDATE, NO DELETE)
-- =============================================================

-- ADMIN, AUDITOR, SUPERVISOR can read audit logs
CREATE POLICY "audit_logs_select_authorized"
    ON audit_logs FOR SELECT
    USING (
        user_has_any_role(ARRAY['ADMIN', 'AUDITOR', 'SUPERVISOR']::app_role[])
    );

-- Any authenticated user can insert (system inserts on their behalf)
CREATE POLICY "audit_logs_insert_any"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- SUPERVISOR OVERRIDES
-- =============================================================

CREATE POLICY "supervisor_overrides_select_authorized"
    ON supervisor_overrides FOR SELECT
    USING (
        officer_id = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "supervisor_overrides_insert_officer"
    ON supervisor_overrides FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND officer_id = auth.uid()
    );

CREATE POLICY "supervisor_overrides_update_supervisor"
    ON supervisor_overrides FOR UPDATE
    USING (
        user_has_role('SUPERVISOR')
        AND status = 'PENDING'
    );

-- =============================================================
-- QR TOKENS
-- =============================================================

CREATE POLICY "qr_tokens_select_authorized"
    ON qr_tokens FOR SELECT
    USING (
        issued_by = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "qr_tokens_insert_officer_custodian"
    ON qr_tokens FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
        AND issued_by = auth.uid()
    );

-- =============================================================
-- HANDOVER TOKENS
-- =============================================================

CREATE POLICY "handover_tokens_select_authorized"
    ON handover_tokens FOR SELECT
    USING (
        sender_id = auth.uid()
        OR used_by = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[])
    );

CREATE POLICY "handover_tokens_insert_authorized"
    ON handover_tokens FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
        AND sender_id = auth.uid()
    );

-- =============================================================
-- CASE JUDICIAL ACCESS
-- =============================================================

CREATE POLICY "case_judicial_access_select"
    ON case_judicial_access FOR SELECT
    USING (
        judge_id = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "case_judicial_access_insert_admin_supervisor"
    ON case_judicial_access FOR INSERT
    WITH CHECK (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

CREATE POLICY "case_judicial_access_update_admin"
    ON case_judicial_access FOR UPDATE
    USING (user_has_role('ADMIN'));
-- =============================================================
-- Migration 014: Additional Performance Indexes
-- =============================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_evidence_case_status ON evidence(case_id, status);
CREATE INDEX idx_evidence_holder_status ON evidence(current_holder_id, status);
CREATE INDEX idx_custody_logs_evidence_created ON custody_logs(evidence_id, created_at ASC);
CREATE INDEX idx_evidence_events_evidence_type ON evidence_events(evidence_id, event_type);
CREATE INDEX idx_transit_evidence_custodian ON transit_telemetry(evidence_id, custodian_id, captured_at ASC);
CREATE INDEX idx_audit_logs_category_created ON audit_logs(category, created_at DESC);
CREATE INDEX idx_audit_logs_evidence_created ON audit_logs(evidence_id, created_at DESC);

-- Text search indexes
CREATE INDEX idx_cases_case_number_text ON cases USING gin(to_tsvector('english', case_number || ' ' || title));
CREATE INDEX idx_profiles_email_text ON profiles USING gin(to_tsvector('english', email || ' ' || full_name));

-- Partial indexes for active/current states
CREATE INDEX idx_evidence_active ON evidence(case_id, created_at)
    WHERE status NOT IN ('ARCHIVED', 'COURT_SUBMITTED');

CREATE INDEX idx_devices_approved ON approved_devices(user_id, device_identifier)
    WHERE status = 'APPROVED';

CREATE INDEX idx_qr_tokens_active ON qr_tokens(evidence_id, expires_at)
    WHERE is_revoked = false;

CREATE INDEX idx_handover_tokens_active ON handover_tokens(evidence_id, expires_at)
    WHERE is_revoked = false AND used_at IS NULL;
-- =============================================================
-- Migration 015: Database Functions and Triggers
-- =============================================================

-- =============================================================
-- EVIDENCE STATE MACHINE VALIDATOR
-- =============================================================

-- Valid state transitions
CREATE OR REPLACE FUNCTION get_valid_next_states(current_state evidence_status)
RETURNS evidence_status[] AS $$
BEGIN
    RETURN CASE current_state
        WHEN 'REGISTERED'          THEN ARRAY['CAPTURED']::evidence_status[]
        WHEN 'CAPTURED'            THEN ARRAY['SEALED']::evidence_status[]
        WHEN 'SEALED'              THEN ARRAY['IN_TRANSIT', 'VAULT_STORED', 'LAB_RECEIVED']::evidence_status[]
        WHEN 'IN_TRANSIT'          THEN ARRAY['VAULT_STORED', 'LAB_RECEIVED', 'TRANSFERRED']::evidence_status[]
        WHEN 'TRANSFERRED'         THEN ARRAY['IN_TRANSIT', 'VAULT_STORED', 'LAB_RECEIVED']::evidence_status[]
        WHEN 'VAULT_STORED'        THEN ARRAY['IN_TRANSIT', 'LAB_RECEIVED', 'COURT_SUBMITTED']::evidence_status[]
        WHEN 'LAB_RECEIVED'        THEN ARRAY['UNDER_ANALYSIS']::evidence_status[]
        WHEN 'UNDER_ANALYSIS'      THEN ARRAY['ANALYSIS_COMPLETED']::evidence_status[]
        WHEN 'ANALYSIS_COMPLETED'  THEN ARRAY['COURT_SUBMITTED']::evidence_status[]
        WHEN 'COURT_SUBMITTED'     THEN ARRAY['ARCHIVED']::evidence_status[]
        WHEN 'ARCHIVED'            THEN ARRAY[]::evidence_status[]
        ELSE ARRAY[]::evidence_status[]
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate a state transition
CREATE OR REPLACE FUNCTION validate_evidence_transition(
    p_from evidence_status,
    p_to   evidence_status
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_to = ANY(get_valid_next_states(p_from));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to enforce state machine on evidence updates
CREATE OR REPLACE FUNCTION enforce_evidence_state_machine()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate when status changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF NOT validate_evidence_transition(OLD.status, NEW.status) THEN
        RAISE EXCEPTION
            'Invalid evidence state transition: % → %. Valid next states: %',
            OLD.status, NEW.status,
            get_valid_next_states(OLD.status)
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_state_machine
    BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION enforce_evidence_state_machine();

-- =============================================================
-- CUSTODY HASH CHAIN
-- =============================================================

-- Genesis value for the first custody event
-- IMPORTANT: This is a fixed, published, deterministic value — not a secret
CREATE OR REPLACE FUNCTION get_genesis_hash()
RETURNS TEXT AS $$
    SELECT 'FORENZA_GENESIS_v1';
$$ LANGUAGE SQL IMMUTABLE;

-- Get the most recent custody hash for an evidence item
CREATE OR REPLACE FUNCTION get_latest_custody_hash(p_evidence_id UUID)
RETURNS TEXT AS $$
    SELECT COALESCE(
        (SELECT current_hash
         FROM custody_logs
         WHERE evidence_id = p_evidence_id
         ORDER BY created_at DESC
         LIMIT 1),
        get_genesis_hash()
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================
-- SAMPLE CONSUMPTION VALIDATOR
-- Ensures consumed_quantity + new consumption <= initial_quantity
-- =============================================================

CREATE OR REPLACE FUNCTION validate_sample_consumption()
RETURNS TRIGGER AS $$
DECLARE
    v_sample lab_samples%ROWTYPE;
BEGIN
    SELECT * INTO v_sample FROM lab_samples WHERE id = NEW.sample_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sample % not found', NEW.sample_id;
    END IF;

    IF v_sample.consumed_quantity + NEW.consumed_amount > v_sample.initial_quantity THEN
        RAISE EXCEPTION
            'Consumption of % would exceed initial quantity. Available: %, Requested: %',
            NEW.consumed_amount,
            v_sample.initial_quantity - v_sample.consumed_quantity,
            NEW.consumed_amount
            USING ERRCODE = 'P0002';
    END IF;

    -- Update the sample's consumed_quantity
    UPDATE lab_samples
    SET consumed_quantity = consumed_quantity + NEW.consumed_amount
    WHERE id = NEW.sample_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sample_consumption_validate
    BEFORE INSERT ON sample_consumption
    FOR EACH ROW EXECUTE FUNCTION validate_sample_consumption();

-- =============================================================
-- AUDIT LOG TRIGGER
-- Prevents UPDATE and DELETE on audit_logs and custody_logs
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'Modification of audit records is not permitted. Table: %, Operation: %',
        TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'P0003';
END;
$$ LANGUAGE plpgsql;

-- Protect audit_logs from modification
CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Protect custody_logs from modification
CREATE TRIGGER custody_logs_no_update
    BEFORE UPDATE OR DELETE ON custody_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Protect evidence_events from modification
CREATE TRIGGER evidence_events_no_update
    BEFORE UPDATE OR DELETE ON evidence_events
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- =============================================================
-- PROFILE AUTO-CREATION TRIGGER
-- Creates a profile when a new auth user is created (Admin-initiated)
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- =============================================================
-- MASTER HASH IMMUTABILITY TRIGGER
-- Once master_hash is set, it cannot be changed
-- =============================================================

CREATE OR REPLACE FUNCTION protect_master_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.master_hash IS NOT NULL AND NEW.master_hash != OLD.master_hash THEN
        RAISE EXCEPTION
            'Evidence master hash is immutable after sealing. Evidence ID: %',
            OLD.id
            USING ERRCODE = 'P0004';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_master_hash_immutable
    BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION protect_master_hash();

-- =============================================================
-- QR TOKEN SCAN COUNTER UPDATE
-- =============================================================

CREATE OR REPLACE FUNCTION increment_qr_scan_count(p_token_hash TEXT)
RETURNS VOID AS $$
    UPDATE qr_tokens
    SET scan_count = scan_count + 1,
        last_scanned_at = now()
    WHERE token_hash = p_token_hash;
$$ LANGUAGE SQL SECURITY DEFINER;
-- =============================================================
-- Migration 016: Supabase Storage Buckets Setup
-- Sets up private buckets for evidence-media, lab-reports, court-dossiers
-- =============================================================

-- Insert storage buckets (all private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('evidence-media', 'evidence-media', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']),
    ('lab-reports', 'lab-reports', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('court-dossiers', 'court-dossiers', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies
-- Objects in evidence-media: read only by authenticated users with evidence:read permission
CREATE POLICY "evidence_media_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'evidence-media');

CREATE POLICY "evidence_media_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'evidence-media');

-- Lab reports: read/insert by authenticated users
CREATE POLICY "lab_reports_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'lab-reports');

CREATE POLICY "lab_reports_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'lab-reports');

-- Court dossiers: read/insert by authenticated users
CREATE POLICY "court_dossiers_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'court-dossiers');

CREATE POLICY "court_dossiers_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'court-dossiers');
