import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { z } from 'zod'

const verifySchema = z.object({
  factor_id: z.string().min(1),
  code: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d{6}$/, 'TOTP code must be numeric'),
  challenge_id: z.string().optional(),
})

/**
 * POST /api/auth/mfa/verify
 * Verify TOTP code during MFA challenge.
 * On success: marks session as AAL2.
 */
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { factor_id, code } = parsed.data

  // Create a new challenge for this factor
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor_id,
  })

  if (challengeError || !challengeData) {
    return NextResponse.json({ error: 'Failed to create MFA challenge', details: challengeError?.message }, { status: 500 })
  }

  // Verify the TOTP code
  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor_id,
    challengeId: challengeData.id,
    code,
  })

  if (verifyError || !verifyData) {
    await createAuditLog({
      actor_id: user.id,
      actor_email: user.email,
      category: 'AUTHENTICATION',
      action: 'MFA_VERIFICATION_FAILED',
      success: false,
      ip_address, user_agent, request_id,
      metadata: { factor_id, error: verifyError?.message },
    })
    return NextResponse.json({ error: 'Invalid MFA code', details: verifyError?.message }, { status: 401 })
  }

  // Update profiles table to mark MFA as enabled
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()
  await adminClient.from('profiles').update({ mfa_enabled: true }).eq('id', user.id)

  await createAuditLog({
    actor_id: user.id,
    actor_email: user.email,
    category: 'AUTHENTICATION',
    action: 'MFA_VERIFIED',
    success: true,
    ip_address, user_agent, request_id,
    metadata: { factor_id },
  })

  return NextResponse.json({
    success: true,
    data: {
      ...verifyData,
      assurance_level: 'aal2',
    },
  })
}
