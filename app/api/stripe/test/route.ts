import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Ensure Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    
    // Check if key exists
    if (!secretKey) {
      return NextResponse.json({
        status: 'error',
        message: 'STRIPE_SECRET_KEY environment variable not set',
        env: process.env.NODE_ENV
      })
    }

    // Check key format
    const keyInfo = {
      prefix: secretKey.substring(0, 7),
      length: secretKey.length,
      hasWhitespace: secretKey !== secretKey.trim(),
      mode: secretKey.startsWith('sk_test_') ? 'test' : secretKey.startsWith('sk_live_') ? 'live' : 'unknown'
    }

    // Try to initialize Stripe
    try {
      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-09-30.clover'
      })

      // Try a simple API call
      const balance = await stripe.balance.retrieve()

      return NextResponse.json({
        status: 'success',
        message: 'Stripe connection successful',
        keyInfo,
        balanceRetrieved: true,
        currency: balance.available[0]?.currency || 'unknown'
      })
    } catch (stripeError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Stripe initialization or API call failed',
        keyInfo,
        error: stripeError.message,
        type: stripeError.type
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error.message
    })
  }
}

