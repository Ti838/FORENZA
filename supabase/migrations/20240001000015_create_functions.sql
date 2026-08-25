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
