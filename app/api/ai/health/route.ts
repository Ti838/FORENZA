import { NextResponse } from 'next/server'
import { TaskRouter } from '@/lib/ai/router'

export async function GET() {
  try {
    const healthReports = await TaskRouter.checkAllHealth()
    return NextResponse.json({
      timestamp_utc: new Date().toISOString(),
      providers: healthReports,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
