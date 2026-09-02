import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const { ip_address, user_agent, request_id } = extractRequestMeta(request)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  await supabase.auth.signOut()

  await createAuditLog({
    actor_id: user?.id,
    actor_email: user?.email,
    category: 'AUTHENTICATION',
    action: 'LOGOUT',
    success: true,
    ip_address,
    user_agent,
    request_id,
  })

  return NextResponse.json({ success: true })
}
