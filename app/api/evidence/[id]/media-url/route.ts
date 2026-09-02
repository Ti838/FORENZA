import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/rbac'

type Params = { params: Promise<{ id: string }> }

// GET /api/evidence/:id/media-url
// Returns a short-lived signed URL for the primary media of this evidence item.
// The URL is valid for STORAGE_SIGNED_URL_TTL_SECONDS (default 60s).
// Only roles with evidence:read permission can obtain signed URLs.
export async function GET(request: NextRequest, { params }: Params) {
  const { id: evidenceId } = await params

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRoles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id)
  const roles = userRoles?.map((r) => r.role as any) ?? []

  if (!hasPermission(roles, 'evidence:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch evidence via RLS-enforced client to ensure access control
  const { data: evidence } = await supabase.from('evidence')
    .select('id, case_id, evidence_media(id, storage_path, media_type, mime_type, is_primary, file_sha256, file_size_bytes, captured_at)')
    .eq('id', evidenceId)
    .single()

  if (!evidence) return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 })

  const mediaList = Array.isArray(evidence.evidence_media) ? evidence.evidence_media : []
  const primaryMedia = mediaList.find((m: any) => m.is_primary) ?? mediaList[0]

  if (!primaryMedia) {
    return NextResponse.json({ error: 'No media associated with this evidence' }, { status: 404 })
  }

  const bucket = process.env.SUPABASE_BUCKET_EVIDENCE_MEDIA ?? 'evidence-media'
  const ttlSeconds = parseInt(process.env.STORAGE_SIGNED_URL_TTL_SECONDS ?? '60', 10)

  // Generate signed URL via admin client (bypasses storage RLS)
  const { data: signedUrl, error: signedError } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(primaryMedia.storage_path, ttlSeconds)

  if (signedError || !signedUrl) {
    console.error('[FORENZA MEDIA] Signed URL error:', signedError)
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      signed_url: signedUrl.signedUrl,
      expires_in_seconds: ttlSeconds,
      media: {
        id: primaryMedia.id,
        media_type: primaryMedia.media_type,
        mime_type: primaryMedia.mime_type,
        file_sha256: primaryMedia.file_sha256,
        file_size_bytes: primaryMedia.file_size_bytes,
        captured_at: primaryMedia.captured_at,
      },
    }
  })
}
