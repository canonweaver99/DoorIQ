import { NextResponse } from 'next/server'

export async function GET() {
  const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY)
  const hasPublishable = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || null

  return NextResponse.json({
    ok: true,
    stripe: {
      hasSecret,
      hasPublishable,
    },
    appUrl,
    envLoadedFrom: '.env.local'
  })
}


