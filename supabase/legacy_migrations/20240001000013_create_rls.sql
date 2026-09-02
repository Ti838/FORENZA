-- =============================================================
-- Migration 013: Row Level Security Policies
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_devices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_judicial_access  ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_telemetry     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_samples           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_consumption    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens             ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- PROFILES
-- =============================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- ADMIN and SUPERVISOR can view all profiles
CREATE POLICY "profiles_select_admin_supervisor"
    ON profiles FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- Only ADMIN can insert profiles (user creation)
CREATE POLICY "profiles_insert_admin"
    ON profiles FOR INSERT
    WITH CHECK (user_has_role('ADMIN'));

-- ADMIN can update any profile, users can update own non-sensitive fields
CREATE POLICY "profiles_update_admin"
    ON profiles FOR UPDATE
    USING (user_has_role('ADMIN'));

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- No one can delete profiles via RLS (soft delete via is_active)

-- =============================================================
-- USER ROLES
-- =============================================================

CREATE POLICY "user_roles_select_own"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
    ON user_roles FOR SELECT
    USING (user_has_role('ADMIN'));

CREATE POLICY "user_roles_insert_admin"
    ON user_roles FOR INSERT
    WITH CHECK (user_has_role('ADMIN'));

CREATE POLICY "user_roles_delete_admin"
    ON user_roles FOR DELETE
    USING (user_has_role('ADMIN'));

-- =============================================================
-- APPROVED DEVICES
-- =============================================================

-- Users see their own devices
CREATE POLICY "devices_select_own"
    ON approved_devices FOR SELECT
    USING (user_id = auth.uid());

-- ADMIN sees all devices
CREATE POLICY "devices_select_admin"
    ON approved_devices FOR SELECT
    USING (user_has_role('ADMIN'));

-- Anyone authenticated can register (pending) their own device
CREATE POLICY "devices_insert_own"
    ON approved_devices FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Only ADMIN can approve/revoke
CREATE POLICY "devices_update_admin"
    ON approved_devices FOR UPDATE
    USING (user_has_role('ADMIN'));

-- =============================================================
-- CASES
-- =============================================================

-- ADMIN, SUPERVISOR: full read access
CREATE POLICY "cases_select_admin_supervisor"
    ON cases FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- INVESTIGATING_OFFICER: only assigned cases
CREATE POLICY "cases_select_officer"
    ON cases FOR SELECT
    USING (
        user_has_role('INVESTIGATING_OFFICER')
        AND assigned_officer_id = auth.uid()
    );

-- VAULT_CUSTODIAN, LAB_ANALYST: cases where they hold evidence
CREATE POLICY "cases_select_custodian_lab"
    ON cases FOR SELECT
    USING (
        user_has_any_role(ARRAY['VAULT_CUSTODIAN', 'LAB_ANALYST']::app_role[])
        AND id IN (
            SELECT DISTINCT case_id FROM evidence
            WHERE current_holder_id = auth.uid()
        )
    );

-- JUDGE: explicitly granted cases only
CREATE POLICY "cases_select_judge"
    ON cases FOR SELECT
    USING (
        user_has_role('JUDGE')
        AND id IN (
            SELECT case_id FROM case_judicial_access
            WHERE judge_id = auth.uid()
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > now())
        )
    );

-- AUDITOR: read all cases (read-only)
CREATE POLICY "cases_select_auditor"
    ON cases FOR SELECT
    USING (user_has_role('AUDITOR'));

