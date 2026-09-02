import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/rbac'

// GET /api/admin/stats — Dashboard KPIs from real DB
// Returns counts for personnel, devices, cases, evidence
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'admin:manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalDevices },
    { count: pendingDevices },
    { count: approvedDevices },
    { count: totalCases },
    { count: activeCases },
    { count: totalEvidence },
    { count: sealedEvidence },
    { data: recentAuditLogs },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    adminClient.from('approved_devices').select('*', { count: 'exact', head: true }),
    adminClient.from('approved_devices').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    adminClient.from('approved_devices').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    adminClient.from('evidence').select('*', { count: 'exact', head: true }),
    adminClient.from('evidence').select('*', { count: 'exact', head: true }).eq('status', 'SEALED'),
    adminClient.from('audit_logs')
      .select('id, action, category, success, created_at, actor_id')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    data: {
      personnel: {
        total: totalUsers ?? 0,
        active: activeUsers ?? 0,
      },
      devices: {
        total: totalDevices ?? 0,
        pending: pendingDevices ?? 0,
        approved: approvedDevices ?? 0,
      },
      cases: {
        total: totalCases ?? 0,
        active: activeCases ?? 0,
      },
      evidence: {
        total: totalEvidence ?? 0,
        sealed: sealedEvidence ?? 0,
      },
      recent_audit_logs: recentAuditLogs ?? [],
      fetched_at: new Date().toISOString(),
    }
  })
}
