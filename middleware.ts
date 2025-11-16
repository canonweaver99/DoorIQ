import { NextResponse } from 'next/server'

export async function middleware() {
  // Auth temporarily disabled; allow all routes to pass through
  const response = NextResponse.next()
  
  // Add performance and security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Cache static assets
  if (response.headers.get('content-type')?.includes('image') || 
      response.headers.get('content-type')?.includes('font') ||
      response.headers.get('content-type')?.includes('css') ||
      response.headers.get('content-type')?.includes('javascript')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback|auth/callback|public).*)'],
}
