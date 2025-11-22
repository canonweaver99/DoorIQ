'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Users, Calendar, Download, AlertCircle, Loader2, Sparkles, ExternalLink, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { SeatCounter } from '@/components/settings/SeatCounter'
import { InvoiceList } from '@/components/settings/InvoiceList'
import { PlanCard } from '@/components/settings/PlanCard'
import { CancelSubscriptionModal } from '@/components/settings/CancelSubscriptionModal'
import { UpgradePrompt } from '@/components/settings/UpgradePrompt'
import { BillingIntervalToggle } from '@/components/settings/BillingIntervalToggle'
import { useRouter } from 'next/navigation'

interface PlanData {
  tier: string
  seatLimit: number
  seatsUsed: number
  billingInterval: string
  trialEndsAt: string | null
}

interface SubscriptionData {
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  quantity: number
}

interface UsageData {
  activeReps: number
  sessionsThisMonth: number
}

export default function BillingSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const [plan, setPlan] = useState<PlanData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isManager, setIsManager] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradePromptData, setUpgradePromptData] = useState<{
    currentTier: string
    requiredTier: string
    maxSeats: number
    message?: string
  } | null>(null)
  const [switchingBillingInterval, setSwitchingBillingInterval] = useState(false)

  useEffect(() => {
    fetchBillingData()
    fetchInvoices()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/billing/current-plan')
      if (!response.ok) {
        throw new Error('Failed to fetch billing data')
      }
      const data = await response.json()
      setPlan(data.plan)
      setSubscription(data.subscription)
      setUsage(data.usage)
      setIsManager(data.isManager)
    } catch (err: any) {
      console.error('Error fetching billing data:', err)
      setError(err.message || 'Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true)
      const response = await fetch('/api/billing/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setInvoicesLoading(false)
    }
  }

  const handleAddSeats = async (seats: number) => {
    try {
      const response = await fetch('/api/billing/add-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatsToAdd: seats }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setUpgradePromptData({
            currentTier: data.currentTier || plan?.tier || 'starter',
            requiredTier: data.currentTier === 'starter' ? 'team' : 'enterprise',
            maxSeats: data.maxSeats || 20,
            message: data.error,
          })
          setShowUpgradePrompt(true)
          return
        }
        throw new Error(data.error || 'Failed to add seats')
      }

      setSuccess(`Successfully added ${seats} seat${seats !== 1 ? 's' : ''}`)
      setTimeout(() => setSuccess(null), 3000)
      await fetchBillingData()
    } catch (err: any) {
      setError(err.message || 'Failed to add seats')
    }
  }

  const handleRemoveSeats = async (seats: number) => {
    try {
      const response = await fetch('/api/billing/remove-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatsToRemove: seats }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresDowngrade) {
          setError(data.error)
          // Could show downgrade prompt here
          return
        }
        throw new Error(data.error || 'Failed to remove seats')
      }

      setSuccess(`Successfully removed ${seats} seat${seats !== 1 ? 's' : ''}`)
      setTimeout(() => setSuccess(null), 3000)
      await fetchBillingData()
    } catch (err: any) {
      setError(err.message || 'Failed to remove seats')
    }
  }

  const handleCancelSubscription = async (cancelImmediately: boolean) => {
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelImmediately }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess(data.message || 'Subscription canceled successfully')
      setTimeout(() => setSuccess(null), 5000)
      await fetchBillingData()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription')
      throw err
    }
  }

  const handleSwitchBillingInterval = async (interval: 'monthly' | 'annual') => {
    setSwitchingBillingInterval(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/switch-billing-interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInterval: interval }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch billing interval')
      }

      setSuccess(data.message || `Billing interval switched to ${interval}`)
      setTimeout(() => setSuccess(null), 5000)
      await fetchBillingData()
    } catch (err: any) {
      setError(err.message || 'Failed to switch billing interval')
    } finally {
      setSwitchingBillingInterval(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Error opening billing portal:', err)
      setError(err.message || 'Failed to open billing portal')
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

    if (subscription.status === 'trialing') {
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
          <span className="text-sm font-medium text-green-400">Active</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-400">
          {subscription.status === 'canceled' ? 'Canceled' : subscription.status}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <p className="text-foreground/60 font-sans">No billing information found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3"
        >
          <span className="text-sm text-green-400">{success}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Current Plan */}
      <GlowCard glowColor="purple" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-space font-bold text-foreground mb-2">Current Plan</h2>
              <p className="text-sm text-foreground/60 font-sans">
                {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} Plan
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Billing Interval Toggle */}
          {plan && (
            <div className="pt-4 border-t border-purple-500/20">
              <BillingIntervalToggle
                currentInterval={plan.billingInterval as 'monthly' | 'annual'}
                onSwitch={handleSwitchBillingInterval}
                disabled={switchingBillingInterval || !subscription || subscription.status !== 'active'}
              />
            </div>
          )}

          {subscription && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-1">Current Period Ends</p>
                  <p className="text-base font-medium text-foreground">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              {plan.trialEndsAt && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Trial Ends</p>
                    <p className="text-base font-medium text-foreground">
                      {formatDate(plan.trialEndsAt)}
                    </p>
                  </div>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-start gap-3 md:col-span-2">
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

          {/* Usage Metrics */}
          {usage && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Active Reps</p>
                <p className="text-2xl font-bold text-foreground font-space">{usage.activeReps}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Sessions This Month</p>
                <p className="text-2xl font-bold text-foreground font-space">{usage.sessionsThisMonth}</p>
              </div>
            </div>
          )}

          {/* Manage Subscription Buttons */}
          <div className="pt-4 border-t border-purple-500/20 space-y-3">
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
            <p className="text-xs text-foreground/50 font-sans">
              Update payment method and view invoices
            </p>
            
            {subscription && subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <div className="pt-2">
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            )}
          </div>
        </div>
      </GlowCard>

      {/* Seat Management */}
      {isManager && plan && (
        <GlowCard glowColor="emerald" customSize className="p-6 bg-card/60 dark:bg-black/60">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-space font-bold text-foreground mb-2">Seat Management</h2>
              <p className="text-sm text-foreground/60 font-sans">
                Add or remove seats for your team
              </p>
            </div>
            <SeatCounter
              currentSeats={plan.seatLimit}
              seatsUsed={plan.seatsUsed}
              seatLimit={plan.seatLimit}
              planTier={plan.tier}
              onAddSeats={handleAddSeats}
              onRemoveSeats={handleRemoveSeats}
            />
          </div>
        </GlowCard>
      )}

      {/* Upgrade Plans */}
      <GlowCard glowColor="blue" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Available Plans</h2>
            <p className="text-sm text-foreground/60 font-sans">
              Upgrade or change your plan
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlanCard
              tier="starter"
              currentTier={plan.tier}
              pricePerSeat={99}
              minSeats={1}
              maxSeats={20}
              features={[
                'Unlimited practice sessions',
                'All AI personas',
                'Team leaderboard',
                'Basic analytics & reporting',
                'Manager dashboard',
              ]}
              badge="Best for Small Teams"
              onSelect={() => router.push('/pricing')}
            />
            <PlanCard
              tier="team"
              currentTier={plan.tier}
              pricePerSeat={69}
              minSeats={21}
              maxSeats={100}
              features={[
                'Everything in Starter',
                'Advanced analytics & reporting',
                'Team performance insights',
                'Custom practice scenarios',
                'Custom sales playbook',
              ]}
              badge="Most Popular"
              popular
              onSelect={() => router.push('/pricing')}
            />
            <PlanCard
              tier="enterprise"
              currentTier={plan.tier}
              pricePerSeat={49}
              minSeats={100}
              maxSeats={500}
              features={[
                'Everything in Team',
                'Custom AI personas',
                'White-label option',
                'Dedicated account team',
                'Volume discounts',
              ]}
              badge="Enterprise Ready"
              onSelect={() => router.push('/enterprise/signup')}
            />
          </div>
        </div>
      </GlowCard>

      {/* Invoice History */}
      <GlowCard glowColor="purple" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Billing History</h2>
            <p className="text-sm text-foreground/60 font-sans">
              View and download your invoices
            </p>
          </div>
          <InvoiceList invoices={invoices} loading={invoicesLoading} />
        </div>
      </GlowCard>

      {/* Modals */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        currentPeriodEnd={subscription?.currentPeriodEnd}
      />

      {upgradePromptData && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => {
            setShowUpgradePrompt(false)
            setUpgradePromptData(null)
          }}
          currentTier={upgradePromptData.currentTier}
          requiredTier={upgradePromptData.requiredTier}
          maxSeats={upgradePromptData.maxSeats}
          message={upgradePromptData.message}
        />
      )}
    </div>
  )
}

