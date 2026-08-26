import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { AIService } from '@/lib/ai/gemini'
import { z } from 'zod'

const compareSchema = z.object({
  evidence_id: z.string().uuid(),
  officer_description: z.string().min(1),
  lab_report_text: z.string().min(1),
})

// POST /api/ai/compare-reports
// Cross-compares initial officer field description with lab findings using Gemini.
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'judicial:read') && !hasPermission(roles, 'lab:upload_report')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = compareSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { evidence_id, officer_description, lab_report_text } = parsed.data

  const result = await AIService.compareOfficerAndLabReport(officer_description, lab_report_text)

  await createAuditLog({
    actor_id: user.id,
    category: 'INTEGRITY_CHECK',
    action: 'REPORT_DISCREPANCY_CHECKED',
    evidence_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: {
      verdict: result.verdict,
      severity: result.severity,
      reasons: result.reasons,
    },
  })

  return NextResponse.json({ success: true, data: result })
}
