'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
  CheckCircle2,
  Bell,
  Moon,
  Save,
  X,
  User,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/lib/supabase/database.types'
import { Toggle } from '@/components/ui/toggle'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

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

type UserData = Database['public']['Tables']['users']['Row']

function BillingPageContent() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    sessionReminders: true,
    weeklyReports: true,
    darkMode: true,
    soundEffects: true,
    language: 'en',
  })
  const [profileData, setProfileData] = useState({
    full_name: '',
    company: '',
  })
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null)
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false)
  const [planBillingInterval, setPlanBillingInterval] = useState<'month' | 'year'>('month')
  const monthlyBtnRef = useRef<HTMLButtonElement>(null)
  const annualBtnRef = useRef<HTMLButtonElement>(null)
  const [toggleStyle, setToggleStyle] = useState({})
  const [purchases, setPurchases] = useState<any[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [showYearlyConfirm, setShowYearlyConfirm] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadSubscriptionDetails()
    fetchUserData()
    loadPurchaseHistory()
    
    // Check if user just upgraded
    if (searchParams.get('upgraded') === 'true') {
      // Refresh after a moment to show updated subscription
      setTimeout(() => {
        loadSubscriptionDetails()
        loadPurchaseHistory()
        router.replace('/billing')
      }, 1000)
    }
  }, [searchParams])

  useEffect(() => {
    const btnRef = planBillingInterval === 'month' ? monthlyBtnRef : annualBtnRef
    if (btnRef.current) {
      setToggleStyle({
        width: btnRef.current.offsetWidth,
        transform: `translateX(${btnRef.current.offsetLeft}px)`,
      })
    }
  }, [planBillingInterval])

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

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setUserData(data)
      setProfileData({
        full_name: data.full_name || '',
        company: (data as any)?.company || '',
      })
      // Load preferences from localStorage
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (e) {
          console.error('Error parsing saved settings:', e)
        }
      }
    }
  }

  const loadPurchaseHistory = async () => {
    setLoadingPurchases(true)
    try {
      const response = await fetch('/api/stripe/purchase-history')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Error loading purchase history:', error)
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setSettingsMessage(null)

    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings))
    
    // Could also save to database in a preferences column
    setSettingsMessage({ type: 'success', text: 'Settings saved successfully' })
    setSaving(false)
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSettingsMessage(null)
    }, 3000)
  }

  const handleSaveProfile = async () => {
    if (!userData) return

    setSavingProfile(true)
    setProfileMessage(null)

    try {
      // Build update object - only include company if it's provided
      const updateData: any = {
        full_name: profileData.full_name,
      }
      
      // Add company if provided (even if empty string, allow clearing it)
      if (profileData.company !== undefined) {
        updateData.company = profileData.company || null
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)

      if (error) {
        console.error('Profile update error:', error)
        setProfileMessage({ 
          type: 'error', 
          text: error.message || 'Failed to update profile. Please make sure the company field exists in the database.' 
        })
      } else {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
        // Refresh user data
        await fetchUserData()
      }
    } catch (error: any) {
      console.error('Profile update exception:', error)
      setProfileMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile' 
      })
    } finally {
      setSavingProfile(false)
      // Clear message after 3 seconds
      setTimeout(() => {
        setProfileMessage(null)
      }, 3000)
    }
  }

  const handleSwitchPlan = async (planType: string, priceId?: string) => {
    setSwitchingPlan(planType)
    try {
      const response = await fetch('/api/stripe/switch-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, priceId })
      })

      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      // Reload subscription details
      await loadSubscriptionDetails()
      setShowPlanSwitcher(false)
      router.push('/billing?tab=subscription&switched=true')
    } catch (error) {
      console.error('Error switching plan:', error)
      alert('Failed to switch plan')
    } finally {
      setSwitchingPlan(null)
    }
  }

  const handleCancelSubscription = async (immediately: boolean = false) => {
    if (!confirm(immediately 
      ? 'Are you sure you want to cancel your subscription immediately? You will lose access to premium features right away.'
      : 'Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.'
    )) {
      return
    }

    setSwitchingPlan('cancel')
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelImmediately: immediately })
      })

      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      // Reload subscription details
      await loadSubscriptionDetails()
      alert(data.message)
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setSwitchingPlan(null)
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
    setShowYearlyConfirm(true)
  }

  const confirmYearlyUpgrade = async () => {
    setShowYearlyConfirm(false)
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
        await loadPurchaseHistory()
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

  const getPlanName = (subscription: SubscriptionDetails | null) => {
    if (!subscription) return 'Unknown'
    
    const interval = subscription.price.interval
    if (subscription.plan === 'individual') {
      return interval === 'year' ? 'Individual yearly plan' : 'Individual monthly plan'
    }
    
    const planMap: Record<string, string> = {
      'team': 'Team',
      'free': 'Free'
    }
    return planMap[subscription.plan] || subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'past_due':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'canceled':
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
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
      <div className="min-h-screen bg-background dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-foreground animate-spin" />
      </div>
    )
  }

  const hasActiveSubscription = subscription && (subscription.status === 'active' || subscription.status === 'trialing')
  const isMonthly = subscription?.price.interval === 'month'
  const showYearlyBanner = hasActiveSubscription && isMonthly && subscription.yearlySavings
  const activeTab = searchParams.get('tab') || 'settings'

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Account Settings Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-background/70 backdrop-blur-sm rounded-xl border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Account Settings</h2>
              <nav className="space-y-1">
                <Link
                  href="/billing?tab=settings"
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'settings'
                      ? 'font-medium text-foreground bg-muted border border-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Account Settings</span>
                </Link>
                <Link
                  href="/billing?tab=subscription"
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'subscription'
                      ? 'font-medium text-foreground bg-muted border border-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Manage Subscription</span>
                  {hasActiveSubscription && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === 'subscription' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </span>
                  )}
                </Link>
                <Link
                  href="/billing?tab=purchase-history"
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'purchase-history'
                      ? 'font-medium text-foreground bg-muted border border-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Purchase History</span>
                  {hasActiveSubscription && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === 'purchase-history' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </span>
                  )}
                </Link>
                <Link
                  href="/billing?tab=cards"
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'cards'
                      ? 'font-medium text-foreground bg-muted border border-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Stored Cards</span>
                  {paymentMethod && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === 'cards' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-background/70 backdrop-blur-sm rounded-xl border border-border p-6">
              {activeTab === 'settings' && (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-6">Account Settings</h1>
                  <p className="text-muted-foreground mb-6">Manage your app preferences and profile</p>

                  {/* Profile & Personalization Section */}
                  <div className="bg-background/50 rounded-lg border border-border p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <User className="w-5 h-5 text-foreground mr-2" />
                      <h2 className="text-xl font-semibold text-foreground">Profile & Personalization</h2>
                    </div>

                    <div className="space-y-6">
                      {/* Avatar Upload */}
                      <div>
                        {userData && (
                          <AvatarUpload
                            currentAvatarUrl={(userData as any)?.avatar_url}
                            userId={userData.id}
                            onUploadComplete={(url) => {
                              setUserData({ ...userData, avatar_url: url } as any)
                              setProfileMessage({ type: 'success', text: 'Avatar updated successfully' })
                              setTimeout(() => setProfileMessage(null), 3000)
                            }}
                          />
                        )}
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Company */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={profileData.company}
                          onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your company name"
                        />
                      </div>

                      {/* Read-only Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Role
                          </label>
                          <p className="text-sm text-foreground">
                            {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Rep'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Virtual Earnings
                          </label>
                          <p className="text-sm text-foreground font-semibold">
                            ${userData?.virtual_earnings?.toFixed(2) || '0.00'}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Member Since
                          </label>
                          <p className="text-sm text-foreground">
                            {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Save Profile Button */}
                      <div className="flex justify-end pt-4 border-t border-border">
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>

                      {/* Profile Success/Error Message */}
                      {profileMessage && (
                        <div
                          className={`p-4 rounded-lg border ${
                            profileMessage.type === 'success'
                              ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                          }`}
                        >
                          {profileMessage.text}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="bg-background/50 rounded-lg border border-border p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <Bell className="w-5 h-5 text-foreground mr-2" />
                      <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Email Notifications</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Receive updates about your training progress
                          </p>
                        </div>
                        <Toggle
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Session Reminders</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Get reminded to practice daily
                          </p>
                        </div>
                        <Toggle
                          checked={settings.sessionReminders}
                          onCheckedChange={(checked) => setSettings({ ...settings, sessionReminders: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Weekly Reports</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Receive weekly performance summaries
                          </p>
                        </div>
                        <Toggle
                          checked={settings.weeklyReports}
                          onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appearance Section */}
                  <div className="bg-background/50 rounded-lg border border-border p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <Moon className="w-5 h-5 text-foreground mr-2" />
                      <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Sound Effects</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Play sounds during training sessions
                          </p>
                        </div>
                        <Toggle
                          checked={settings.soundEffects}
                          onCheckedChange={(checked) => setSettings({ ...settings, soundEffects: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>

                  {/* Success/Error Message */}
                  {settingsMessage && (
                    <div
                      className={`mt-4 p-4 rounded-lg border ${
                        settingsMessage.type === 'success'
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}
                    >
                      {settingsMessage.text}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'subscription' && (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-6">Manage Subscription</h1>

              {/* Yearly Upgrade Banner */}
              {showYearlyBanner && subscription.yearlySavings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 border border-border rounded-lg p-4 mb-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Save {subscription.yearlySavings.percent}% with a yearly plan
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The annual price for this subscription is only {formatPrice(subscription.yearlySavings.yearlyPrice)}/year. 
                        This saves you {formatPrice(subscription.yearlySavings.amount)}/year compared to your monthly subscription.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgradeYearly}
                    disabled={upgrading}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                  <div className="flex items-start gap-4 p-4 border border-border bg-background/50 rounded-lg">
                    {/* Logo/Icon */}
                    <div className="w-16 h-16 bg-background border border-border rounded-lg flex items-center justify-center flex-shrink-0 p-2">
                      <img 
                        src="/dooriq-key.png" 
                        alt="DoorIQ" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to text if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.innerHTML = '<span class="text-foreground font-bold text-lg">DI</span>'
                          }
                        }}
                      />
                    </div>

                    {/* Plan Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {getPlanName(subscription)}
                          </h3>
                          <button
                            className={`px-3 py-1 text-xs font-semibold rounded border ${
                              subscription.status === 'active' || subscription.status === 'trialing'
                                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                : subscription.status === 'past_due'
                                ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {getStatusText(subscription.status)}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowPlanSwitcher(true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Change Plan
                          </button>
                          <div className="relative menu-container">
                            <button
                              onClick={() => setShowMenu(showMenu === subscription.id ? null : subscription.id)}
                              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {showMenu === subscription.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    handleManageSubscription()
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-t-md transition-colors"
                                >
                                  Manage in Stripe Portal
                                </button>
                                <button
                                  onClick={() => {
                                    router.push('/pricing')
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  View Plans
                                </button>
                                <button
                                  onClick={() => {
                                    handleCancelSubscription(false)
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-b-md transition-colors"
                                >
                                  Cancel Subscription
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Renewal and Payment Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Renews on</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice(subscription.price.amount)} ({subscription.price.interval === 'month' ? 'per month' : 'per year'})
                            {subscription.price.interval === 'month' && (
                              <span className="text-muted-foreground text-xs ml-1">(incl. taxes)</span>
                            )}
                          </p>
                        </div>
                        {paymentMethod && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatCardBrand(paymentMethod.brand)} **** {paymentMethod.last4}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full border border-border">
                      1
                    </span>
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    1 - 1 of 1 subscriptions purchased
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-background border border-border rounded-full mb-4">
                    <CreditCard className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground mb-6">
                    Start a subscription to access all premium features
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              )}

              {/* Plan Switcher Modal */}
              {showPlanSwitcher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanSwitcher(false)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background rounded-xl border border-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-foreground">Switch Plan</h2>
                      <button
                        onClick={() => setShowPlanSwitcher(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Monthly/Yearly Toggle */}
                    <div className="flex justify-center mb-6">
                      <div className="relative flex w-fit items-center rounded-full bg-muted p-0.5">
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full bg-primary p-0.5"
                          style={toggleStyle}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                        <button
                          ref={monthlyBtnRef}
                          onClick={() => setPlanBillingInterval('month')}
                          className={`relative z-10 rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors ${
                            planBillingInterval === 'month'
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          ref={annualBtnRef}
                          onClick={() => setPlanBillingInterval('year')}
                          className={`relative z-10 rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors ${
                            planBillingInterval === 'year'
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Annual
                          <span className="ml-2 text-xs">(Save 30%)</span>
                        </button>
                      </div>
                    </div>

                    {/* Available Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Free Plan */}
                      <div className={`p-4 rounded-lg border bg-background/50 ${
                        !hasActiveSubscription 
                          ? 'border-primary' 
                          : 'border-border'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-foreground">Free</h3>
                          {!hasActiveSubscription && (
                            <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-foreground">$0</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-2 mb-4 text-sm text-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>5 practice sessions/month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>All AI training agents</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>Basic analytics</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => hasActiveSubscription ? handleSwitchPlan('free') : setShowPlanSwitcher(false)}
                          disabled={switchingPlan === 'free' || !hasActiveSubscription}
                          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            !hasActiveSubscription
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : hasActiveSubscription && subscription?.plan === 'free'
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {switchingPlan === 'free' ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Switching...
                            </span>
                          ) : hasActiveSubscription ? (
                            'Switch to Free'
                          ) : (
                            'Current Plan'
                          )}
                        </button>
                      </div>

                      {/* Individual Plan */}
                      <div className={`p-4 rounded-lg border bg-background/50 ${
                        hasActiveSubscription && subscription?.plan === 'individual'
                          ? 'border-primary' 
                          : 'border-border'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-foreground">Individual</h3>
                          {hasActiveSubscription && subscription?.plan === 'individual' && 
                           subscription?.price?.interval === planBillingInterval && (
                            <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-foreground">
                            ${planBillingInterval === 'month' ? '20' : '14'}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                          {planBillingInterval === 'year' && (
                            <span className="text-xs text-muted-foreground ml-2">($168/year)</span>
                          )}
                        </div>
                        <ul className="space-y-2 mb-4 text-sm text-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>50 practice sessions/month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>All AI training agents</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>Advanced analytics</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>Call upload & analysis</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => {
                            const priceId = planBillingInterval === 'month'
                              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY
                              : process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY
                            if (priceId) {
                              handleSwitchPlan('individual', priceId)
                            }
                          }}
                          disabled={
                            switchingPlan === 'individual' || 
                            (hasActiveSubscription && subscription?.plan === 'individual' && 
                             subscription?.price?.interval === planBillingInterval) || false
                          }
                          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            hasActiveSubscription && subscription?.plan === 'individual' && 
                            subscription?.price?.interval === planBillingInterval
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {switchingPlan === 'individual' ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Switching...
                            </span>
                          ) : hasActiveSubscription && subscription?.plan === 'individual' && 
                            subscription?.price?.interval === planBillingInterval ? (
                            'Current Plan'
                          ) : (
                            hasActiveSubscription ? 'Switch to Individual' : 'Upgrade to Individual'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Cancel Subscription Option */}
                    {hasActiveSubscription && (
                      <div className="pt-4 border-t border-border">
                        <button
                          onClick={() => {
                            setShowPlanSwitcher(false)
                            handleCancelSubscription(false)
                          }}
                          disabled={switchingPlan === 'cancel'}
                          className="w-full px-4 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border border-red-200 dark:border-red-800"
                        >
                          {switchingPlan === 'cancel' ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Canceling...
                            </span>
                          ) : (
                            'Cancel Subscription'
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
                </>
              )}

              {activeTab === 'purchase-history' && (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-6">Purchase History</h1>
                  {loadingPurchases ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : purchases.length > 0 ? (
                    <div className="space-y-4">
                      {purchases.map((purchase) => (
                        <div key={purchase.id} className="p-4 border border-border bg-background/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-sm font-semibold text-foreground">{purchase.description}</h3>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  purchase.status === 'paid' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : purchase.status === 'open'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {purchase.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {new Date(purchase.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {formatPrice(purchase.amount, purchase.currency)}
                                {purchase.interval && ` / ${purchase.interval}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {purchase.invoiceUrl && (
                                <a
                                  href={purchase.invoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                  title="View Invoice"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {purchase.receiptUrl && (
                                <a
                                  href={purchase.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                  title="View Receipt"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-background border border-border rounded-full mb-4">
                        <FileText className="w-8 h-8 text-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Purchase History</h3>
                      <p className="text-muted-foreground mb-6">
                        Your purchase history will appear here once you make a subscription or purchase credits.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                      >
                        View Plans
                      </Link>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'cards' && (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-6">Stored Cards</h1>
                  {paymentMethod ? (
                    <div className="space-y-4">
                      <div className="p-4 border border-border bg-background/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Expires {paymentMethod.expMonth.toString().padStart(2, '0')}/{paymentMethod.expYear}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Manage'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-background border border-border rounded-full mb-4">
                        <CreditCard className="w-8 h-8 text-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Methods</h3>
                      <p className="text-muted-foreground mb-6">
                        Add a payment method to start your subscription.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                      >
                        View Plans
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Upgrade Confirmation Dialog */}
      <Dialog open={showYearlyConfirm} onOpenChange={setShowYearlyConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Yearly Plan Upgrade
            </DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-3">
                <p>
                  You are about to upgrade to the <strong>Individual yearly plan</strong>.
                </p>
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">This will:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Charge your card <strong className="text-foreground">{subscription?.yearlySavings ? formatPrice(subscription.yearlySavings.yearlyPrice) : '$168.00'}</strong> immediately</li>
                    <li>Switch your billing to annual payments</li>
                    <li>Save you <strong className="text-foreground">{subscription?.yearlySavings?.percent || 30}%</strong> compared to monthly billing</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your subscription will renew automatically on {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'your renewal date'}.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <button
              onClick={() => setShowYearlyConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmYearlyUpgrade}
              disabled={upgrading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {upgrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm & Upgrade'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-foreground animate-spin" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  )
}
