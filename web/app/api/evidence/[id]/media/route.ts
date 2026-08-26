import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'
import { hasPermission } from '@/lib/rbac'
import { sha256Bytes } from '@/lib/crypto/evidence-hash'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
])

const ALLOWED_MEDIA_TYPES: Record<string, 'PHOTO' | 'VIDEO'> = {
  'image/jpeg': 'PHOTO', 'image/jpg': 'PHOTO',
  'image/png': 'PHOTO', 'image/webp': 'PHOTO',
  'video/mp4': 'VIDEO', 'video/quicktime': 'VIDEO', 'video/webm': 'VIDEO',
}

const MAX_PHOTO_BYTES = 50 * 1024 * 1024  // 50 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB

// POST /api/evidence/:id/media
// Accepts multipart/form-data with a single 'file' field.
// Uploads to Supabase private storage. Computes SHA-256 on server.
// Returns storage_path and file_sha256 for subsequent capture API call.
export async function POST(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:capture')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify evidence exists and is in REGISTERED state
  const { data: evidence } = await supabase.from('evidence')
    .select('id, case_id, status, registered_by')
    .eq('id', evidenceId)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })
  if (evidence.status !== 'REGISTERED') {
    return NextResponse.json({ error: `Media upload only allowed in REGISTERED state (currently: ${evidence.status})` }, { status: 409 })
  }
  if (evidence.registered_by !== user.id) {
    return NextResponse.json({ error: 'Only the registering officer can upload media' }, { status: 403 })
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided. Upload with field name "file"' }, { status: 400 })
  }

  // Validate MIME type
  const mimeType = file.type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({
      error: `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WEBP, MP4, QuickTime, WebM`
    }, { status: 415 })
  }

  const mediaType = ALLOWED_MEDIA_TYPES[mimeType]
  const maxBytes = mediaType === 'PHOTO' ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES

  // Read file bytes
  const fileBuffer = await file.arrayBuffer()
  const fileBytes = fileBuffer.byteLength

  if (fileBytes > maxBytes) {
    return NextResponse.json({
      error: `File too large: ${Math.round(fileBytes / 1024 / 1024)}MB. Maximum: ${Math.round(maxBytes / 1024 / 1024)}MB`
    }, { status: 413 })
  }

  if (fileBytes < 1024) {
    return NextResponse.json({ error: 'File appears to be empty or too small' }, { status: 400 })
  }

  // Compute SHA-256 on server — this is authoritative
  const fileSha256 = await sha256Bytes(fileBuffer)

  // Build storage path: evidence-media/{case_id}/{evidence_id}/{timestamp}_{sha256_prefix}.ext
  const bucket = process.env.SUPABASE_BUCKET_EVIDENCE_MEDIA ?? 'evidence-media'
  const ext = mimeType.split('/')[1]?.replace('quicktime', 'mov') ?? 'bin'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const storagePath = `${evidence.case_id}/${evidenceId}/${timestamp}_${fileSha256.substring(0, 12)}.${ext}`

  // Upload to Supabase private storage via admin client
  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
      metadata: {
        evidence_id: evidenceId,
        case_id: evidence.case_id,
        uploaded_by: user.id,
        file_sha256: fileSha256,
      },
    })

  if (uploadError) {
    console.error('[FORENZA MEDIA] Storage upload error:', uploadError)
    await createAuditLog({
      actor_id: user.id,
      category: 'SECURITY_EVENT',
      action: 'MEDIA_UPLOAD_FAILED',
      evidence_id: evidenceId,
      case_id: evidence.case_id,
      success: false,
      ip_address, user_agent, request_id,
      metadata: { error: uploadError.message, storage_path: storagePath },
    })
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }

  await createAuditLog({
    actor_id: user.id,
    category: 'EVIDENCE_MANAGEMENT',
    action: 'MEDIA_UPLOADED',
    evidence_id: evidenceId,
    case_id: evidence.case_id,
    success: true,
    ip_address, user_agent, request_id,
    metadata: {
      storage_path: storagePath,
      file_sha256: fileSha256,
      file_size_bytes: fileBytes,
      media_type: mediaType,
      mime_type: mimeType,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      storage_path: storagePath,
      file_sha256: fileSha256,
      file_size_bytes: fileBytes,
      media_type: mediaType,
      mime_type: mimeType,
      // Client must use these values when calling POST /api/evidence/:id/capture
    }
  }, { status: 201 })
}
