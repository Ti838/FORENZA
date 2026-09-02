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
