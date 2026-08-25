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
