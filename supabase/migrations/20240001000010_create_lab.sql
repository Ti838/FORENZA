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
