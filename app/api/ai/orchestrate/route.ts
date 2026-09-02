import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FZAiOrchestrator } from '@/lib/ai/orchestrator'
import { FZAiTaskType } from '@/lib/ai/types'
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
      !hasPermission(roles, 'judicial:read') &&
      !hasPermission(roles, 'audit:read_security_events')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { task, prompt, context, case_id, evidence_id } = body as {
      task: FZAiTaskType
      prompt: string
      context?: Record<string, unknown>
      case_id?: string
      evidence_id?: string
    }

    if (!task || !prompt) {
      return NextResponse.json({ error: 'Missing required parameters: task and prompt' }, { status: 400 })
    }

    // Execute through Central FZ-AI Orchestrator
    const result = await FZAiOrchestrator.executeTask(
      task,
      prompt,
      context || {},
      user.id,
      case_id,
      evidence_id
    )

    return NextResponse.json({ success: true, finding: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
