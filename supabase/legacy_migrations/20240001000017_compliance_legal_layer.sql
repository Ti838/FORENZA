-- =============================================================
-- FORENZA — Migration 017: Compliance, Legal Authority & Governance Layer
-- Designed with reference to ISO/IEC 27037, ISO/IEC 27038, NIST SP 800-86
-- =============================================================

-- 1. ENUMS FOR LEGAL JURISDICTION & AUTHORITY
DO $$ BEGIN
  CREATE TYPE legal_authority_type AS ENUM (
    'WARRANT',
    'COURT_ORDER',
    'CONSENT',
    'STATUTORY_AUTHORITY',
    'EMERGENCY_AUTHORITY',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE retention_status AS ENUM (
    'ACTIVE',
    'LEGAL_HOLD',
    'ARCHIVED',
    'ELIGIBLE_FOR_DISPOSITION',
    'DISPOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE data_classification_tier AS ENUM (
    'PUBLIC',
    'INTERNAL',
    'CONFIDENTIAL',
    'RESTRICTED',
    'HIGHLY_SENSITIVE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. LEGAL AUTHORIZATION METADATA TABLE
CREATE TABLE IF NOT EXISTS public.legal_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  authority_type legal_authority_type NOT NULL,
  warrant_reference TEXT,
  court_order_reference TEXT,
  authorized_by TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'DEFAULT_JURISDICTION',
  scope TEXT NOT NULL,
  authorization_timestamp TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LEGAL HOLDS & RETENTION POLICY TABLE
CREATE TABLE IF NOT EXISTS public.legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  hold_reference TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scope TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DERIVED ARTIFACTS (ISO/IEC 27037 & 27038 Original Preservation)
CREATE TABLE IF NOT EXISTS public.derived_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  derivation_method TEXT NOT NULL, -- e.g. 'REDACTION', 'OCR_EXTRACT', 'COMPRESSION_PROXY'
  tool_name TEXT NOT NULL,
  tool_version TEXT NOT NULL,
  operator_id UUID NOT NULL REFERENCES public.profiles(id),
  input_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  redaction_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SECURITY INCIDENT & INTEGRITY EVENTS
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'TAMPER_ALERT', 'UNAUTHORIZED_ACCESS', 'DECOY_TRIGGERED'
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PREVENT DELETION ON LEGAL HOLD TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_evidence_deletion_on_hold()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.legal_holds
    WHERE evidence_id = OLD.id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'CANNOT DELETE EVIDENCE: Active Legal Hold is in effect.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_evidence_deletion ON public.evidence;
CREATE TRIGGER trg_prevent_evidence_deletion
  BEFORE DELETE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_deletion_on_hold();

-- Enable RLS
ALTER TABLE public.legal_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read authorizations" ON public.legal_authorizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read legal_holds" ON public.legal_holds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read derived_artifacts" ON public.derived_artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read security_events" ON public.security_events FOR SELECT TO authenticated USING (true);
