'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  CreditCard, 
  Settings, 
  Loader2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SubscriptionDetails {
  id: string
  status: string
  currentPeriodEnd: string
  currentPeriodStart: string
  cancelAtPeriodEnd: boolean
  price: {
    amount: number
    currency: string
    interval: string
    intervalCount: number
  }
  plan: string
  yearlySavings: {
    amount: number
    percent: number
    yearlyPrice: number
  } | null
}

interface PaymentMethod {
  type: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

function BillingPageContent() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadSubscriptionDetails()
    
    // Check if user just upgraded
    if (searchParams.get('upgraded') === 'true') {
      // Refresh after a moment to show updated subscription
      setTimeout(() => {
        loadSubscriptionDetails()
        router.replace('/billing')
      }, 1000)
    }
  }, [searchParams])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const loadSubscriptionDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/subscription-details')
      
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setPaymentMethod(data.paymentMethod)
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

  const handleUpgradeYearly = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/upgrade-yearly', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      if (data.success) {
        // Reload subscription details
        await loadSubscriptionDetails()
        router.push('/billing?upgraded=true')
      }
    } catch (error) {
      console.error('Error upgrading to yearly:', error)
      alert('Failed to upgrade to yearly plan')
    } finally {
      setUpgrading(false)
    }
  }

  const formatPrice = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  const getPlanName = (plan: string) => {
    const planMap: Record<string, string> = {
      'individual': 'Starter',
      'team': 'Team',
      'free': 'Free'
    }
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'bg-blue-600 text-white'
      case 'past_due':
        return 'bg-yellow-500 text-white'
      case 'canceled':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVE'
      case 'trialing':
        return 'TRIALING'
      case 'past_due':
        return 'PAST DUE'
      case 'canceled':
        return 'CANCELED'
      default:
        return status.toUpperCase()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  const hasActiveSubscription = subscription && (subscription.status === 'active' || subscription.status === 'trialing')
  const isMonthly = subscription?.price.interval === 'month'
  const showYearlyBanner = hasActiveSubscription && isMonthly && subscription.yearlySavings

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Account Settings Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
              <nav className="space-y-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span>Account Settings</span>
                </Link>
                <Link
                  href="/billing"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Manage Subscription</span>
                  {hasActiveSubscription && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </Link>
                <Link
                  href="/billing?tab=purchase-history"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span>Purchase History</span>
                  {hasActiveSubscription && (
                    <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </Link>
                <Link
                  href="/billing?tab=cards"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <span>Stored Cards</span>
                  {paymentMethod && (
                    <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Subscription</h1>

              {/* Yearly Upgrade Banner */}
              {showYearlyBanner && subscription.yearlySavings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Save {subscription.yearlySavings.percent}% with a yearly plan
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        The annual price for this subscription is only {formatPrice(subscription.yearlySavings.yearlyPrice)}/year. 
                        This saves you {formatPrice(subscription.yearlySavings.amount)}/year compared to your monthly subscription.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgradeYearly}
                    disabled={upgrading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </motion.div>
              )}

              {/* Subscription Card */}
              {hasActiveSubscription && subscription ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    {/* Logo/Icon */}
                    <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center flex-shrink-0 p-2">
                      <img 
                        src="/dooriq-key.png" 
                        alt="DoorIQ" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to text if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">DI</span>'
                          }
                        }}
                      />
                    </div>

                    {/* Plan Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {getPlanName(subscription.plan)}
                          </h3>
                          <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${getStatusColor(subscription.status)}`}
                          >
                            {getStatusText(subscription.status)}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Change Plan'
                            )}
                          </button>
                          <div className="relative menu-container">
                            <button
                              onClick={() => setShowMenu(showMenu === subscription.id ? null : subscription.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {showMenu === subscription.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    handleManageSubscription()
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Manage in Stripe Portal
                                </button>
                                <button
                                  onClick={() => {
                                    router.push('/pricing')
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  View Plans
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Renewal and Payment Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Renews on</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(subscription.price.amount)} ({subscription.price.interval === 'month' ? 'per month' : 'per year'})
                            {subscription.price.interval === 'month' && (
                              <span className="text-gray-500 text-xs ml-1">(incl. taxes)</span>
                            )}
                          </p>
                        </div>
                        {paymentMethod && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCardBrand(paymentMethod.brand)} **** {paymentMethod.last4}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
                      1
                    </span>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    1 - 1 of 1 subscriptions purchased
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-6">
                    Start a subscription to access all premium features
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  )
}
