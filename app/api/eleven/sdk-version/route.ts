import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Resolve package.json version on the server where Node resolution is allowed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('@elevenlabs/client/package.json')
    const version = pkg?.version ?? 'unknown'
    return NextResponse.json({ version })
  } catch (e: any) {
    return NextResponse.json({ error: true, message: e?.message ?? String(e) }, { status: 500 })
  }
}


