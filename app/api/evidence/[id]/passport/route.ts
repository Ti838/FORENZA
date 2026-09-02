import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EvidencePassportService } from '@/lib/passport/evidence-passport'
import { hasPermission } from '@/lib/rbac'
import { AppRole } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Session Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch User Roles & Permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roles = (userRoles?.map((r: { role: AppRole }) => r.role) ?? []) as AppRole[]
    if (!hasPermission(roles, 'evidence:read') && !hasPermission(roles, 'judicial:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Fetch Evidence Record
    const { data: evidence, error: evError } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single()

    if (evError || !evidence) {
      return NextResponse.json({ error: 'Evidence record not found' }, { status: 404 })
    }

    // 4. Fetch Immutable States
    const { data: states } = await supabase
      .from('evidence_states')
      .select('*')
      .eq('evidence_id', id)
      .order('created_at', { ascending: true })

    // 5. Fetch Adjudications
    const { data: adjudications } = await supabase
      .from('adjudications')
      .select('*')
      .eq('evidence_id', id)
      .order('version', { ascending: true })

    // 6. Generate FZ-PASS Evidence Integrity Passport
    const passport = await EvidencePassportService.generatePassport(
      evidence.id,
      evidence.case_id,
      evidence.file_sha256 || evidence.master_hash || 'UNKNOWN_CONTENT_HASH',
      evidence.master_hash || 'UNKNOWN_METADATA_HASH',
      evidence.master_hash || 'UNKNOWN_MASTER_HASH',
      'ED25519_SEAL_SIG_ROOT',
      evidence.captured_by || 'KEY_OFFICER_DEFAULT',
      states || [],
      undefined,
      adjudications || [],
      'FORENZA_JUDICIAL_AUTHORITY'
    )

    return NextResponse.json({ passport })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
