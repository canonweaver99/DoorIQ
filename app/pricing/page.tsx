'use client'

import { useState } from "react"
import { Check, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"

// Stripe Price IDs - Replace these with your actual price IDs from Stripe Dashboard
const STRIPE_PRICE_IDS = {
  individual_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || 'price_individual_monthly',
  individual_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY || 'price_individual_yearly'
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find the Perfect Plan
          </h1>
          <p className="text-xl text-slate-400">
            Choose the plan that fits your sales team&apos;s needs. Start with a 7-day free trial!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <p className="text-slate-400 mb-6">Perfect for getting started</p>
            
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$0</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>

            <Link
              href="/auth/signup"
              className="block w-full py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl text-center font-semibold text-white transition-all mb-6"
            >
              Get Started Free
            </Link>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Access to 3 AI training agents</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Up to 10 practice calls/month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Basic performance analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Email support</span>
              </li>
            </ul>
          </div>

          {/* Individual Plan (Popular) */}
          <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-2 border-purple-500 rounded-2xl p-8 relative transform md:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1 rounded-full">
              <span className="text-sm font-semibold text-white flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Most Popular
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Individual</h3>
            <p className="text-purple-300 mb-6">Ideal for individual sales reps</p>
            
            <div className="mb-2">
              <span className="text-5xl font-bold text-white">$20</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>
            <p className="text-sm text-purple-300 mb-6">7-day FREE trial • Cancel anytime</p>

            <button
              onClick={() => handleCheckout(STRIPE_PRICE_IDS.individual_monthly)}
              disabled={loading === STRIPE_PRICE_IDS.individual_monthly}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl font-semibold text-white transition-all mb-6 flex items-center justify-center gap-2"
            >
              {loading === STRIPE_PRICE_IDS.individual_monthly ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Free Trial
                </>
              )}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 font-medium">7-day FREE trial</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Access to ALL 12 AI training agents</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Unlimited practice calls</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Advanced analytics & scoring</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Real-time feedback & coaching</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Custom sales scenarios</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Call recording & playback</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Export reports (CSV/PDF)</span>
              </li>
            </ul>
          </div>

          {/* Manager Plan */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Manager</h3>
            <p className="text-slate-400 mb-6">For sales managers and teams</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">Contact Sales</span>
            </div>

            <a
              href="mailto:sales@dooriq.com"
              className="block w-full py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl text-center font-semibold text-white transition-all mb-6"
            >
              Contact Sales
            </a>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Everything in Individual</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Team management dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Real-time team analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Role-based access control</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Assign training to reps</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Manager coaching insights</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Custom pricing based on team size</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Dedicated account manager</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ / Info Section */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-blue-300 mb-3">
              Try it risk-free with our 7-day free trial
            </h3>
            <p className="text-slate-300">
              No credit card required. Start practicing with all premium features today. 
              Cancel anytime before the trial ends and you won&apos;t be charged.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


