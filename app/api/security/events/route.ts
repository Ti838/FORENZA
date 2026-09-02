import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SecurityEventService, SecurityEventType, SecuritySeverity } from '@/lib/security/security-center'
import { hasPermission } from '@/lib/rbac'
import { AppRole } from '@/types'

export async function GET(request: NextRequest) {
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
    if (!hasPermission(roles, 'audit:read_security_events') && !hasPermission(roles, 'admin:read_all')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch DB security events & in-memory recent logs
    const { data: dbEvents } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    const memEvents = SecurityEventService.getRecentEvents()

    return NextResponse.json({
      events: dbEvents && dbEvents.length > 0 ? dbEvents : memEvents,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { event_type, severity, description, metadata } = body as {
      event_type: SecurityEventType
      severity: SecuritySeverity
      description: string
      metadata?: Record<string, unknown>
    }

    const log = SecurityEventService.logEvent(event_type, severity, description, {
      metadata,
    })

    // Also persist to Supabase security_events table
    await supabase.from('security_events').insert({
      event_type,
      severity,
      description,
      metadata: metadata || {},
    })

    return NextResponse.json({ success: true, log })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
