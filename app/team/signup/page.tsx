'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, ArrowRight, CheckCircle2, Loader2, TrendingUp, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function TeamSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planType = searchParams.get('plan') || 'team' // 'starter' or 'team'
  const billingParam = searchParams.get('billing') // 'annual' or null
  const redirectParam = searchParams.get('redirect') // Where to redirect after trial starts
  const isUpgrade = searchParams.get('upgrade') === 'true' // Upgrade flow - skip org name
  
  const [step, setStep] = useState(isUpgrade ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  const [organizationName, setOrganizationName] = useState('')
  const [seatCount, setSeatCount] = useState(planType === 'starter' ? 1 : 2) // Individual: 1 seat, Team: 2+ seats
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(billingParam === 'annual' ? 'annual' : 'monthly')
  
  // ROI Calculator state
  const [roiDealValue, setRoiDealValue] = useState(500)

  // Plan configuration
  // Individual: 1 seat at $49/month (flat rate)
  // Team: 2-100 seats at $39/seat/month
  const planConfig = planType === 'starter' 
    ? { 
        name: 'Individual Plan',
        pricePerSeat: 49,
        minSeats: 1,
        maxSeats: 1,
        planId: 'starter'
      }
    : { 
        name: 'Team Plan',
        pricePerSeat: 39,
        minSeats: 2,
        maxSeats: 100,
        planId: 'team'
      }

  // Individual plan: flat $49, Team plan: per seat pricing
  const monthlyCost = planConfig.planId === 'starter' ? planConfig.pricePerSeat : seatCount * planConfig.pricePerSeat
  // Annual pricing: 2 months free = 10 months payment
  const annualCost = Math.round(monthlyCost * 10)
  const annualSavings = monthlyCost * 12 - annualCost
  const trialDays = 7

  // ROI Calculator - matching home page format
  const calculateROI = () => {
    if (seatCount === 0 || roiDealValue === 0) {
      return {
        monthlyCost: 0,
        extraRevenue: 0,
        netProfit: 0,
        roi: 0,
        roiMultiplier: 0
      }
    }

    const monthlyCostCalc = seatCount * planConfig.pricePerSeat
    
    // Each rep closes 1 extra deal per month
    const extraRevenue = seatCount * roiDealValue
    
    // Net profit
    const netProfit = extraRevenue - monthlyCostCalc
    
    // ROI calculation: (Net Profit / Cost) * 100
    const roi = monthlyCostCalc > 0 ? (netProfit / monthlyCostCalc) * 100 : 0
    
    // ROI multiplier
    const roiMultiplier = monthlyCostCalc > 0 ? extraRevenue / monthlyCostCalc : 0
    
    return {
      monthlyCost: monthlyCostCalc,
      extraRevenue: Math.round(extraRevenue),
      netProfit: Math.round(netProfit),
      roi: Math.round(roi),
      roiMultiplier: Math.round(roiMultiplier * 10) / 10
    }
  }

  const roiData = calculateROI()

  // Check authentication on mount and fetch organization name if upgrading
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setIsAuthenticated(false)
          setCheckingAuth(false)
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}${isUpgrade ? '&upgrade=true' : ''}`)
          router.push(`/auth/login?next=${returnUrl}`)
          return
        }
        
        setIsAuthenticated(true)
        setCheckingAuth(false)

        // If upgrading, fetch existing organization name
        if (isUpgrade) {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

          if (userData?.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', userData.organization_id)
              .single()

            if (orgData?.name) {
              setOrganizationName(orgData.name)
            }
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err)
        setIsAuthenticated(false)
        setCheckingAuth(false)
        const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}${isUpgrade ? '&upgrade=true' : ''}`)
        router.push(`/auth/login?next=${returnUrl}`)
      }
    }

    checkAuth()
  }, [planType, router, isUpgrade])

  // Update seat count when plan type changes
  useEffect(() => {
    if (planType === 'starter') {
      // Individual plan: exactly 1 seat
      if (seatCount !== 1) {
        setSeatCount(1)
      }
    } else {
      // Team plan: 2-100 seats
      if (seatCount < 2) {
        setSeatCount(2) // Default to 2 for team
      } else if (seatCount > 100) {
        setSeatCount(100)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType])

  const handleNext = () => {
    if (step === 1 && organizationName.trim()) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1 && !(isUpgrade && step === 2)) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    // Double-check authentication before submitting
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}`)
      router.push(`/auth/login?next=${returnUrl}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Send notification email first (don't wait for it)
      fetch('/api/team/signup-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          seatCount,
          planType: planConfig.planId,
          billingPeriod,
          monthlyCost,
          annualCost: billingPeriod === 'annual' ? annualCost : undefined,
          userEmail: userEmail.trim() || undefined,
          userName: userName.trim() || undefined,
        }),
      }).catch(err => console.error('Failed to send notification email:', err))

      const response = await fetch('/api/team/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          seatCount,
          planType: planConfig.planId,
          billingPeriod,
          userEmail: userEmail.trim() || undefined,
          userName: userName.trim() || undefined,
          redirect: redirectParam || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 font-sans">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-32 pb-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <LogIn className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-space font-bold text-white mb-4">Sign In Required</h2>
            <p className="text-gray-300 font-sans mb-6">
              Please sign in to start your free trial and set up your team plan.
            </p>
            <Button
              onClick={() => {
                const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}`)
                router.push(`/auth/login?next=${returnUrl}`)
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Sign In <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-sm text-gray-400 mt-4 font-sans">
              Don't have an account?{' '}
              <a href={`/auth/signup?next=${encodeURIComponent(`/team/signup?plan=${planType}`)}`} className="text-purple-400 hover:text-purple-300">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-32 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-space font-bold text-white mb-2">Start Your {planConfig.name}</h1>
          <p className="text-gray-400 font-sans">Get your sales team trained with DoorIQ</p>
        </div>

        {/* Progress Steps */}
        {!isUpgrade && (
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > s ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Organization Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-space font-bold text-white">Organization Name</h2>
              </div>
              <div>
                <Label htmlFor="orgName" className="text-gray-300 font-sans">
                  What's your company or organization name?
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Sales Co."
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!organizationName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Number of Seats */}
          {step === 2 && (
            <div className="space-y-6">
              {isUpgrade && organizationName && (
                <div className="mb-4 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
                  <p className="text-sm text-purple-200 font-sans">
                    <span className="font-semibold">Organization:</span> {organizationName}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-space font-bold text-white">
                  {isUpgrade ? 'Add More Seats' : 'Team Size'}
                </h2>
              </div>
              <div>
                <Label htmlFor="seats" className="text-gray-300 font-sans">
                  {isUpgrade 
                    ? 'How many total seats do you need?'
                    : 'How many sales reps will be using DoorIQ?'}
                </Label>
                <div className="mt-4">
                  <input
                    type="range"
                    min={planConfig.minSeats}
                    max={planConfig.maxSeats}
                    value={seatCount}
                    onChange={(e) => setSeatCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-400 font-sans">
                    <span>{planConfig.minSeats}</span>
                    <span className="text-2xl font-space font-bold text-white">{seatCount}</span>
                    <span>{planConfig.maxSeats}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400 font-sans">
                  You can always add or remove seats later
                </p>
              </div>

              {/* Pricing Display */}
              <div className="mt-6 p-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <h3 className="text-lg font-space font-bold text-white mb-4 text-center">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                    <span className="text-sm text-gray-400 font-sans">Monthly</span>
                    <span className="text-xl font-space font-bold text-white">
                      ${monthlyCost.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-sans">Annual</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                        Save 15%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-space font-bold text-white block">
                        ${Math.round(annualCost / 12).toLocaleString()}/mo
                      </span>
                      <span className="text-xs text-gray-500 font-sans">
                        ${annualCost.toLocaleString()}/year
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Calculator - Matching Home Page */}
              <div className="relative mt-6">
                {/* Grid Background */}
                <div
                  className={cn(
                    'z-[-10] pointer-events-none absolute -inset-8',
                    'bg-[linear-gradient(to_right,theme(colors.white/.06)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.06)_1px,transparent_1px)]',
                    'bg-[size:24px_24px]',
                    '[mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,var(--background)_20%,transparent_70%)]',
                  )}
                />
                
                {/* ROI Calculator Card */}
                <div className="bg-gradient-to-br from-card via-card/95 to-card dark:from-black dark:via-slate-950 dark:to-black border-2 border-border/40 dark:border-white/40 rounded-2xl p-5 sm:p-6 md:p-8 relative z-10 shadow-2xl shadow-purple-500/10">
                  {/* ROI Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tight font-space" style={{ letterSpacing: '-0.02em' }}>
                      Calculate Your ROI
                    </h3>
                  </div>

                  {/* Input for Deal Value */}
                  <div className="mb-6">
                    <div>
                      <label className="block text-sm sm:text-base font-bold text-foreground mb-3 text-center tracking-wide font-space">
                        Value per Extra Deal ($):
                      </label>
                      <div className="text-center">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          step="50"
                          value={roiDealValue || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                            setRoiDealValue(Math.max(0, Math.min(1000, value)))
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              setRoiDealValue(500)
                            }
                          }}
                          className="inline-block px-4 py-2 rounded-lg border-2 border-border/40 dark:border-white/40 bg-background dark:bg-black text-foreground text-xl font-bold font-space text-center w-32 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ROI Results - Enhanced (Monthly) */}
                  {roiData.monthlyCost > 0 && roiDealValue > 0 && (
                    <div className="space-y-3 border-t-2 border-border/30 dark:border-white/30 pt-5 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-medium font-sans">Extra Revenue:</span>
                        <div className="flex items-center gap-2">
                          <motion.span 
                            key={Math.round(roiData.extraRevenue)}
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.3 }}
                            className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300 text-lg sm:text-xl font-bold font-space"
                          >
                            +${Math.round(roiData.extraRevenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                          </motion.span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-medium font-sans">DoorIQ Cost:</span>
                        <span className="text-red-500 dark:text-red-400 text-lg sm:text-xl font-bold font-space">
                          -${roiData.monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                        </span>
                      </div>
                      <div className="border-t-2 border-emerald-500/40 pt-3 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg px-3 py-2 -mx-3 sm:-mx-4">
                        <span className="text-foreground text-base font-semibold font-sans">Net Profit:</span>
                        <motion.div
                          key={Math.round(roiData.netProfit)}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-end gap-1"
                        >
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 text-2xl sm:text-3xl md:text-4xl font-black font-space">
                            ${Math.round(roiData.netProfit).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                          </span>
                          <span className="text-emerald-400 text-sm font-semibold font-sans">
                            {roiData.roiMultiplier.toFixed(1)}x ROI ({Math.round(roiData.roi)}%)
                          </span>
                        </motion.div>
                      </div>
                      <p className="text-xs text-foreground/60 italic font-sans pt-2 border-t border-border/20">
                        *Assumes each rep closes just 1 extra deal per month
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                {!isUpgrade && (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-space font-bold text-white mb-6">Review Your Plan</h2>
              
              <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-sans">Organization:</span>
                  <span className="text-white font-space font-semibold">{organizationName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-sans">Seats:</span>
                  <span className="text-white font-space font-semibold">{seatCount}</span>
                </div>
                
                {/* Billing Period Toggle */}
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-gray-300 block font-sans">Billing Period</Label>
                    {billingPeriod === 'monthly' && (
                      <Button
                        type="button"
                        onClick={() => setBillingPeriod('annual')}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-sans font-medium px-4 py-1.5 h-auto"
                      >
                        Save 15% switching to an annual plan
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setBillingPeriod('monthly')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-sans font-medium transition-colors ${
                        billingPeriod === 'monthly'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingPeriod('annual')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-sans font-medium transition-colors ${
                        billingPeriod === 'annual'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  {billingPeriod === 'monthly' ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 font-sans">Monthly Cost:</span>
                        <span className="text-2xl font-space font-bold text-white">${monthlyCost.toLocaleString()}/month</span>
                      </div>
                      <p className="text-sm text-gray-400 font-sans">
                        ${planConfig.pricePerSeat} per seat × {seatCount} seats
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 font-sans">Annual Cost:</span>
                        <span className="text-2xl font-space font-bold text-white">${annualCost.toLocaleString()}/year</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1 font-sans">
                        ${planConfig.pricePerSeat} per seat × {seatCount} seats × 10 months
                      </p>
                      <div className="flex items-center gap-2 text-green-400 text-sm font-sans">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save ${annualSavings.toLocaleString()} with annual billing (2 months free)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-sans">
                        Equivalent to ${Math.round(annualCost / 12).toLocaleString()}/month
                      </p>
                    </>
                  )}
                </div>
                
                {/* Only show free trial message for individual plans (1 seat) */}
                {seatCount === 1 && (
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-purple-300">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-space font-semibold">{trialDays}-day free trial</span>
                    </div>
                    <p className="text-sm text-purple-200 mt-1 font-sans">
                      No charge for {trialDays} days, then {billingPeriod === 'monthly' 
                        ? `$${monthlyCost.toLocaleString()}/month`
                        : `$${annualCost.toLocaleString()}/year`
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {!isUpgrade && (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isAuthenticated}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {seatCount === 1 ? 'Start Free Trial' : 'Subscribe Now'} <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-400 font-sans">
          <p>All plans include unlimited practice sessions and full access to all features.</p>
          <p className="mt-2">
            Questions? <a href="/contact-sales" className="text-purple-400 hover:text-purple-300">Contact Sales</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TeamSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 font-sans">Loading...</p>
        </div>
      </div>
    }>
      <TeamSignupContent />
    </Suspense>
  )
}

