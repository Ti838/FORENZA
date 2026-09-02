import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const manualClassifySchema = z.object({
  // AI result (optional — may be absent if AI was unavailable)
  ai_result: z.object({
    available: z.boolean(),
    object: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    confidence: z.number().optional(),
    model_version: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  // Human decision (always required)
  final_object: z.string().min(1),
  final_category: z.string().min(1),
  final_subcategory: z.string().optional(),
  final_description: z.string().optional(),
  final_notes: z.string().optional(),
  classification_method: z.enum(['AI_CONFIRMED', 'MANUAL', 'MANUAL_OVERRIDE']),
})

// POST /api/evidence/:id/classification
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:classify')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = manualClassifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify evidence exists and is in CAPTURED state
  const { data: evidence } = await supabase.from('evidence').select('id, case_id, status, registered_by').eq('id', evidenceId).single()
  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })
  if (evidence.status !== 'CAPTURED') {
    return NextResponse.json({ error: `Classification requires CAPTURED state (currently: ${evidence.status})` }, { status: 409 })
  }

  // Check if classification already exists
  const { data: existing } = await adminClient.from('evidence_classifications').select('id').eq('evidence_id', evidenceId).single()
  if (existing) {
    return NextResponse.json({ error: 'Evidence is already classified. Classifications are immutable.' }, { status: 409 })
  }

  const { ai_result, final_object, final_category, final_subcategory, final_description, final_notes, classification_method } = parsed.data

  // Validate classification_method consistency
  if (classification_method === 'AI_CONFIRMED' && !ai_result?.available) {
    return NextResponse.json({ error: 'Cannot use AI_CONFIRMED method when AI result is not available' }, { status: 422 })
  }
  if (classification_method === 'MANUAL_OVERRIDE' && !ai_result?.available) {
    return NextResponse.json({ error: 'Cannot use MANUAL_OVERRIDE when there is no AI result to override' }, { status: 422 })
  }

  const { data: classification, error } = await adminClient.from('evidence_classifications').insert({
    evidence_id: evidenceId,
    // AI fields (preserved exactly as received from AI service)
    ai_object: ai_result?.object ?? null,
    ai_category: ai_result?.category ?? null,
    ai_subcategory: ai_result?.subcategory ?? null,
    ai_confidence: ai_result?.confidence ?? null,
    ai_model_version: ai_result?.model_version ?? null,
    ai_classified_at: ai_result?.available ? new Date().toISOString() : null,
    ai_available: ai_result?.available ?? false,
    // Human-confirmed
    final_object,
    final_category,
    final_subcategory: final_subcategory ?? null,
    final_description: final_description ?? null,
    final_notes: final_notes ?? null,
    classification_method,
    confirmed_by: user.id,
    confirmed_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save classification' }, { status: 500 })

  // Evidence event
  const eventType = ai_result?.available ? 'CLASSIFIED_AI' : 'CLASSIFIED_MANUAL'
  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    event_type: eventType,
    actor_id: user.id,
    metadata: { classification_method, final_category, ai_available: ai_result?.available ?? false },
  })

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: `EVIDENCE_CLASSIFIED_${classification_method}`,
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: { classification_method, final_category, final_object },
  })

  return NextResponse.json({ data: classification, success: true }, { status: 201 })
}
