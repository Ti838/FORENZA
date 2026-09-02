import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIHumanReviewService, ReviewAction } from '@/lib/ai/human-review'
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
    if (
      !hasPermission(roles, 'evidence:read') &&
      !hasPermission(roles, 'judicial:read')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      finding_id,
      run_id,
      action,
      original_ai_output,
      human_modified_version,
      review_notes,
    } = body as {
      finding_id: string
      run_id: string
      action: ReviewAction
      original_ai_output: unknown
      human_modified_version?: string
      review_notes?: string
    }

    const reviewRecord = AIHumanReviewService.recordReview(
      finding_id,
      run_id,
      user.id,
      roles[0] || 'INVESTIGATING_OFFICER',
      action,
      original_ai_output,
      human_modified_version,
      review_notes
    )

    // Update status in ai_runs table if run_id exists
    if (run_id) {
      const dbStatus = action === 'REJECT' ? 'REJECTED' : 'CONFIRMED'
      await supabase
        .from('ai_runs')
        .update({ review_status: dbStatus })
        .eq('run_id', run_id)
    }

    return NextResponse.json({ success: true, review: reviewRecord })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
