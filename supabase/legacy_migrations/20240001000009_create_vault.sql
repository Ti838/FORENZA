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
