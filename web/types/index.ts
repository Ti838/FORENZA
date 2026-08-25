// =============================================================
// FORENZA — Shared TypeScript Types
// =============================================================

// ---------------------------------------------------------------------------
// Enums (mirror the PostgreSQL ENUMs)
// ---------------------------------------------------------------------------

export type EvidenceStatus =
  | 'REGISTERED'
  | 'CAPTURED'
  | 'SEALED'
  | 'IN_TRANSIT'
  | 'VAULT_STORED'
  | 'TRANSFERRED'
  | 'LAB_RECEIVED'
  | 'UNDER_ANALYSIS'
  | 'ANALYSIS_COMPLETED'
  | 'COURT_SUBMITTED'
  | 'ARCHIVED'

export type ClassificationMethod = 'AI_CONFIRMED' | 'MANUAL' | 'MANUAL_OVERRIDE'

export type CustodyAction =
  | 'CAPTURED'
  | 'SEALED'
  | 'TRANSFERRED'
  | 'RECEIVED'
  | 'VAULT_STORED'
  | 'LAB_RECEIVED'
  | 'COURT_SUBMITTED'
  | 'OVERRIDE'

export type DeviceStatus = 'PENDING' | 'APPROVED' | 'REVOKED'

export type CaseStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'ARCHIVED'

export type AppRole =
  | 'ADMIN'
  | 'INVESTIGATING_OFFICER'
  | 'SUPERVISOR'
  | 'VAULT_CUSTODIAN'
  | 'LAB_ANALYST'
  | 'JUDGE'
  | 'AUDITOR'

export type MediaType = 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'OTHER'

export type OverrideStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING_JUDICIAL_REVIEW'

export type EvidenceEventType =
  | 'REGISTERED'
  | 'CAPTURED'
  | 'CLASSIFIED_AI'
  | 'CLASSIFIED_MANUAL'
  | 'SEALED'
  | 'QR_GENERATED'
  | 'TRANSFER_INITIATED'
  | 'TRANSFER_COMPLETED'
  | 'TRANSIT_STARTED'
  | 'TRANSIT_STOPPED'
  | 'VAULT_RECEIVED'
  | 'VAULT_STORED'
  | 'LAB_RECEIVED'
  | 'SAMPLE_REGISTERED'
  | 'SAMPLE_CONSUMED'
  | 'ANALYSIS_STARTED'
  | 'ANALYSIS_COMPLETED'
  | 'REPORT_UPLOADED'
  | 'COURT_SUBMITTED'
  | 'INTEGRITY_VERIFIED'
  | 'INTEGRITY_FAILED'
  | 'ARCHIVED'
  | 'SUPERVISOR_OVERRIDE'

export type AuditCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'CASE_MANAGEMENT'
  | 'EVIDENCE_MANAGEMENT'
  | 'CUSTODY_TRANSFER'
  | 'TRANSIT_TELEMETRY'
  | 'VAULT_OPERATIONS'
  | 'LAB_OPERATIONS'
  | 'INTEGRITY_CHECK'
  | 'QR_OPERATIONS'
  | 'ADMIN_ACTIONS'
  | 'SECURITY_EVENT'
  | 'DEVICE_MANAGEMENT'
  | 'REPORT_OPERATIONS'
  | 'JUDICIAL_ACCESS'

// ---------------------------------------------------------------------------
// Database Row Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  email: string
  full_name: string
  badge_number: string | null
  department: string | null
  phone: string | null
  is_active: boolean
  mfa_enabled: boolean
  last_login_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ApprovedDevice {
  id: string
  user_id: string
  device_identifier: string
  device_name: string
  platform: 'ios' | 'android' | 'web'
  status: DeviceStatus
  approved_at: string | null
  approved_by: string | null
  last_seen_at: string | null
  device_metadata: Record<string, unknown>
  created_at: string
}

export interface Case {
  id: string
  case_number: string
  title: string
  crime_type: string
  description: string | null
  crime_scene_latitude: number | null
  crime_scene_longitude: number | null
  incident_datetime: string | null
  assigned_officer_id: string | null
  status: CaseStatus
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  assigned_officer?: Pick<Profile, 'id' | 'full_name' | 'badge_number'>
}

