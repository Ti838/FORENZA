import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/rbac'

// GET /api/audit — query immutable audit logs with pagination and filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'audit:read')) {
    return NextResponse.json({ error: 'Forbidden — AUDITOR or ADMIN only' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '50', 10), 200)
  const category = url.searchParams.get('category')
  const successParam = url.searchParams.get('success')
  const evidenceId = url.searchParams.get('evidence_id')
  const caseId = url.searchParams.get('case_id')
  const format = url.searchParams.get('format') // 'json' | 'jsonl'

  let query = adminClient
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      actor_email,
      actor_role,
      category,
      action,
      evidence_id,
      case_id,
      target_user_id,
      success,
      ip_address,
      user_agent,
      request_id,
      metadata,
      created_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (category && category !== 'ALL') query = query.eq('category', category)
  if (successParam !== null && successParam !== undefined && successParam !== 'ALL') {
    query = query.eq('success', successParam === 'true')
  }
  if (evidenceId) query = query.eq('evidence_id', evidenceId)
  if (caseId) query = query.eq('case_id', caseId)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit records' }, { status: 500 })
  }

  if (format === 'jsonl') {
    const jsonl = (data ?? []).map((row) => JSON.stringify(row)).join('\n')
    return new Response(jsonl, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="forenza-audit-${new Date().toISOString().slice(0, 10)}.jsonl"`,
      },
    })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
  })
}
