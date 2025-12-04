import { createServerClient } from '@supabase/ssr'
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

  const pathname = request.nextUrl.pathname
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/landing',
    '/about',
    '/faqs',
    '/testimonials',
    '/contact-sales',
    '/privacy',
    '/terms',
    '/help',
    '/book-demo',
    '/features',
  ]
  
  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                        pathname.startsWith('/auth/') ||
                        pathname.startsWith('/invite/') ||
                        pathname.startsWith('/api/auth/') ||
                        pathname.startsWith('/api/webhooks/') ||
                        pathname.startsWith('/_next/') ||
                        pathname.startsWith('/public/')

  // Block access to pricing page - redirect to home
  if (pathname === '/pricing' || pathname.startsWith('/pricing/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow public routes to pass through without authentication
  if (isPublicRoute) {
    const response = NextResponse.next()
    
    // Add security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }
    
    // Add preconnect hints for external resources
    if (pathname === '/') {
      response.headers.set('Link', '</fonts.googleapis.com>; rel=preconnect, </fonts.gstatic.com>; rel=preconnect; crossorigin, </r.wdfl.co>; rel=dns-prefetch')
    }
    
    return response
  }

  // For protected routes, check authentication
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware (Edge runtime compatible)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  // If not authenticated, redirect to login
  if (!user || error) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback|auth/callback|public).*)'],
}
