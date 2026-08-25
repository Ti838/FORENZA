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
