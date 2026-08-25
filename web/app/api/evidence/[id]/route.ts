import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { generateEvidenceHash, verifyEvidenceHash, EvidenceHashInput } from '@/lib/crypto/evidence-hash'
import { verifyCustodyChain, CustodyChainEvent } from '@/lib/crypto/custody-chain'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

async function getAuthContext(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  return { user, roles: userRoles?.map((r) => r.role as any) ?? [], supabase, adminClient }
}

// GET /api/evidence/:id
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.roles, 'evidence:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await ctx.supabase
    .from('evidence')
    .select(`
      *,
      case:cases(id, case_number, title, crime_scene_latitude, crime_scene_longitude),
      current_holder:profiles!evidence_current_holder_id_fkey(id, full_name, badge_number),
      classification:evidence_classifications(*),
      primary_media:evidence_media(id, media_type, mime_type, file_size_bytes, captured_at, is_primary)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })

  return NextResponse.json({ data })
}
