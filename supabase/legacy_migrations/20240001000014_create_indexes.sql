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
