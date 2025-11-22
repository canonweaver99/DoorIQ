'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, ArrowRight, CheckCircle2, Loader2, TrendingUp, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function TeamSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planType = searchParams.get('plan') || 'team' // 'starter' or 'team'
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  const [organizationName, setOrganizationName] = useState('')
  const [seatCount, setSeatCount] = useState(planType === 'starter' ? 5 : 25)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  
  // ROI Calculator state
  const [roiDealValue, setRoiDealValue] = useState(500)

  // Plan configuration
  const planConfig = planType === 'starter' 
    ? { 
        name: 'Starter Plan',
        pricePerSeat: 99,
        minSeats: 1,
        maxSeats: 20,
        planId: 'starter'
      }
    : { 
        name: 'Team Plan',
        pricePerSeat: 69,
        minSeats: 21,
        maxSeats: 100,
        planId: 'team'
      }

  const monthlyCost = seatCount * planConfig.pricePerSeat
  // Annual pricing: 2 months free = 10 months payment
  const annualCost = Math.round(monthlyCost * 10)
  const annualSavings = monthlyCost * 12 - annualCost
  const trialDays = 14

  // ROI Calculator
  const calculateROI = () => {
    if (seatCount === 0 || roiDealValue === 0) {
      return {
        monthlyCost: 0,
        extraDealsPerMonth: 0,
        revenueIncrease: 0,
        roi: 0,
        paybackWeeks: 0
      }
    }

    const monthlyCostCalc = seatCount * planConfig.pricePerSeat
    
    // Each rep closes 1 extra deal per month
    const extraDealsPerMonth = seatCount * 1
    
    // Revenue increase from extra deals
    const revenueIncrease = extraDealsPerMonth * roiDealValue
    
    // ROI calculation: (Revenue Increase - Cost) / Cost * 100
    const roi = monthlyCostCalc > 0 ? ((revenueIncrease - monthlyCostCalc) / monthlyCostCalc) * 100 : 0
    
    // Payback period (weeks to recover cost)
    // Convert monthly revenue to weekly: monthlyRevenue / 4.33 (average weeks per month)
    const weeklyRevenue = revenueIncrease / 4.33
    const paybackWeeks = weeklyRevenue > 0 ? monthlyCostCalc / weeklyRevenue : 0
    
    return {
      monthlyCost: monthlyCostCalc,
      extraDealsPerMonth: extraDealsPerMonth,
      revenueIncrease: Math.round(revenueIncrease),
      roi: Math.round(roi * 10) / 10,
      paybackWeeks: Math.round(paybackWeeks * 10) / 10
    }
  }

  const roiData = calculateROI()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setIsAuthenticated(false)
          setCheckingAuth(false)
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}`)
          router.push(`/auth/login?next=${returnUrl}`)
          return
        }
        
        setIsAuthenticated(true)
        setCheckingAuth(false)
      } catch (err) {
        console.error('Error checking authentication:', err)
        setIsAuthenticated(false)
        setCheckingAuth(false)
        const returnUrl = encodeURIComponent(`/team/signup?plan=${planType}`)
        router.push(`/auth/login?next=${returnUrl}`)
      }
    }

    checkAuth()
  }, [planType, router])

  // Update seat count when plan type changes
  useEffect(() => {
    if (planType === 'starter') {
      if (seatCount > 20) {
        setSeatCount(20)
      } else if (seatCount < 1) {
        setSeatCount(5) // Default to 5 for starter
      }
    } else {
      if (seatCount < 21) {
        setSeatCount(25) // Default to 25 for team
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
    if (step > 1) {
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
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-space font-bold text-white">Team Size</h2>
              </div>
              <div>
                <Label htmlFor="seats" className="text-gray-300 font-sans">
                  How many sales reps will be using DoorIQ?
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

              {/* ROI Calculator */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-lg p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-space font-semibold text-white">ROI Calculator</h3>
                </div>
                <p className="text-sm text-gray-300 mb-4 font-sans">
                  See how DoorIQ impacts your team's performance
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dealValue" className="text-gray-300 text-sm font-sans">
                      Average Deal Value ($)
                    </Label>
                    <Input
                      id="dealValue"
                      type="number"
                      value={roiDealValue}
                      onChange={(e) => setRoiDealValue(parseFloat(e.target.value) || 0)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white font-sans"
                      placeholder="5000"
                    />
                    <p className="text-xs text-gray-400 mt-1 font-sans">
                      Enter your average deal value to calculate ROI
                    </p>
                  </div>
                </div>

                {/* ROI Results */}
                {roiData.monthlyCost > 0 && roiDealValue > 0 && (
                  <div className="mt-6 pt-4 border-t border-purple-700/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-sans">Monthly Cost</p>
                        <p className="text-lg font-space font-bold text-white">${roiData.monthlyCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-sans">Extra Deals/Month</p>
                        <p className="text-lg font-space font-bold text-purple-400">{roiData.extraDealsPerMonth}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-sans">Revenue Increase</p>
                        <p className="text-lg font-space font-bold text-green-400">+${roiData.revenueIncrease.toLocaleString()}/mo</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-sans">ROI</p>
                        <p className="text-lg font-space font-bold text-purple-400">{roiData.roi > 0 ? '+' : ''}{roiData.roi}%</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-sans">Payback Period</span>
                        <span className="text-lg font-space font-bold text-blue-400">
                          {roiData.paybackWeeks < 0.1 ? '<0.1' : roiData.paybackWeeks.toFixed(1)} week{roiData.paybackWeeks !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center font-sans">
                      *Based on each rep closing 1 extra deal per month. Results may vary.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Back
                </Button>
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
                  <Label className="text-gray-300 mb-3 block font-sans">Billing Period</Label>
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
                      Annual <span className="text-xs text-green-400">(Save ${annualSavings.toLocaleString()})</span>
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
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={loading}
                >
                  Back
                </Button>
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
                      Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
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

