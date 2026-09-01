-- =============================================================
-- Migration 016: Supabase Storage Buckets Setup
-- Sets up private buckets for evidence-media, lab-reports, court-dossiers
-- =============================================================

-- Insert storage buckets (all private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('evidence-media', 'evidence-media', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']),
    ('lab-reports', 'lab-reports', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('court-dossiers', 'court-dossiers', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies
-- Objects in evidence-media: read only by authenticated users with evidence:read permission
CREATE POLICY "evidence_media_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'evidence-media');

CREATE POLICY "evidence_media_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'evidence-media');

-- Lab reports: read/insert by authenticated users
CREATE POLICY "lab_reports_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'lab-reports');

CREATE POLICY "lab_reports_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'lab-reports');

-- Court dossiers: read/insert by authenticated users
CREATE POLICY "court_dossiers_authenticated_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'court-dossiers');

CREATE POLICY "court_dossiers_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'court-dossiers');
