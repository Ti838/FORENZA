import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OfflineSyncEngine, OfflineSyncPayload } from '@/lib/sync/sync-engine'
import { DeviceKeyRecord } from '@/lib/device/device-trust'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const payload = (await request.json()) as OfflineSyncPayload

    // 1. Fetch registered device record
    const { data: deviceData } = await supabase
      .from('device_keys')
      .select('*')
      .eq('device_id', payload.device_id)
      .single()

    const deviceRecord = deviceData as DeviceKeyRecord | null

    // 2. Fetch current latest state on server
    const { data: latestState } = await supabase
      .from('evidence_states')
      .select('*')
      .eq('evidence_id', payload.evidence_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Process Sync Event
    const syncResult = await OfflineSyncEngine.processSyncEvent(
      payload,
      deviceRecord,
      latestState,
      new Set(), // deduplication set checked against DB
      0
    )

    if (syncResult.status === 'ACCEPTED') {
      // Append state to database
      await supabase.from('evidence_states').insert({
        evidence_id: payload.evidence_id,
        parent_state_id: payload.parent_state_id,
        event_type: payload.event_type,
        actor_id: deviceRecord?.user_id || '00000000-0000-0000-0000-000000000000',
        device_id: payload.device_id,
        timestamp_utc: payload.device_timestamp_utc,
        event_data: payload.event_data,
        previous_state_hash: latestState?.state_hash || null,
        event_hash: payload.event_hash,
        state_hash: payload.state_hash,
        signature: payload.signature,
        key_id: payload.key_id,
      })
    } else if (syncResult.status === 'QUARANTINED_CONFLICT') {
      // Record conflict in branches table
      await supabase.from('conflicts').insert({
        evidence_id: payload.evidence_id,
        type: 'PARENT_STATE_CONFLICT',
        severity: 'CRITICAL',
        source_states: [payload],
        explanation: syncResult.quarantine_reason || 'Offline parent state conflict',
      })
    }

    return NextResponse.json(syncResult)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
