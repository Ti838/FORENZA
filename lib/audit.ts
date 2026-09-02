/**
 * FORENZA — Audit Logger
 *
 * All audit events are append-only. Never modify existing audit logs.
 * Called from Route Handlers and Server Actions only.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { AuditCategory, AppRole } from '@/types'

export interface AuditLogEntry {
  actor_id?: string
  actor_email?: string
  actor_role?: AppRole
  category: AuditCategory
  action: string
  evidence_id?: string
  case_id?: string
  target_user_id?: string
  success: boolean
  ip_address?: string
  user_agent?: string
  request_id?: string
  metadata?: Record<string, unknown>
}

/**
 * Insert a structured audit log entry.
 * Uses admin client to bypass RLS on insert.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: entry.actor_id ?? null,
      actor_email: entry.actor_email ?? null,
      actor_role: entry.actor_role ?? null,
      category: entry.category,
      action: entry.action,
      evidence_id: entry.evidence_id ?? null,
      case_id: entry.case_id ?? null,
      target_user_id: entry.target_user_id ?? null,
      success: entry.success,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
      request_id: entry.request_id ?? null,
      metadata: entry.metadata ?? {},
    })

    if (error) {
      // Audit log failure should not break the primary operation
      // but must be logged to monitoring
      console.error('[FORENZA AUDIT] Failed to write audit log:', error)
    }
  } catch (err) {
    console.error('[FORENZA AUDIT] Unexpected error writing audit log:', err)
  }
}

/**
 * Extract request metadata for audit logging.
 */
export function extractRequestMeta(request: Request): {
  ip_address: string | undefined
  user_agent: string | undefined
  request_id: string | undefined
} {
  // Extract IP from headers — DO NOT expose this to unauthorized users
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? undefined

  return {
    ip_address: ip,
    user_agent: request.headers.get('user-agent') ?? undefined,
    request_id: request.headers.get('x-request-id') ?? crypto.randomUUID(),
  }
}
