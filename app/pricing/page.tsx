'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PricingSection } from "@/components/ui/pricing"
import { Loader2, CheckCircle, X, Crown } from "lucide-react"
import confetti from "canvas-confetti"
import { useSubscription } from "@/hooks/useSubscription"
import { createClient } from "@/lib/supabase/client"

// Stripe Price IDs - Get these from your Stripe Dashboard
// For now, you can use the Stripe Payment Link directly or extract the price ID
const STRIPE_PRICE_IDS = {
  // Hard-wire user's test price ID so Checkout Session API is always used locally
  individual_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || 'price_1SIxYr1WkNBozaYxGzx9YffP',
  individual_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY || 'price_1SIyLY1WkNBozaYxld3E6aWS'
}

// Stripe Payment Link (as provided by user)
// This can be used directly or you can extract the price ID from your dashboard
const PAYMENT_LINK = 'https://buy.stripe.com/test_eVq5kw4h46yu7VB6RJes000'

function PricingPageContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const searchParams = useSearchParams()
  const subscription = useSubscription()
  const router = useRouter()
  const supabase = createClient()
  // Mirror pricing toggle state from pricing component
  const [isMonthly, setIsMonthlyState] = useState(true)

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')
    const checkoutIntent = searchParams.get('checkout')
    
    // If user just authenticated and has a pending checkout, automatically proceed
    if (checkoutIntent && !success) {
      const priceId = decodeURIComponent(checkoutIntent)
      console.log('🛒 Resuming checkout after auth:', priceId)
      
      // Small delay to ensure auth state is fully loaded
      setTimeout(() => {
        handleCheckout(priceId, false)
      }, 500)
      
      // Clean up URL params
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('checkout')
      window.history.replaceState({}, '', newUrl.toString())
    }
    
    // Sync subscription status after successful checkout
    if (success === 'true' && sessionId) {
      console.log('🔄 Syncing subscription for session:', sessionId)
      
      fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('✅ Subscription synced successfully')
            // Refresh subscription status
            subscription.refetch?.()
          } else {
            console.error('❌ Failed to sync subscription:', data.error)
          }
        })
        .catch(error => {
          console.error('❌ Error syncing subscription:', error)
        })
    }
    
    if (success === 'true') {
      setShowSuccessBanner(true)
      
      // Trigger confetti celebration!
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        // Confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        
        // Confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      // Auto-hide banner after 10 seconds
      const timeout = setTimeout(() => {
        setShowSuccessBanner(false)
      }, 10000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [searchParams])

  const handleCheckout = async (priceId: string, usePaymentLink: boolean = false) => {
    setLoading(priceId)
    try {
      // Ensure user is authenticated before starting checkout
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Store the intended purchase in URL params for seamless redirect after auth
        const checkoutIntent = encodeURIComponent(priceId)
        router.push(`/auth/login?next=/pricing&checkout=${checkoutIntent}`)
        return
      }

      // If using payment link directly (for testing)
      if (usePaymentLink && PAYMENT_LINK) {
        window.location.href = PAYMENT_LINK
        return
      }

      // Otherwise use the regular checkout session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      })

      if (response.status === 401) {
        // Store the intended purchase for seamless redirect after auth
        const checkoutIntent = encodeURIComponent(priceId)
        router.push(`/auth/login?next=/pricing&checkout=${checkoutIntent}`)
        return
      }

      if (response.status === 503) {
        alert('Stripe not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local, then restart dev server.')
        return
      }

      const { url, error } = await response.json()
      
      if (error) {
        alert(`Error: ${error}`)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  // Check if user has active subscription (including trial)
  const hasActiveSubscription = subscription.hasActiveSubscription
  const isCurrentPlan = (planName: string) => {
    if (planName === "Free" && !hasActiveSubscription && !subscription.loading) {
      return true
    }
    if (planName === "Individual" && hasActiveSubscription) {
      return true
    }
    return false
  }

  const plans = [
    {
      name: "Free",
      price: "0",
      yearlyPrice: "0",
      period: "month",
      features: [
        "Access to ALL AI training agents",
        "10 practice call credits/month",
        "Full analytics for your sessions",
        "Basic objection handling scenarios",
        "Email support",
        "Dashboard overview only",
      ],
      description: "Perfect for getting started",
      buttonText: isCurrentPlan("Free") ? (
        <span className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          Current Plan
        </span>
      ) : hasActiveSubscription ? "Switch to Free" : "Get Started Free",
      href: isCurrentPlan("Free") ? "#" : (hasActiveSubscription ? "/billing" : "/auth/signup"),
      onClick: isCurrentPlan("Free") ? () => {} : undefined,
      isCurrentPlan: isCurrentPlan("Free"),
    },
    {
      name: "Individual",
      price: "50",
      yearlyPrice: "40",
      period: "month",
      features: [
        "Access to ALL AI training agents",
        "Unlimited practice calls",
        "Advanced analytics & scoring",
        "Full dashboard access (Performance, Learning, etc.)",
        "Sales call upload & analysis",
        "Call recording & playback",
        "Export reports (CSV/PDF)",
      ],
      description: "Ideal for individual sales reps",
      buttonText: isCurrentPlan("Individual") ? (
        <span className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          Current Plan
        </span>
      ) : (loading === STRIPE_PRICE_IDS.individual_monthly || loading === STRIPE_PRICE_IDS.individual_yearly) ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </span>
      ) : "Purchase",
      href: "#",
      // Use monthly or yearly checkout based on toggle
      onClickMonthly: isCurrentPlan("Individual") ? () => {} : () => handleCheckout(STRIPE_PRICE_IDS.individual_monthly, false),
      onClickYearly: isCurrentPlan("Individual") ? () => {} : () => handleCheckout(STRIPE_PRICE_IDS.individual_yearly, false),
      isPopular: false,
      isCurrentPlan: isCurrentPlan("Individual"),
    },
    {
      name: "Team",
      price: "Contact Sales",
      yearlyPrice: "Contact Sales",
      period: "",
      features: [
        "Everything in Individual",
        "Team management dashboard",
        "Real-time team analytics & leaderboards",
        "Assign training to reps",
        "Track team performance metrics",
        "Manager coaching insights",
        "Bulk report exports",
        "Custom pricing based on team size",
        "Dedicated account manager",
      ],
      description: "For sales managers and teams",
      buttonText: "Contact Sales",
      href: "/contact-sales",
      isPopular: true,
    },
  ]

  return (
    <>
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] max-w-lg w-full mx-4">
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-green-600/40 rounded-3xl blur-2xl" />
            
            {/* Main card */}
            <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white rounded-2xl shadow-[0_20px_70px_-10px_rgba(16,185,129,0.5)] border border-emerald-700/50 p-7 backdrop-blur-xl animate-in slide-in-from-top duration-500">
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 pt-0.5">
                  <h3 className="font-bold text-2xl mb-2 text-white">Welcome to Premium!</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed mb-4">
                    Your <span className="font-semibold text-white">subscription</span> is now active! You now have unlimited access to all 12 AI training agents and premium features.
                  </p>
                  
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href="/trainer/select-homeowner"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-900 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Start Training →
                    </a>
                    <a
                      href="/billing"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
                    >
                      Manage Subscription
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PricingSection
        plans={plans}
        title="Find the Perfect Plan"
        description="Choose the plan that fits your sales team's needs."
      />
    </>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
}
