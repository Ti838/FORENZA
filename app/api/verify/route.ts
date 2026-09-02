import { NextRequest, NextResponse } from 'next/server'
import { IndependentVerifier } from '@/lib/verifier/independent-verifier'
import { SealedEvidencePassport } from '@/lib/passport/evidence-passport'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passport, publicKeysMap } = body as {
      passport: SealedEvidencePassport
      publicKeysMap?: Record<string, string>
    }

    if (!passport || !passport.payload) {
      return NextResponse.json(
        { error: 'Invalid passport payload. Missing passport manifest.' },
        { status: 400 }
      )
    }

    // Run independent cryptographic verification
    const report = await IndependentVerifier.verifyPassport(
      passport,
      publicKeysMap || {}
    )

    return NextResponse.json({
      verdict: report.verdict,
      report,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
