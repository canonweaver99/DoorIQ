import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Callback hit with code:', code ? 'yes' : 'no')
  console.log('Request origin:', requestUrl.origin)
  console.log('Request URL:', requestUrl.href)
  
  // Just redirect to home for now
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
