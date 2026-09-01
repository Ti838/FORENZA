-- =============================================================
-- FORENZA — Migration 018: Next-Generation Forensic Core
-- Modules: FZ-ID, FZ-SEAL, FZ-TWIN, FZ-PROV, FZ-EPRA, FZ-DIV,
--          FZ-BRANCH, FZ-ADJ, FZ-LINEAGE, FZ-AI, FZ-PASS, FZ-VERIFY
-- =============================================================

-- 1. ENUMS FOR NEXT-GEN CORE
DO $$ BEGIN
  CREATE TYPE device_trust_status AS ENUM (
    'PENDING',
    'TRUSTED',
    'SUSPENDED',
    'REVOKED',
    'COMPROMISED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE physical_condition_status AS ENUM (
    'INTACT',
    'DAMAGED',
    'OPENED',
    'BROKEN_SEAL',
    'CONTAMINATED',
    'UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reconciliation_status AS ENUM (
    'CONSISTENT',
    'MINOR_CONFLICT',
    'SIGNIFICANT_CONFLICT',
    'CRITICAL_CONFLICT',
    'UNRESOLVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE conflict_type AS ENUM (
    'HASH_CONFLICT',
    'TIMESTAMP_CONFLICT',
    'LOCATION_CONFLICT',
    'ACTOR_CONFLICT',
    'DEVICE_CONFLICT',
    'CUSTODY_CONFLICT',
    'METADATA_CONFLICT',
    'PARENT_STATE_CONFLICT',
    'SIGNATURE_CONFLICT',
    'POLICY_CONFLICT',
    'DUPLICATE_EVENT',
    'REPLAY_EVENT',
    'ROLLBACK_ATTEMPT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE conflict_severity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE adjudication_decision AS ENUM (
    'ACCEPT_BRANCH_A',
    'ACCEPT_BRANCH_B',
    'ACCEPT_BOTH',
    'REJECT_BRANCH_A',
    'REJECT_BRANCH_B',
    'UNRESOLVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_claim_status AS ENUM (
    'SUPPORTED',
    'UNSUPPORTED',
    'REQUIRES_REVIEW'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_verdict AS ENUM (
    'PASS',
    'FAIL',
    'UNVERIFIABLE',
    'PARTIALLY_VERIFIABLE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. DEVICE TRUST & HARDWARE ATTESTATION (FZ-ID)
CREATE TABLE IF NOT EXISTS public.device_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_public_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  key_version INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'windows', 'macos', 'linux', 'web')),
  device_type TEXT NOT NULL DEFAULT 'WORKSTATION',
  device_model TEXT,
  attestation_status TEXT NOT NULL DEFAULT 'UNATTESTED',
  attestation_payload JSONB DEFAULT '{}'::jsonb,
  status device_trust_status NOT NULL DEFAULT 'PENDING',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, key_version)
);

CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key_id UUID NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  authenticated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.device_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key_id UUID NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'REGISTERED', 'ATTESTATION_VERIFIED', 'KEY_ROTATED', 'STATUS_CHANGED', 'HEARTBEAT'
  actor_id UUID REFERENCES public.profiles(id),
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. IMMUTABLE EVIDENCE STATE ENGINE (FZ-TWIN)
CREATE TABLE IF NOT EXISTS public.evidence_states (
  state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE RESTRICT,
  parent_state_id UUID REFERENCES public.evidence_states(state_id),
  event_type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  device_id TEXT NOT NULL,
  timestamp_utc TIMESTAMPTZ NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_metadata JSONB DEFAULT '{}'::jsonb,
  event_data JSONB NOT NULL,
  previous_state_hash TEXT, -- NULL only for root state E0
  event_hash TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  key_id TEXT NOT NULL,
  canonicalization_version TEXT NOT NULL DEFAULT 'RFC8785_v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_state_hash_format CHECK (state_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT chk_event_hash_format CHECK (event_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_evidence_states_evidence_id ON public.evidence_states(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_states_parent_id ON public.evidence_states(parent_state_id);
CREATE INDEX IF NOT EXISTS idx_evidence_states_state_hash ON public.evidence_states(state_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_states_created_at ON public.evidence_states(created_at);

-- 4. NON-DESTRUCTIVE BRANCHES & FIRST DIVERGENCE (FZ-DIV & FZ-BRANCH)
CREATE TABLE IF NOT EXISTS public.branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  divergence_state_id UUID NOT NULL REFERENCES public.evidence_states(state_id),
  head_state_id UUID NOT NULL REFERENCES public.evidence_states(state_id),
  source_device_id TEXT,
  source_actor_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evidence_id, branch_name)
);

