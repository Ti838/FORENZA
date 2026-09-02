import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

const deviceActionSchema = z.object({
  device_id: z.string().uuid(),
  action: z.enum(['APPROVE', 'REVOKE']),
  notes: z.string().optional(),
})

// GET /api/admin/devices — List all devices with user profile info
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'admin:manage_devices')) {
    return NextResponse.json({ error: 'Forbidden — ADMIN only' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') // 'PENDING' | 'APPROVED' | 'REVOKED'
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '50', 10), 200)

  let query = adminClient
    .from('approved_devices')
    .select(`
      id,
      user_id,
      device_identifier,
      device_name,
      platform,
      status,
      approved_at,
      approved_by,
      last_seen_at,
      device_metadata,
      created_at,
      profile:profiles!approved_devices_user_id_fkey(
        id, full_name, email, badge_number, department
      ),
      approver:profiles!approved_devices_approved_by_fkey(
        id, full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[FORENZA ADMIN] Devices query error:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, page, per_page: perPage })
}

// POST /api/admin/devices — Approve or Revoke a device
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'admin:manage_devices')) {
    return NextResponse.json({ error: 'Forbidden — ADMIN only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = deviceActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { device_id, action } = parsed.data

  const { data: device } = await adminClient
    .from('approved_devices')
    .select('id, user_id, status, device_name, device_identifier')
    .eq('id', device_id)
    .single()

  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REVOKED'

  if (device.status === newStatus) {
    return NextResponse.json({ error: `Device is already ${newStatus}` }, { status: 409 })
  }

  const updatePayload: Record<string, unknown> = { status: newStatus }
  if (action === 'APPROVE') {
    updatePayload.approved_at = new Date().toISOString()
    updatePayload.approved_by = user.id
  }

  const { error: updateError } = await adminClient
    .from('approved_devices')
    .update(updatePayload)
    .eq('id', device_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }

  // If revoking, also revoke all active Supabase sessions for that user
  if (action === 'REVOKE') {
    try {
      await adminClient.auth.admin.signOut(device.user_id)
    } catch (err) {
      console.error('[FORENZA ADMIN] Failed to revoke sessions for user:', device.user_id, err)
    }
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'DEVICE_MANAGEMENT',
    action: `DEVICE_${action}D`,
    target_user_id: device.user_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { device_id, device_name: device.device_name, device_identifier: device.device_identifier, new_status: newStatus },
  })

  return NextResponse.json({
    success: true,
    data: { device_id, new_status: newStatus, acted_by: user.id },
  })
}
