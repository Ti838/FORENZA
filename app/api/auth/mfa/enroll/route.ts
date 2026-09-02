import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'

/**
 * POST /api/auth/mfa/enroll
 * Enroll user in TOTP MFA (Supabase native TOTP).
 * Returns: totp_uri, qr_code (data URL), secret for manual entry.
 */
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enroll TOTP factor via Supabase Auth
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'FORENZA Forensic Platform',
  })

  if (error || !data) {
    await createAuditLog({
      actor_id: user.id,
      actor_email: user.email,
      category: 'AUTHENTICATION',
      action: 'MFA_ENROLL_FAILED',
      success: false,
      ip_address, user_agent, request_id,
      metadata: { error: error?.message },
    })
    return NextResponse.json({ error: 'MFA enrollment failed', details: error?.message }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id,
    actor_email: user.email,
    category: 'AUTHENTICATION',
    action: 'MFA_ENROLL_INITIATED',
    success: true,
    ip_address, user_agent, request_id,
    metadata: { factor_id: data.id, factor_type: data.type },
  })

  return NextResponse.json({
    success: true,
    data: {
      factor_id: data.id,
      type: data.type,
      totp: data.totp,  // { qr_code, secret, uri }
    },
  })
}
