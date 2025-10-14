'use client'

import { useState } from "react"
import { PricingSection } from "@/components/ui/pricing"
import { Loader2 } from "lucide-react"

// Force dynamic rendering - Stripe features not fully configured yet
export const dynamic = 'force-dynamic'

// Stripe Price IDs - Replace these with your actual price IDs from Stripe Dashboard
const STRIPE_PRICE_IDS = {
  individual_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || 'price_individual_monthly',
  individual_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY || 'price_individual_yearly'
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string, planName: string) => {
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

  const demoPlans = [
    {
      name: "Free",
      price: "0",
      yearlyPrice: "0",
      period: "month",
      features: [
        "Access to 3 AI training agents",
        "Up to 10 practice calls/month",
        "Basic performance analytics",
        "Email support",
        "Standard response templates",
        "Basic objection handling scenarios",
      ],
      description: "Perfect for getting started",
      buttonText: "Get Started Free",
      href: "/auth/signup",
    },
    {
      name: "Individual",
      price: "20",
      yearlyPrice: "16",
      period: "month",
      features: [
        "7-day FREE trial",
        "Access to ALL 12 AI training agents",
        "Unlimited practice calls",
        "Advanced analytics & scoring",
        "Real-time feedback & coaching",
        "Custom sales scenarios",
        "Call recording & playback",
        "Performance tracking dashboard",
        "Priority email & chat support",
        "Export reports (CSV/PDF)",
      ],
      description: "Ideal for individual sales reps",
      buttonText: loading === 'monthly' ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </span>
      ) : "Start Free Trial",
      onClick: () => handleCheckout(STRIPE_PRICE_IDS.individual_monthly, 'Individual'),
      isPopular: true,
    },
    {
      name: "Manager",
      price: "Contact Sales",
      yearlyPrice: "Contact Sales",
      period: "",
      features: [
        "Everything in Individual",
        "Team management dashboard",
        "Real-time team analytics & leaderboards",
        "Role-based access control",
        "Assign training to reps",
        "Track team performance metrics",
        "Manager coaching insights",
        "Bulk report exports",
        "Custom pricing based on team size",
        "Dedicated account manager",
      ],
      description: "For sales managers and teams",
      buttonText: "Contact Sales",
      href: "mailto:sales@dooriq.com",
    },
  ]

  return (
    <PricingSection
      plans={demoPlans}
      title="Find the Perfect Plan"
      description="Choose the plan that fits your sales team's needs. Start with a 7-day free trial!"
    />
  )
}