export interface Evidence {
  id: string
  case_id: string
  evidence_number: string
  status: EvidenceStatus
  current_holder_id: string | null
  captured_by: string | null
  captured_at: string | null
  capture_latitude: number | null
  capture_longitude: number | null
  capture_gps_accuracy: number | null
  capture_compass_heading: number | null
  capture_distance_meters: number | null
  geofence_verified: boolean | null
  geofence_override_id: string | null
  master_hash: string | null
  hash_algorithm: string
  registered_by: string
  created_at: string
  updated_at: string
  // Joined fields
  case?: Pick<Case, 'id' | 'case_number' | 'title'>
  classification?: EvidenceClassification
  current_holder?: Pick<Profile, 'id' | 'full_name' | 'badge_number'>
  primary_media?: EvidenceMedia
}

export interface EvidenceMedia {
  id: string
  evidence_id: string
  media_type: MediaType
  mime_type: string
  storage_path: string
  file_size_bytes: number
  file_sha256: string
  original_filename: string | null
  width_px: number | null
  height_px: number | null
  duration_seconds: number | null
  captured_by: string
  captured_at: string
  is_primary: boolean
  created_at: string
  // Runtime field — not stored
  signed_url?: string
}

export interface EvidenceClassification {
  id: string
  evidence_id: string
  // AI results
  ai_object: string | null
  ai_category: string | null
  ai_subcategory: string | null
  ai_confidence: number | null
  ai_model_version: string | null
  ai_classified_at: string | null
  ai_available: boolean
  // Human-confirmed
  final_object: string
  final_category: string
  final_subcategory: string | null
  final_description: string | null
  final_notes: string | null
  classification_method: ClassificationMethod
  confirmed_by: string
  confirmed_at: string
  created_at: string
}

export interface CustodyLog {
  id: string
  evidence_id: string
  action: CustodyAction
  sender_id: string | null
  receiver_id: string | null
  previous_hash: string | null
  current_hash: string
  latitude: number | null
  longitude: number | null
  location_accuracy: number | null
  notes: string | null
  canonical_data: Record<string, unknown>
  created_at: string
  // Joined
  sender?: Pick<Profile, 'id' | 'full_name' | 'badge_number'>
  receiver?: Pick<Profile, 'id' | 'full_name' | 'badge_number'>
}

export interface EvidenceEvent {
  id: string
  evidence_id: string
  case_id: string
  event_type: EvidenceEventType
  actor_id: string
  latitude: number | null
  longitude: number | null
  from_status: EvidenceStatus | null
  to_status: EvidenceStatus | null
  metadata: Record<string, unknown>
  notes: string | null
  created_at: string
  // Joined
  actor?: Pick<Profile, 'id' | 'full_name' | 'badge_number'>
}

export interface TransitTelemetry {
  id: string
  evidence_id: string
  custodian_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  altitude: number | null
  speed: number | null
  heading: number | null
  captured_at: string
  sequence_number: number
  received_at: string
}

export interface VaultLocation {
  id: string
  evidence_id: string
  vault_id: string
  rack: string | null
  shelf: string | null
  bin: string | null
  location_label: string
  stored_at: string
  custodian_id: string
  notes: string | null
  created_at: string
}

export interface LabSample {
  id: string
  evidence_id: string
  sample_number: string
  description: string
  quantity_unit: string
  initial_quantity: number
  consumed_quantity: number
  remaining_quantity: number
  registered_by: string
  registered_at: string
  notes: string | null
  created_at: string
}

export interface SampleConsumption {
  id: string
  sample_id: string
  evidence_id: string
  consumed_amount: number
  purpose: string
  analyst_id: string
  consumed_at: string
  notes: string | null
  created_at: string
}