-- Insert: ADMIN, SUPERVISOR
CREATE POLICY "cases_insert_admin_supervisor"
    ON cases FOR INSERT
    WITH CHECK (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- Update: ADMIN, SUPERVISOR (limited fields enforced in app layer)
CREATE POLICY "cases_update_admin_supervisor"
    ON cases FOR UPDATE
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- =============================================================
-- EVIDENCE
-- =============================================================

-- ADMIN, SUPERVISOR: all evidence
CREATE POLICY "evidence_select_admin_supervisor"
    ON evidence FOR SELECT
    USING (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

-- INVESTIGATING_OFFICER: evidence they captured or in their assigned cases
CREATE POLICY "evidence_select_officer"
    ON evidence FOR SELECT
    USING (
        user_has_role('INVESTIGATING_OFFICER')
        AND (
            captured_by = auth.uid()
            OR registered_by = auth.uid()
            OR case_id IN (
                SELECT id FROM cases WHERE assigned_officer_id = auth.uid()
            )
        )
    );

-- VAULT_CUSTODIAN: evidence they currently hold
CREATE POLICY "evidence_select_vault"
    ON evidence FOR SELECT
    USING (
        user_has_role('VAULT_CUSTODIAN')
        AND current_holder_id = auth.uid()
    );

-- LAB_ANALYST: evidence in lab states
CREATE POLICY "evidence_select_lab"
    ON evidence FOR SELECT
    USING (
        user_has_role('LAB_ANALYST')
        AND status IN ('LAB_RECEIVED', 'UNDER_ANALYSIS', 'ANALYSIS_COMPLETED')
        AND current_holder_id = auth.uid()
    );

-- JUDGE: authorized cases only
CREATE POLICY "evidence_select_judge"
    ON evidence FOR SELECT
    USING (
        user_has_role('JUDGE')
        AND case_id IN (
            SELECT case_id FROM case_judicial_access
            WHERE judge_id = auth.uid()
              AND is_active = true
        )
    );

-- AUDITOR: all evidence (read-only)
CREATE POLICY "evidence_select_auditor"
    ON evidence FOR SELECT
    USING (user_has_role('AUDITOR'));

-- INVESTIGATING_OFFICER can register/insert evidence
CREATE POLICY "evidence_insert_officer"
    ON evidence FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND registered_by = auth.uid()
    );

-- Updates via authorized roles (app layer enforces state machine)
CREATE POLICY "evidence_update_authorized"
    ON evidence FOR UPDATE
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'INVESTIGATING_OFFICER',
            'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
    );

-- =============================================================
-- EVIDENCE MEDIA
-- =============================================================

-- Media access mirrors evidence access (simplified: same roles)
CREATE POLICY "evidence_media_select_authorized"
    ON evidence_media FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)  -- RLS on evidence handles filtering
    );

CREATE POLICY "evidence_media_insert_officer"
    ON evidence_media FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND captured_by = auth.uid()
    );

-- =============================================================
-- EVIDENCE CLASSIFICATIONS
-- =============================================================

CREATE POLICY "classifications_select_authorized"
    ON evidence_classifications FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)
    );

CREATE POLICY "classifications_insert_officer"
    ON evidence_classifications FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND confirmed_by = auth.uid()
    );

-- No UPDATE/DELETE on classifications — they are immutable after creation

-- =============================================================
-- CUSTODY LOGS — APPEND ONLY
-- =============================================================

CREATE POLICY "custody_logs_select_authorized"
    ON custody_logs FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'INVESTIGATING_OFFICER',
            'VAULT_CUSTODIAN', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
        AND evidence_id IN (SELECT id FROM evidence)
    );

-- INSERT only — no UPDATE, no DELETE (enforced by not creating those policies)
CREATE POLICY "custody_logs_insert_authorized"
    ON custody_logs FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST', 'SUPERVISOR'
        ]::app_role[])
    );

-- =============================================================
-- EVIDENCE EVENTS — APPEND ONLY
-- =============================================================

CREATE POLICY "evidence_events_select_authorized"
    ON evidence_events FOR SELECT
    USING (
        evidence_id IN (SELECT id FROM evidence)
    );

CREATE POLICY "evidence_events_insert_system"
    ON evidence_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- TRANSIT TELEMETRY
-- =============================================================

-- Only the current custodian can insert telemetry
CREATE POLICY "transit_telemetry_insert_custodian"
    ON transit_telemetry FOR INSERT
    WITH CHECK (
        custodian_id = auth.uid()
        AND evidence_id IN (
            SELECT id FROM evidence
            WHERE current_holder_id = auth.uid()
              AND status = 'IN_TRANSIT'
        )
    );

-- Select: authorized roles with evidence access
CREATE POLICY "transit_telemetry_select_authorized"
    ON transit_telemetry FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'JUDGE', 'AUDITOR'
        ]::app_role[])
        OR custodian_id = auth.uid()
    );

-- =============================================================
-- VAULT LOCATIONS
-- =============================================================

