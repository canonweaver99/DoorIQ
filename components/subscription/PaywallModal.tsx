'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, Loader2, Crown } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'feature_locked' | 'session_limit' | 'trial_ended'
  featureName?: string
  sessionsRemaining?: number
}

const PLANS = {
  monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || '',
    price: '$20',
    period: 'month'
  },
  yearly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY || '',
    price: '$16',
    period: 'month',
    note: 'Billed annually at $192'
  }
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  reason = 'feature_locked',
  featureName,
  sessionsRemaining
}: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PLANS[selectedPlan].priceId })
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
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMessage = () => {
    switch (reason) {
      case 'session_limit':
        return {
          title: 'Session Limit Reached',
          description: `You have ${sessionsRemaining || 0} practice sessions remaining this month. Upgrade to get unlimited sessions!`
        }
      case 'trial_ended':
        return {
          title: 'Trial Ended',
          description: 'Your free trial has ended. Upgrade now to continue accessing all premium features!'
        }
      case 'feature_locked':
      default:
        return {
          title: featureName ? `Unlock ${featureName}` : 'Premium Feature',
          description: featureName 
            ? `${featureName} is available with a premium subscription. Start your 7-day free trial today!`
            : 'This feature requires a premium subscription. Start your 7-day free trial today!'
        }
    }
  }

  const message = getMessage()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gradient-to-br from-[#1e1e30] to-[#2a2a3e] border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{message.title}</h2>
                </div>
                <p className="text-slate-400">{message.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Plan Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === 'monthly'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-lg font-semibold text-white">{PLANS.monthly.price}</div>
                    <div className="text-sm text-slate-400">per month</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPlan('yearly')}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === 'yearly'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-xs font-semibold text-white">
                      Save 20%
                    </div>
                    <div className="text-lg font-semibold text-white">{PLANS.yearly.price}</div>
                    <div className="text-sm text-slate-400">per month</div>
                    <div className="text-xs text-slate-500 mt-1">{PLANS.yearly.note}</div>
                  </button>
                </div>

                {/* Trial Banner */}
                <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">7-Day Free Trial</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    Start your free trial today. No charges for 7 days. Cancel anytime.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  <p className="font-semibold text-white mb-3">Everything included:</p>
                  {[
                    'Access to ALL 12 AI training agents',
                    'Unlimited practice sessions',
                    'Advanced analytics & detailed scoring',
                    'Real-time feedback & coaching',
                    'Custom sales scenarios',
                    'Call recording & playback',
                    'Performance tracking dashboard',
                    'Priority email & chat support',
                    'Export reports (CSV/PDF)'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Start 7-Day Free Trial
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-slate-400 mt-4">
                  By starting your trial, you agree to our Terms of Service. Cancel anytime before the trial ends to avoid charges.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

