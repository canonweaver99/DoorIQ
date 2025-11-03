import { NextResponse } from 'next/server'

export async function middleware() {
  // Auth temporarily disabled; allow all routes to pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback|auth/callback|public).*)'],
}
