-- =============================================================
-- Migration 001: FORENZA Enumeration Types
-- =============================================================

-- Evidence lifecycle states
CREATE TYPE evidence_status AS ENUM (
    'REGISTERED',
    'CAPTURED',
    'SEALED',
    'IN_TRANSIT',
    'VAULT_STORED',
    'TRANSFERRED',
    'LAB_RECEIVED',
    'UNDER_ANALYSIS',
    'ANALYSIS_COMPLETED',
    'COURT_SUBMITTED',
    'ARCHIVED'
);

-- Classification method
CREATE TYPE classification_method AS ENUM (
    'AI_CONFIRMED',
    'MANUAL',
    'MANUAL_OVERRIDE'
);

-- Custody actions
CREATE TYPE custody_action AS ENUM (
    'CAPTURED',
    'SEALED',
    'TRANSFERRED',
    'RECEIVED',
    'VAULT_STORED',
    'LAB_RECEIVED',
    'COURT_SUBMITTED',
    'OVERRIDE'
);

-- Device registration status
CREATE TYPE device_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REVOKED'
);

-- Case lifecycle status
CREATE TYPE case_status AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'CLOSED',
    'ARCHIVED'
);

-- Application roles
CREATE TYPE app_role AS ENUM (
    'ADMIN',
    'INVESTIGATING_OFFICER',
    'SUPERVISOR',
    'VAULT_CUSTODIAN',
    'LAB_ANALYST',
    'JUDGE',
    'AUDITOR'
);

-- Media types
CREATE TYPE media_type AS ENUM (
    'PHOTO',
    'VIDEO',
    'DOCUMENT',
    'OTHER'
);

-- Override status
CREATE TYPE override_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PENDING_JUDICIAL_REVIEW'
);

-- Evidence event types
CREATE TYPE evidence_event_type AS ENUM (
    'REGISTERED',
    'CAPTURED',
    'CLASSIFIED_AI',
    'CLASSIFIED_MANUAL',
    'SEALED',
    'QR_GENERATED',
    'TRANSFER_INITIATED',
    'TRANSFER_COMPLETED',
    'TRANSIT_STARTED',
    'TRANSIT_STOPPED',
    'VAULT_RECEIVED',
    'VAULT_STORED',
    'LAB_RECEIVED',
    'SAMPLE_REGISTERED',
    'SAMPLE_CONSUMED',
    'ANALYSIS_STARTED',
    'ANALYSIS_COMPLETED',
    'REPORT_UPLOADED',
    'COURT_SUBMITTED',
    'INTEGRITY_VERIFIED',
    'INTEGRITY_FAILED',
    'ARCHIVED',
    'SUPERVISOR_OVERRIDE'
);

-- Audit event categories
CREATE TYPE audit_category AS ENUM (
    'AUTHENTICATION',
    'AUTHORIZATION',
    'CASE_MANAGEMENT',
    'EVIDENCE_MANAGEMENT',
    'CUSTODY_TRANSFER',
    'TRANSIT_TELEMETRY',
    'VAULT_OPERATIONS',
    'LAB_OPERATIONS',
    'INTEGRITY_CHECK',
    'QR_OPERATIONS',
    'ADMIN_ACTIONS',
    'SECURITY_EVENT',
    'DEVICE_MANAGEMENT',
    'REPORT_OPERATIONS',
    'JUDICIAL_ACCESS'
);
