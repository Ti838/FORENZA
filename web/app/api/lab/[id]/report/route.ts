import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { sha256Bytes } from '@/lib/crypto/evidence-hash'

type Params = { params: Promise<{ id: string }> }

const MAX_REPORT_BYTES = 50 * 1024 * 1024 // 50 MB

// POST /api/lab/:id/report — Upload a lab report PDF to Supabase Storage
// Accepts multipart/form-data: file (PDF/DOCX), title (string), is_final (boolean), notes (optional)
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'lab:upload_report')) {
    return NextResponse.json({ error: 'Forbidden — LAB_ANALYST only' }, { status: 403 })
  }

  const { data: evidence } = await adminClient.from('evidence')
    .select('id, case_id, status, current_holder_id').eq('id', evidenceId).single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })

  if (!['UNDER_ANALYSIS', 'LAB_RECEIVED', 'ANALYSIS_COMPLETED'].includes(evidence.status)) {
    return NextResponse.json({ error: `Report upload requires lab status (currently: ${evidence.status})` }, { status: 409 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const isFinal = formData.get('is_final') === 'true'
  const notes = formData.get('notes') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'Report title is required' }, { status: 400 })

  const ALLOWED_REPORT_MIMES = new Set([
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])

  if (!ALLOWED_REPORT_MIMES.has(file.type)) {
    return NextResponse.json({ error: 'Only PDF and Word documents are allowed for lab reports' }, { status: 415 })
  }

  const fileBuffer = await file.arrayBuffer()
  const fileBytes = fileBuffer.byteLength

  if (fileBytes > MAX_REPORT_BYTES) {
    return NextResponse.json({ error: `File too large: ${Math.round(fileBytes / 1024 / 1024)}MB. Maximum 50MB.` }, { status: 413 })
  }

  // Server-side SHA-256 of report — authoritative
  const fileSha256 = await sha256Bytes(fileBuffer)

  // Determine report version (increment from existing)
  const { data: existingReports } = await adminClient.from('lab_reports')
    .select('version').eq('evidence_id', evidenceId).order('version', { ascending: false }).limit(1)
  const newVersion = (existingReports?.[0]?.version ?? 0) + 1

  const bucket = process.env.SUPABASE_BUCKET_LAB_REPORTS ?? 'lab-reports'
  const ext = file.type === 'application/pdf' ? 'pdf' : 'docx'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const storagePath = `${evidence.case_id}/${evidenceId}/v${newVersion}_${timestamp}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
      metadata: {
        evidence_id: evidenceId,
        case_id: evidence.case_id,
        analyst_id: user.id,
        file_sha256: fileSha256,
        version: String(newVersion),
      },
    })

  if (uploadError) {
    console.error('[FORENZA LAB] Report upload error:', uploadError)
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }

  const { data: report, error: reportError } = await adminClient.from('lab_reports').insert({
    evidence_id: evidenceId,
    version: newVersion,
    title: title.trim(),
    storage_path: storagePath,
    file_sha256: fileSha256,
    file_size_bytes: fileBytes,
    mime_type: file.type,
    analyst_id: user.id,
    is_final: isFinal,
    notes: notes ?? null,
  }).select().single()

  if (reportError || !report) {
    return NextResponse.json({ error: 'Failed to record report metadata' }, { status: 500 })
  }

  // If final, update evidence status to ANALYSIS_COMPLETED
  if (isFinal && evidence.status === 'UNDER_ANALYSIS') {
    await adminClient.from('evidence').update({ status: 'ANALYSIS_COMPLETED' }).eq('id', evidenceId)
    await adminClient.from('evidence_events').insert({
      evidence_id: evidenceId, case_id: evidence.case_id, event_type: 'ANALYSIS_COMPLETED',
      actor_id: user.id, from_status: 'UNDER_ANALYSIS', to_status: 'ANALYSIS_COMPLETED',
      metadata: { report_id: report.id, report_version: newVersion },
    })
  }

  await adminClient.from('evidence_events').insert({
    evidence_id: evidenceId, case_id: evidence.case_id, event_type: 'REPORT_UPLOADED',
    actor_id: user.id, metadata: { report_id: report.id, version: newVersion, is_final: isFinal, file_sha256: fileSha256 },
  })

  await createAuditLog({
    actor_id: user.id, category: 'REPORT_OPERATIONS', action: 'LAB_REPORT_UPLOADED',
    evidence_id: evidenceId, case_id: evidence.case_id, success: true,
    ip_address, user_agent, request_id,
    metadata: { report_id: report.id, version: newVersion, is_final: isFinal, file_sha256: fileSha256, file_size_bytes: fileBytes },
  })

  return NextResponse.json({ success: true, data: report }, { status: 201 })
}

// GET /api/lab/:id/report — List all lab reports for evidence (with signed URLs)
export async function GET(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'lab:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: reports, error } = await adminClient.from('lab_reports')
    .select('*')
    .eq('evidence_id', evidenceId)
    .order('version', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })

  const bucket = process.env.SUPABASE_BUCKET_LAB_REPORTS ?? 'lab-reports'
  const ttl = parseInt(process.env.STORAGE_SIGNED_URL_TTL_SECONDS ?? '60', 10)

  // Attach signed URLs to each report
  const reportsWithUrls = await Promise.all((reports ?? []).map(async (r: any) => {
    const { data: signed } = await adminClient.storage.from(bucket).createSignedUrl(r.storage_path, ttl)
    return { ...r, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ data: reportsWithUrls })
}
