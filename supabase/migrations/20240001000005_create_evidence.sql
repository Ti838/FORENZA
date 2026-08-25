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
