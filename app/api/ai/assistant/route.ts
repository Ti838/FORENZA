import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { AIService } from '@/lib/ai/gemini'
import { z } from 'zod'

const assistantSchema = z.object({
  case_id: z.string().uuid().optional(),
  evidence_id: z.string().uuid().optional(),
  prompt: z.string().min(2, 'Query must be at least 2 characters'),
})

// POST /api/ai/assistant
// Answers questions strictly based on user's authorized case and evidence context within RLS boundaries.
export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = assistantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { case_id, evidence_id, prompt } = parsed.data

  const authorizedContext: Record<string, unknown> = {
    user_id: user.id,
    query_timestamp: new Date().toISOString(),
  }

  // Fetch case data using user's RLS client
  if (case_id) {
    const { data: caseData } = await supabase.from('cases').select('*').eq('id', case_id).single()
    if (caseData) authorizedContext.case = caseData
  }

  // Fetch evidence data using user's RLS client
  if (evidence_id) {
    const { data: evidenceData } = await supabase
      .from('evidence')
      .select('*, case:cases(case_number, title), classification:evidence_classifications(*), custody:custody_logs(*)')
      .eq('id', evidence_id)
      .single()
    if (evidenceData) authorizedContext.evidence = evidenceData
  }

  try {
    const reply = await AIService.assistantQuery(prompt, authorizedContext)

    await createAuditLog({
      actor_id: user.id,
      category: 'EVIDENCE_MANAGEMENT',
      action: 'AI_ASSISTANT_QUERIED',
      case_id,
      evidence_id,
      success: true,
      ip_address, user_agent, request_id,
      metadata: { prompt_length: prompt.length },
    })

    return NextResponse.json({ success: true, data: { reply } })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        reply: `AI Assistant is currently offline or key not configured (${err.message}). Please consult the judicial timeline or audit logs directly.`
      }
    })
  }
}
