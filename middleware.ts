import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Force HTTPS redirect in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.nextUrl.protocol === 'https:' ? 'https' : 'http')
    
    if (protocol !== 'https') {
      const httpsUrl = request.nextUrl.clone()
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl, 301)
    }
  }

  // Block access to pricing page - redirect to home
  const pathname = request.nextUrl.pathname
  if (pathname === '/pricing' || pathname.startsWith('/pricing/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Auth temporarily disabled; allow all routes to pass through
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Add HSTS header to enforce HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Cache static assets
  if (response.headers.get('content-type')?.includes('image') || 
      response.headers.get('content-type')?.includes('font') ||
      response.headers.get('content-type')?.includes('css') ||
      response.headers.get('content-type')?.includes('javascript')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Add preconnect hints for external resources on critical pages
  if (pathname === '/' || pathname === '/home' || pathname === '/dashboard' || pathname.startsWith('/pricing')) {
    const linkHeaders = [
      '</fonts.googleapis.com>; rel=preconnect',
      '</fonts.gstatic.com>; rel=preconnect; crossorigin',
      '</r.wdfl.co>; rel=dns-prefetch',
      '</api.supabase.co>; rel=dns-prefetch',
      '</api.supabase.co>; rel=preconnect',
    ].join(', ')
    response.headers.set('Link', linkHeaders)
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback|auth/callback|public).*)'],
}