CREATE TABLE IF NOT EXISTS public.divergences (
  divergence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  first_divergent_state_a UUID NOT NULL REFERENCES public.evidence_states(state_id),
  first_divergent_state_b UUID NOT NULL REFERENCES public.evidence_states(state_id),
  divergence_type conflict_type NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detection_context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.conflicts (
  conflict_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  type conflict_type NOT NULL,
  severity conflict_severity NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_states JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'ADJUDICATED', 'DISMISSED')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.adjudications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  conflict_id UUID REFERENCES public.conflicts(conflict_id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewer_device_id TEXT NOT NULL,
  decision adjudication_decision NOT NULL,
  reason TEXT NOT NULL,
  supporting_state_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  signature TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  version INTEGER NOT NULL DEFAULT 1,
  previous_adjudication_id UUID REFERENCES public.adjudications(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROVENANCE GRAPH (FZ-PROV)
CREATE TABLE IF NOT EXISTS public.provenance_nodes (
  node_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL, -- 'ORIGINAL_EVIDENCE', 'PHOTO', 'VIDEO', 'SAMPLE', 'LAB_RESULT', 'ANALYSIS_REPORT', 'EXHIBIT'
  title TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  state_id UUID REFERENCES public.evidence_states(state_id),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provenance_edges (
  edge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID NOT NULL REFERENCES public.provenance_nodes(node_id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.provenance_nodes(node_id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'DERIVED_FROM', 'EXTRACTED_FROM', 'ANALYZED_BY', 'CONTAINED_IN', 'EXHIBITED_AS'
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PHYSICAL EVIDENCE CONTAINERS, SEALS & PHOTO VERIFICATION (FZ-PHOTO & PHYSICAL)
CREATE TABLE IF NOT EXISTS public.containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_code TEXT NOT NULL UNIQUE,
  container_type TEXT NOT NULL, -- 'ANTI_STATIC_BAG', 'EVIDENCE_BOX', 'KRAFT_ENVELOPE', 'DRY_STORAGE_TUBE', 'COOL_BOX'
  description TEXT,
  current_location TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seal_number TEXT NOT NULL UNIQUE,
  container_id UUID REFERENCES public.containers(id) ON DELETE SET NULL,
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  seal_type TEXT NOT NULL DEFAULT 'TAMPER_EVIDENT_TAPE',
  applied_by UUID NOT NULL REFERENCES public.profiles(id),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  broken_by UUID REFERENCES public.profiles(id),
  broken_at TIMESTAMPTZ,
  broken_reason TEXT,
  status TEXT NOT NULL DEFAULT 'INTACT' CHECK (status IN ('INTACT', 'BROKEN', 'REPLACED', 'VOIDED'))
);

CREATE TABLE IF NOT EXISTS public.evidence_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  event_id UUID,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  device_id TEXT NOT NULL,
  condition physical_condition_status NOT NULL,
  notes TEXT,
  photo_storage_path TEXT,
  photo_hash TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. RECURSIVE LAB SAMPLE LINEAGE (FZ-LINEAGE)
CREATE TABLE IF NOT EXISTS public.sample_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  parent_sample_id UUID REFERENCES public.sample_lineage(id),
  sample_code TEXT NOT NULL UNIQUE,
  unit_of_measure TEXT NOT NULL DEFAULT 'mg',
  original_quantity DECIMAL(12, 4) NOT NULL CHECK (original_quantity > 0),
  allocated_quantity DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  consumed_quantity DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (consumed_quantity >= 0),
  remaining_quantity DECIMAL(12, 4) GENERATED ALWAYS AS (original_quantity - consumed_quantity) STORED,
  preparation_method TEXT,
  custodian_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. AI PROVENANCE & CLAIM VALIDATION (FZ-AI)
CREATE TABLE IF NOT EXISTS public.ai_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id),
  evidence_id UUID REFERENCES public.evidence(id),
  provider TEXT NOT NULL DEFAULT 'google_gemini',
  model_name TEXT NOT NULL,
  model_version TEXT,
  input_hash TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  execution_duration_ms INTEGER,
  caller_id UUID NOT NULL REFERENCES public.profiles(id),
  review_status TEXT NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW' CHECK (review_status IN ('PENDING_HUMAN_REVIEW', 'CONFIRMED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.ai_runs(run_id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  source_evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status ai_claim_status NOT NULL DEFAULT 'REQUIRES_REVIEW',
  reviewer_id UUID REFERENCES public.profiles(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. EVIDENCE INTEGRITY PASSPORTS & VERIFICATION (FZ-PASS & FZ-VERIFY)
CREATE TABLE IF NOT EXISTS public.verification_passports (
  passport_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  manifest_version TEXT NOT NULL DEFAULT 'FZ-PASS-v1',
  passport_hash TEXT NOT NULL UNIQUE,
  passport_payload JSONB NOT NULL,
  generated_by UUID NOT NULL REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.verification_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id UUID REFERENCES public.verification_passports(passport_id) ON DELETE SET NULL,
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
  verifier_identity TEXT NOT NULL,
  verdict verification_verdict NOT NULL,
  content_integrity BOOLEAN NOT NULL,
  state_integrity BOOLEAN NOT NULL,
  signature_integrity BOOLEAN NOT NULL,
  custody_integrity BOOLEAN NOT NULL,
  provenance_integrity BOOLEAN NOT NULL,
  branch_integrity BOOLEAN NOT NULL,
  adjudication_integrity BOOLEAN NOT NULL,
  temporal_integrity BOOLEAN NOT NULL,
  verification_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. EXTERNAL TRUST ANCHORS
CREATE TABLE IF NOT EXISTS public.timestamp_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
  state_id UUID REFERENCES public.evidence_states(state_id),
  anchor_type TEXT NOT NULL DEFAULT 'RFC3161',
  anchor_provider TEXT NOT NULL,
  merkle_root_hash TEXT NOT NULL,
  proof_token TEXT NOT NULL,
  anchored_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. IMMUTABILITY TRIGGERS FOR NEXT-GEN TABLES
CREATE OR REPLACE FUNCTION public.prevent_evidence_states_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'FORENZA IMMUTABILITY VIOLATION: evidence_states rows are strictly append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_evidence_states_modification ON public.evidence_states;
CREATE TRIGGER trg_prevent_evidence_states_modification
  BEFORE UPDATE OR DELETE ON public.evidence_states
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_states_modification();

CREATE OR REPLACE FUNCTION public.prevent_adjudications_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'FORENZA IMMUTABILITY VIOLATION: adjudications rows are immutable. A new version must be appended instead of modifying historical decisions.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_adjudications_modification ON public.adjudications;
CREATE TRIGGER trg_prevent_adjudications_modification
  BEFORE UPDATE OR DELETE ON public.adjudications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_adjudications_modification();

-- 12. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjudications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provenance_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provenance_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_proofs ENABLE ROW LEVEL SECURITY;

-- 13. RLS POLICIES FOR NEXT-GEN TABLES
CREATE POLICY "Allow authenticated read on evidence_states" ON public.evidence_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on evidence_states" ON public.evidence_states FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on device_keys" ON public.device_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage device_keys" ON public.device_keys FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on device_sessions" ON public.device_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage device_sessions" ON public.device_sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on conflicts" ON public.conflicts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage conflicts" ON public.conflicts FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on adjudications" ON public.adjudications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on adjudications" ON public.adjudications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on provenance_nodes" ON public.provenance_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on provenance_nodes" ON public.provenance_nodes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on provenance_edges" ON public.provenance_edges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on provenance_edges" ON public.provenance_edges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on containers" ON public.containers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage containers" ON public.containers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on seals" ON public.seals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage seals" ON public.seals FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on evidence_conditions" ON public.evidence_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on evidence_conditions" ON public.evidence_conditions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on sample_lineage" ON public.sample_lineage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage sample_lineage" ON public.sample_lineage FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on ai_runs" ON public.ai_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on ai_runs" ON public.ai_runs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on ai_claims" ON public.ai_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage ai_claims" ON public.ai_claims FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on verification_passports" ON public.verification_passports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on verification_passports" ON public.verification_passports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on verification_results" ON public.verification_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on verification_results" ON public.verification_results FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on timestamp_proofs" ON public.timestamp_proofs FOR SELECT TO authenticated USING (true);