export interface LabReport {
  id: string
  evidence_id: string
  version: number
  title: string
  storage_path: string
  file_sha256: string
  file_size_bytes: number
  mime_type: string
  analyst_id: string
  is_final: boolean
  notes: string | null
  created_at: string
  // Runtime
  signed_url?: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  actor_role: AppRole | null
  category: AuditCategory
  action: string
  evidence_id: string | null
  case_id: string | null
  target_user_id: string | null
  success: boolean
  request_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface SupervisorOverride {
  id: string
  evidence_id: string
  case_id: string
  officer_id: string
  capture_latitude: number
  capture_longitude: number
  crime_scene_latitude: number | null
  crime_scene_longitude: number | null
  distance_meters: number
  reason: string
  supervisor_id: string | null
  status: OverrideStatus
  decision_notes: string | null
  decided_at: string | null
  created_at: string
}

export interface QrToken {
  id: string
  evidence_id: string
  token_hash: string
  issued_at: string
  expires_at: string
  issued_by: string
  last_scanned_at: string | null
  scan_count: number
  is_revoked: boolean
}

// ---------------------------------------------------------------------------
// API Request / Response Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// Auth
export interface LoginRequest {
  email: string
  password: string
  device_identifier: string
  device_name: string
  platform: 'ios' | 'android' | 'web'
}

export interface MfaVerifyRequest {
  code: string
  session_id: string
}

export interface SessionUser {
  id: string
  email: string
  full_name: string
  roles: AppRole[]
  mfa_enabled: boolean
  is_active: boolean
}

// Cases
export interface CreateCaseRequest {
  case_number: string
  title: string
  crime_type: string
  description?: string
  crime_scene_latitude?: number
  crime_scene_longitude?: number
  incident_datetime?: string
  assigned_officer_id?: string
}

// Evidence
export interface RegisterEvidenceRequest {
  case_id: string
  evidence_number: string
}

export interface CaptureEvidenceRequest {
  evidence_id: string
  timestamp_utc: string
  latitude: number
  longitude: number
  gps_accuracy: number
  compass_heading?: number
  media_type: MediaType
  mime_type: string
  file_size_bytes: number
  file_sha256: string
  storage_path: string
  geofence_verified: boolean
  capture_distance_meters: number
  override_id?: string
}

// Classification
export interface AIClassificationResult {
  available: boolean
  object?: string
  category?: string
  subcategory?: string
  confidence?: number
  model_version?: string
  message?: string
}

export interface ConfirmClassificationRequest {
  evidence_id: string
  // AI data (passed through even if overriding)
  ai_result?: AIClassificationResult
  // Human decision
  final_object: string
  final_category: string
  final_subcategory?: string
  final_description?: string
  final_notes?: string
  classification_method: ClassificationMethod
}

// Integrity
export interface IntegrityResult {
  evidence_id: string
  overall_status: 'INTEGRITY_VERIFIED' | 'COMPROMISED_TAMPERED'
  evidence_hash: {
    status: 'VERIFIED' | 'FAILED'
    stored_hash: string
    calculated_hash: string
    match: boolean
  }
  custody_chain: {
    status: 'VERIFIED' | 'BROKEN'
    total_events: number
    broken_event_id?: string
    expected_hash?: string
    calculated_hash?: string
    failure_reason?: string
  }
  report_hashes: Array<{
    report_id: string
    version: number
    status: 'VERIFIED' | 'FAILED'
    stored_hash: string
  }>
  verified_at: string
  verified_by: string
}

// Telemetry
export interface TelemetrySubmission {
  evidence_id: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  captured_at: string
  sequence_number: number
}

// Transfer
export interface TransferInitiateRequest {
  evidence_id: string
  notes?: string
}

export interface TransferReceiveRequest {
  handover_token: string
  evidence_id: string
  latitude?: number
  longitude?: number
}

// Vault
export interface VaultReceiveRequest {
  evidence_id: string
  handover_token: string
  vault_id: string
  rack?: string
  shelf?: string
  bin?: string
  notes?: string
}

// Lab
export interface LabReceiveRequest {
  evidence_id: string
  handover_token: string
  notes?: string
}

export interface RegisterSampleRequest {
  evidence_id: string
  sample_number: string
  description: string
  quantity_unit: string
  initial_quantity: number
  notes?: string
}

export interface ConsumeSampleRequest {
  sample_id: string
  consumed_amount: number
  purpose: string
  notes?: string
}
