/**
 * FORENZA — Security Event Center & Incident Logging (FZ-SECURITY)
 *
 * Captures, classifies, and alerts on security and integrity violations.
 */

export type SecurityEventType =
  | 'LOGIN_FAILURE'
  | 'MFA_FAILURE'
  | 'DEVICE_REVOKED'
  | 'TOKEN_REPLAY'
  | 'HASH_MISMATCH'
  | 'SIGNATURE_FAILURE'
  | 'UNAUTHORIZED_ACCESS'
  | 'ROLE_VIOLATION'
  | 'LOCATION_CONFLICT'
  | 'CLOCK_ANOMALY'
  | 'SYNC_CONFLICT'
  | 'EVIDENCE_TAMPER'
  | 'UPLOAD_VIOLATION'
  | 'ADMIN_CHANGE'

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEventLog {
  id: string
  event_type: SecurityEventType
  severity: SecuritySeverity
  description: string
  actor_id?: string
  device_id?: string
  case_id?: string
  evidence_id?: string
  ip_address?: string
  metadata: Record<string, unknown>
  created_at: string
}

export class SecurityEventService {
  private static events: SecurityEventLog[] = []

  static logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    context?: {
      actor_id?: string
      device_id?: string
      case_id?: string
      evidence_id?: string
      ip_address?: string
      metadata?: Record<string, unknown>
    }
  ): SecurityEventLog {
    const log: SecurityEventLog = {
      id: crypto.randomUUID(),
      event_type: type,
      severity,
      description,
      actor_id: context?.actor_id,
      device_id: context?.device_id,
      case_id: context?.case_id,
      evidence_id: context?.evidence_id,
      ip_address: context?.ip_address,
      metadata: context?.metadata ?? {},
      created_at: new Date().toISOString(),
    }

    this.events.unshift(log)
    return log
  }

  static getRecentEvents(limit: number = 50): SecurityEventLog[] {
    return this.events.slice(0, limit)
  }

  static clearEvents(): void {
    this.events = []
  }
}
