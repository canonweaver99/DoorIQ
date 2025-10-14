'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Calendar, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering - Stripe features not fully configured yet
export const dynamic = 'force-dynamic'

interface SubscriptionData {
  status: string
  plan: string
  currentPeriodEnd: string
  trialEndsAt: string | null
  lastPaymentDate: string | null
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_current_period_end, trial_ends_at, last_payment_date')
        .eq('id', user.id)
        .single()

      if (data) {
        setSubscription({
          status: data.subscription_status || 'none',
          plan: data.subscription_plan || 'free',
          currentPeriodEnd: data.subscription_current_period_end || '',
          trialEndsAt: data.trial_ends_at,
          lastPaymentDate: data.last_payment_date
        })
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST'
      })

      const { url, error } = await response.json()
      
      if (error) {
        alert(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'trialing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'past_due':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'trialing':
        return <Calendar className="w-5 h-5 text-blue-400" />
      case 'past_due':
      case 'canceled':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <CreditCard className="w-5 h-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-slate-400 mb-8">Manage your subscription and payment methods</p>

          {/* Subscription Status Card */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Current Plan</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(subscription?.status || 'none')}`}>
                  {getStatusIcon(subscription?.status || 'none')}
                  <span className="font-medium capitalize">{subscription?.status || 'No Subscription'}</span>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={actionLoading || !subscription || subscription.status === 'none'}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Manage Subscription
                  </>
                )}
              </button>
            </div>

            {subscription?.status === 'trialing' && subscription?.trialEndsAt && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">Free Trial Active</p>
                    <p className="text-sm text-slate-400">
                      Your trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {subscription?.status === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Next Billing Date</p>
                  <p className="text-lg font-semibold text-white">
                    {subscription.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                {subscription.lastPaymentDate && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-1">Last Payment</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(subscription.lastPaymentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {subscription?.status === 'past_due' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Payment Issue</p>
                    <p className="text-sm text-slate-400">
                      Please update your payment method to continue your subscription
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(!subscription || subscription.status === 'none' || subscription.status === 'canceled') && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">No Active Subscription</p>
                    <p className="text-sm text-slate-400 mb-3">
                      Upgrade to access all features with a 7-day free trial
                    </p>
                    <a
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm font-semibold text-white transition-all"
                    >
                      View Plans
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Based on Plan */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Plan Includes</h2>
            {subscription?.status === 'active' || subscription?.status === 'trialing' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Access to ALL 12 AI training agents',
                  'Unlimited practice sessions',
                  'Advanced analytics & scoring',
                  'Real-time feedback & coaching',
                  'Custom sales scenarios',
                  'Call recording & playback',
                  'Performance tracking dashboard',
                  'Priority email & chat support',
                  'Export reports (CSV/PDF)',
                  'Team collaboration features'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400">Free plan includes:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Access to 3 AI training agents',
                    'Up to 10 practice calls/month',
                    'Basic performance analytics',
                    'Email support'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
