import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CustodyDiscrepancyPipeline } from '@/lib/ai/pipelines/custody-discrepancy-pipeline'
import { hasPermission } from '@/lib/rbac'
import { AppRole } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roles = (userRoles?.map((r: { role: AppRole }) => r.role) ?? []) as AppRole[]
    if (!hasPermission(roles, 'evidence:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { evidence_id, case_id, primary_states, secondary_states } = body as {
      evidence_id: string
      case_id: string
      primary_states: any[]
      secondary_states: any[]
    }

    const result = await CustodyDiscrepancyPipeline.execute({
      evidenceId: evidence_id,
      caseId: case_id,
      callerId: user.id,
      primaryStateHistory: primary_states || [],
      secondaryStateHistory: secondary_states || [],
    })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
