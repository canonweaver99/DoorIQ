import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  
  if (!secretKey) {
    console.error('❌ RECAPTCHA_SECRET_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()
    return data.success && data.score >= 0.5 // Adjust score threshold as needed
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { email, recaptchaToken } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification required' },
        { status: 400 }
      )
    }

    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken)
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    })

    if (error) {
      console.error('❌ Password reset error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    })

  } catch (error: any) {
    console.error('❌ Request reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

