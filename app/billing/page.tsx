'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ExternalLink,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'

interface SubscriptionData {
  status: string | null
  plan: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEndsAt: string | null
  hasActiveSubscription: boolean
  isTrialing: boolean
}

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_current_period_end, subscription_cancel_at_period_end, trial_ends_at, stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching subscription:', userError)
        setError('Failed to load subscription data')
        setLoading(false)
        return
      }

      if (!userData) {
        setError('User data not found')
        setLoading(false)
        return
      }

      const status = userData.subscription_status || null
      const trialEndsAt = userData.trial_ends_at || null
      const now = Date.now()
      const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null
      const isTrialing = status === 'trialing' && trialEndMs !== null && trialEndMs > now
      const hasActiveSubscription = status === 'active' || isTrialing

      setSubscription({
        status,
        plan: userData.subscription_plan || null,
        currentPeriodEnd: userData.subscription_current_period_end || null,
        cancelAtPeriodEnd: userData.subscription_cancel_at_period_end || false,
        trialEndsAt,
        hasActiveSubscription,
        isTrialing,
      })
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session')
      }

      if (data.url) {
        // Redirect to Stripe billing portal
        window.location.href = data.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (err: any) {
      console.error('Error opening billing portal:', err)
      setError(err.message || 'Failed to open billing portal. Please try again or contact support.')
      setPortalLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = () => {
    if (!subscription) return null

    if (subscription.isTrialing) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Trial</span>
        </div>
      )
    }

    if (subscription.status === 'active') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Active</span>
        </div>
      )
    }

    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">
            {subscription.status === 'canceled' ? 'Canceled' : 'Past Due'}
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/20 border border-slate-500/30">
        <AlertCircle className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-400">No Subscription</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-foreground/60">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-space font-bold text-foreground mb-4">
            Billing & Subscription
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 font-sans">
            Manage your subscription, payment method, and billing history
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400 mb-1">Error</p>
              <p className="text-sm text-red-300/80">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard
            glowColor="purple"
            customSize
            className="p-6 sm:p-8 lg:p-10 bg-card/60 dark:bg-black/60"
          >
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-space font-bold text-foreground mb-2">
                    Subscription Status
                  </h2>
                  {subscription?.plan && (
                    <p className="text-base text-foreground/60 font-sans">
                      Plan: <span className="font-medium text-foreground/80">{subscription.plan}</span>
                    </p>
                  )}
                </div>
                {getStatusBadge()}
              </div>

              {/* Subscription Details */}
              {subscription && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground/60 mb-1">Current Period Ends</p>
                      <p className="text-base font-medium text-foreground">
                        {subscription.currentPeriodEnd 
                          ? formatDate(subscription.currentPeriodEnd)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {subscription.isTrialing && subscription.trialEndsAt && (
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground/60 mb-1">Trial Ends</p>
                        <p className="text-base font-medium text-foreground">
                          {formatDate(subscription.trialEndsAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-400 mb-1">Cancellation Scheduled</p>
                        <p className="text-sm text-foreground/80">
                          Your subscription will cancel at the end of the current billing period.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manage Subscription Button */}
              <div className="pt-4 border-t border-purple-500/20">
                <Button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full sm:w-auto bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:border-[#3a3a3a] font-medium"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Subscription
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-foreground/50 mt-2 font-sans">
                  Update payment method, view invoices, or cancel your subscription
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <GlowCard
            glowColor="blue"
            customSize
            className="p-6 bg-card/40 dark:bg-black/40"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Need Help?</h3>
                <p className="text-sm text-foreground/70 font-sans">
                  If you have questions about your subscription or billing, please contact our support team.
                  You can also manage your subscription directly through the Stripe Customer Portal.
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  )
}

