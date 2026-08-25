import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const [{ data: profile }, { data: userRoles }] = await Promise.all([
    adminClient.from('profiles').select('id, email, full_name, is_active, mfa_enabled, badge_number, department').eq('id', user.id).single(),
    adminClient.from('user_roles').select('role').eq('user_id', user.id),
  ])

  if (!profile?.is_active) {
    return NextResponse.json({ authenticated: false, error: 'Account inactive' }, { status: 403 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: profile.email,
      full_name: profile.full_name,
      badge_number: profile.badge_number,
      department: profile.department,
      mfa_enabled: profile.mfa_enabled,
      roles: userRoles?.map((r) => r.role) ?? [],
    },
  })
}