CREATE POLICY "vault_locations_select_authorized"
    ON vault_locations FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'VAULT_CUSTODIAN', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "vault_locations_insert_custodian"
    ON vault_locations FOR INSERT
    WITH CHECK (
        user_has_role('VAULT_CUSTODIAN')
        AND custodian_id = auth.uid()
    );

-- =============================================================
-- LAB SAMPLES + CONSUMPTION
-- =============================================================

CREATE POLICY "lab_samples_select_authorized"
    ON lab_samples FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "lab_samples_insert_analyst"
    ON lab_samples FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND registered_by = auth.uid()
    );

CREATE POLICY "lab_samples_update_analyst"
    ON lab_samples FOR UPDATE
    USING (
        user_has_role('LAB_ANALYST')
        AND registered_by = auth.uid()
    );

CREATE POLICY "sample_consumption_select_authorized"
    ON sample_consumption FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "sample_consumption_insert_analyst"
    ON sample_consumption FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND analyst_id = auth.uid()
    );

-- =============================================================
-- LAB REPORTS
-- =============================================================

CREATE POLICY "lab_reports_select_authorized"
    ON lab_reports FOR SELECT
    USING (
        user_has_any_role(ARRAY[
            'ADMIN', 'SUPERVISOR', 'LAB_ANALYST', 'JUDGE', 'AUDITOR'
        ]::app_role[])
    );

CREATE POLICY "lab_reports_insert_analyst"
    ON lab_reports FOR INSERT
    WITH CHECK (
        user_has_role('LAB_ANALYST')
        AND analyst_id = auth.uid()
    );

-- =============================================================
-- AUDIT LOGS — APPEND ONLY (NO UPDATE, NO DELETE)
-- =============================================================

-- ADMIN, AUDITOR, SUPERVISOR can read audit logs
CREATE POLICY "audit_logs_select_authorized"
    ON audit_logs FOR SELECT
    USING (
        user_has_any_role(ARRAY['ADMIN', 'AUDITOR', 'SUPERVISOR']::app_role[])
    );

-- Any authenticated user can insert (system inserts on their behalf)
CREATE POLICY "audit_logs_insert_any"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- SUPERVISOR OVERRIDES
-- =============================================================

CREATE POLICY "supervisor_overrides_select_authorized"
    ON supervisor_overrides FOR SELECT
    USING (
        officer_id = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "supervisor_overrides_insert_officer"
    ON supervisor_overrides FOR INSERT
    WITH CHECK (
        user_has_role('INVESTIGATING_OFFICER')
        AND officer_id = auth.uid()
    );

CREATE POLICY "supervisor_overrides_update_supervisor"
    ON supervisor_overrides FOR UPDATE
    USING (
        user_has_role('SUPERVISOR')
        AND status = 'PENDING'
    );

-- =============================================================
-- QR TOKENS
-- =============================================================

CREATE POLICY "qr_tokens_select_authorized"
    ON qr_tokens FOR SELECT
    USING (
        issued_by = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "qr_tokens_insert_officer_custodian"
    ON qr_tokens FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
        AND issued_by = auth.uid()
    );

-- =============================================================
-- HANDOVER TOKENS
-- =============================================================

CREATE POLICY "handover_tokens_select_authorized"
    ON handover_tokens FOR SELECT
    USING (
        sender_id = auth.uid()
        OR used_by = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[])
    );

CREATE POLICY "handover_tokens_insert_authorized"
    ON handover_tokens FOR INSERT
    WITH CHECK (
        user_has_any_role(ARRAY[
            'INVESTIGATING_OFFICER', 'VAULT_CUSTODIAN', 'LAB_ANALYST'
        ]::app_role[])
        AND sender_id = auth.uid()
    );

-- =============================================================
-- CASE JUDICIAL ACCESS
-- =============================================================

CREATE POLICY "case_judicial_access_select"
    ON case_judicial_access FOR SELECT
    USING (
        judge_id = auth.uid()
        OR user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR', 'AUDITOR']::app_role[])
    );

CREATE POLICY "case_judicial_access_insert_admin_supervisor"
    ON case_judicial_access FOR INSERT
    WITH CHECK (user_has_any_role(ARRAY['ADMIN', 'SUPERVISOR']::app_role[]));

CREATE POLICY "case_judicial_access_update_admin"
    ON case_judicial_access FOR UPDATE
    USING (user_has_role('ADMIN'));
