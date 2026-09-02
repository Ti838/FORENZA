import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { AIService } from '@/lib/ai/gemini'

type Params = { params: Promise<{ id: string }> }

// POST /api/evidence/:id/analyze
// Uses centralized AIService (Google Gemini API) to perform structured forensic classification.
// Keys are never exposed to the client.
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

  // Fetch evidence + primary media
  const { data: evidence } = await supabase.from('evidence')
    .select('id, case_id, status, evidence_media(*)')
    .eq('id', evidenceId)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })

  if (evidence.status !== 'CAPTURED') {
    return NextResponse.json({ error: `AI analysis requires CAPTURED state (currently: ${evidence.status})` }, { status: 409 })
  }

  const mediaList = Array.isArray(evidence.evidence_media) ? evidence.evidence_media : []
  const primaryMedia = mediaList.find((m: any) => m.is_primary) ?? mediaList[0]

  if (!primaryMedia) {
    return NextResponse.json({ error: 'No media found for this evidence' }, { status: 409 })
  }

  if (!['PHOTO'].includes(primaryMedia.media_type)) {
    return NextResponse.json({
      success: true,
      data: {
        available: false,
        message: 'AI classification is image-only for MVP. Manual classification required for video evidence.',
      }
    })
  }

  // Check if already analyzed
  const { data: existingClassification } = await adminClient
    .from('evidence_classifications')
    .select('id, ai_object, ai_category, ai_confidence, ai_model_version, ai_available')
    .eq('evidence_id', evidenceId)
    .single()

  if (existingClassification) {
    return NextResponse.json({
      success: true,
      data: {
        available: existingClassification.ai_available,
        object: existingClassification.ai_object,
        category: existingClassification.ai_category,
        confidence: existingClassification.ai_confidence,
        model_version: existingClassification.ai_model_version,
        cached: true,
      }
    })
  }

  // Download media bytes server-side
  const bucket = process.env.SUPABASE_BUCKET_EVIDENCE_MEDIA ?? 'evidence-media'
  const { data: fileData, error: downloadError } = await adminClient.storage
    .from(bucket)
    .download(primaryMedia.storage_path)

  if (downloadError || !fileData) {
    await createAuditLog({
      actor_id: user.id,
      category: 'EVIDENCE_MANAGEMENT',
      action: 'AI_ANALYSIS_STORAGE_ERROR',
      evidence_id: evidenceId,
      case_id: evidence.case_id,
      success: false,
      ip_address, user_agent, request_id,
      metadata: { error: downloadError?.message },
    })
    return NextResponse.json({
      success: true,
      data: { available: false, message: 'Could not retrieve media for AI analysis. Manual classification required.' }
    })
  }

  const imageBuffer = await fileData.arrayBuffer()
  const imageBytes = new Uint8Array(imageBuffer)

  // Invoke AIService (Gemini)
  const aiResult = await AIService.classifyEvidence(imageBytes, primaryMedia.mime_type ?? 'image/jpeg')

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: aiResult.available ? 'AI_ANALYSIS_COMPLETED' : 'AI_ANALYSIS_FALLBACK',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: {
      ai_available: aiResult.available,
      ai_object: aiResult.object,
      ai_category: aiResult.category,
      ai_confidence: aiResult.confidence,
      model: aiResult.model,
      media_sha256: primaryMedia.file_sha256,
    },
  })

  return NextResponse.json({ success: true, data: aiResult })
}
