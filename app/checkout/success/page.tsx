'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/app/landing/page'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<{
    plan: string
    reps: number
    billingPeriod: string
    email: string
  } | null>(null)

  useEffect(() => {
    // Verify session and get order details
    if (sessionId) {
      // In a real implementation, you'd verify the session with Stripe
      // For now, we'll just show success
      setLoading(false)
      
      // Try to get details from URL params or localStorage
      const plan = searchParams.get('plan') || 'starter'
      const reps = parseInt(searchParams.get('reps') || '1')
      const billingPeriod = searchParams.get('billing') || 'monthly'
      const email = searchParams.get('email') || ''

      setOrderDetails({
        plan,
        reps,
        billingPeriod,
        email,
      })
    } else {
      setLoading(false)
    }
  }, [sessionId, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
              <div className="relative bg-green-500/10 border-2 border-green-500/50 rounded-full p-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="font-space text-4xl sm:text-5xl font-bold text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-white/80 font-sans text-lg mb-2">
              Thank you for choosing DoorIQ
            </p>
            <p className="text-white/60 font-sans text-sm">
              Your subscription has been activated and you'll receive a confirmation email shortly.
            </p>
          </div>

          {/* Order Summary */}
          {orderDetails && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
              <h2 className="font-space text-xl font-semibold text-white mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70 font-sans">Plan:</span>
                  <span className="text-white font-semibold capitalize">{orderDetails.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 font-sans">Number of Reps:</span>
                  <span className="text-white font-semibold">{orderDetails.reps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 font-sans">Billing Period:</span>
                  <span className="text-white font-semibold capitalize">{orderDetails.billingPeriod}</span>
                </div>
                {orderDetails.email && (
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="text-white/70 font-sans">Email:</span>
                    <span className="text-white font-semibold">{orderDetails.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-8">
            <h3 className="font-space text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-white/80 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Check your email ({orderDetails?.email || 'your email'}) for account setup instructions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You'll receive login credentials within the next few minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Your 14-day free trial starts now - no charges until the trial ends</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/auth/login')}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
            >
              Go to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/landing">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
              >
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-white/60 font-sans text-sm">
              Need help? Contact us at{' '}
              <a href="mailto:support@dooriq.ai" className="text-purple-400 hover:text-purple-300">
                support@dooriq.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

