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
