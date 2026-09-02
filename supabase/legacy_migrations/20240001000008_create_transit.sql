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
