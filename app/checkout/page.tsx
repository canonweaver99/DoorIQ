'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/app/landing/page'
import { ArrowLeft, CreditCard, Building2, User, Mail, Phone, Users, Tag } from 'lucide-react'
import Link from 'next/link'

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'starter'
  const billing = searchParams.get('billing') || 'monthly'

  const planDetails = {
    starter: { name: 'Individual', price: 49, minReps: 1, maxReps: 1 }, // Individual: 1 seat only
    team: { name: 'Team', price: 39, minReps: 2, maxReps: 100 }, // Team: 2-100 reps
    enterprise: { name: 'Enterprise', price: 29, minReps: 101, maxReps: 500 }, // Enterprise: 101+ reps
  }

  // Auto-detect plan based on initial rep count
  const getInitialReps = () => {
    if (initialPlan === 'starter') return '1' // Individual plan: 1 seat
    if (initialPlan === 'team') return '2' // Team plan: starts at 2 reps
    if (initialPlan === 'enterprise') return '101' // Enterprise plan: starts at 101 reps
    return '1'
  }

  const [formData, setFormData] = useState({
    companyName: '',
    yourName: '',
    workEmail: '',
    phone: '',
    numberOfReps: getInitialReps(),
    discountCode: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(billing === 'annual' ? 'annual' : 'monthly')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [validatedDiscount, setValidatedDiscount] = useState<{
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
  } | null>(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  // Auto-detect plan tier based on rep count
  // Individual: 1 seat, Team: 2-100 reps, Enterprise: 101+ reps
  const repCount = parseInt(formData.numberOfReps) || 0
  const detectedPlan = repCount >= 101 ? 'enterprise' : repCount >= 2 ? 'team' : repCount === 1 ? 'starter' : initialPlan
  const selectedPlan = planDetails[detectedPlan as keyof typeof planDetails] || planDetails.starter
  
  const monthlyPrice = selectedPlan.price
  const annualPrice = Math.round(monthlyPrice * 0.8) // 20% discount
  const pricePerRep = billingPeriod === 'annual' ? annualPrice : monthlyPrice

  // Calculate total
  // Individual plan: $49 flat (not per rep)
  // Team/Enterprise: price per rep
  const baseTotalMonthly = selectedPlan.name === 'Individual' ? pricePerRep : repCount * pricePerRep
  const baseTotalAnnual = baseTotalMonthly * 12

  // Apply discount if validated
  const calculateDiscountedPrice = (basePrice: number) => {
    if (!validatedDiscount) return basePrice
    
    if (validatedDiscount.discount_type === 'percentage') {
      return basePrice * (1 - validatedDiscount.discount_value / 100)
    } else {
      // Fixed amount discount
      return Math.max(0, basePrice - validatedDiscount.discount_value)
    }
  }

  const totalMonthly = calculateDiscountedPrice(baseTotalMonthly)
  const totalAnnual = calculateDiscountedPrice(baseTotalAnnual)

  // Function to validate discount code
  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      return
    }

    setValidatingDiscount(true)
    setDiscountError(null)

    try {
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDiscountError(data.error || 'Invalid discount code')
        setDiscountApplied(false)
        setValidatedDiscount(null)
        return
      }

      setValidatedDiscount({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      })
      setDiscountApplied(true)
      setDiscountError(null)
    } catch (error) {
      console.error('Error validating discount code:', error)
      setDiscountError('Failed to validate discount code. Please try again.')
      setDiscountApplied(false)
      setValidatedDiscount(null)
    } finally {
      setValidatingDiscount(false)
    }
  }

  // Check if Individual plan (1 rep) gets free trial
  const hasFreeTrial = repCount === 1 && selectedPlan.name === 'Individual'

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Auto-adjust rep count if it's out of range for the detected plan
    if (field === 'numberOfReps') {
      const newRepCount = parseInt(value) || 0
      if (newRepCount > 0) {
        // Plan will auto-detect, but ensure rep count is valid
        const newDetectedPlan = newRepCount >= 101 ? 'enterprise' : newRepCount >= 2 ? 'team' : newRepCount === 1 ? 'starter' : null
        if (newDetectedPlan) {
          const newPlan = planDetails[newDetectedPlan as keyof typeof planDetails]
          if (newRepCount < newPlan.minReps || newRepCount > newPlan.maxReps) {
            // Rep count is out of range for detected plan, but that's okay - we'll validate on submit
          }
        }
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.yourName.trim()) {
      newErrors.yourName = 'Your name is required'
    }

    if (!formData.workEmail.trim()) {
      newErrors.workEmail = 'Work email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = 'Please enter a valid email address'
    }

    const reps = parseInt(formData.numberOfReps)
    if (!reps || reps < 1) {
      newErrors.numberOfReps = 'Minimum 1 rep required'
    } else if (reps > 500) {
      newErrors.numberOfReps = 'Maximum 500 reps allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Show confirmation first
    setIsSubmitting(true)
    setErrors({})

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          yourName: formData.yourName,
          workEmail: formData.workEmail,
          phone: formData.phone || undefined,
          numberOfReps: repCount,
          plan: detectedPlan,
          billingPeriod: billingPeriod,
          discountCode: validatedDiscount?.code || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Store checkout URL and show confirmation
      if (data.url) {
        setCheckoutUrl(data.url)
        setShowConfirmation(true)
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      setErrors({ submit: error.message || 'Failed to process checkout. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const handleConfirmPayment = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setCheckoutUrl(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/landing/pricing"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pricing</span>
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div>
              <h1 className="font-space text-3xl sm:text-4xl font-light tracking-tight mb-2">
                Checkout
              </h1>
              <p className="text-white/70 font-sans mb-8">
                Complete your purchase to get started with DoorIQ
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div>
                  <Label htmlFor="companyName" className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter your company name"
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-400 mt-1">{errors.companyName}</p>
                  )}
                </div>

                {/* Your Name */}
                <div>
                  <Label htmlFor="yourName" className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name *
                  </Label>
                  <Input
                    id="yourName"
                    type="text"
                    value={formData.yourName}
                    onChange={(e) => handleInputChange('yourName', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter your full name"
                  />
                  {errors.yourName && (
                    <p className="text-xs text-red-400 mt-1">{errors.yourName}</p>
                  )}
                </div>

                {/* Work Email */}
                <div>
                  <Label htmlFor="workEmail" className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Work Email *
                  </Label>
                  <Input
                    id="workEmail"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => handleInputChange('workEmail', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="your.email@company.com"
                  />
                  {errors.workEmail && (
                    <p className="text-xs text-red-400 mt-1">{errors.workEmail}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Number of Reps */}
                <div>
                  <Label htmlFor="numberOfReps" className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Number of Reps *
                  </Label>
                  <Input
                    id="numberOfReps"
                    type="number"
                    min={selectedPlan.minReps}
                    max={selectedPlan.maxReps}
                    value={formData.numberOfReps}
                    onChange={(e) => handleInputChange('numberOfReps', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  {errors.numberOfReps && (
                    <p className="text-xs text-red-400 mt-1">{errors.numberOfReps}</p>
                  )}
                  {repCount > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-white/80 font-sans mb-1">
                        Selected Plan: <span className="font-semibold text-white">
                          {selectedPlan.name}
                        </span>
                      </p>
                      <p className="text-xs text-white/60">
                        {selectedPlan.name === 'Individual' 
                          ? 'Individual plan: 1 seat'
                          : `${selectedPlan.name} plan: ${selectedPlan.minReps}-${selectedPlan.maxReps} reps`}
                      </p>
                    </div>
                  )}
                  {repCount > 0 && repCount < 1 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Minimum 1 rep required
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {errors.submit && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 text-base mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Preparing Checkout...' : 'Continue to Payment'}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="md:sticky md:top-24 h-fit">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h2 className="font-space text-xl font-medium mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 font-sans">Plan</span>
                    <span className="text-white font-semibold">{selectedPlan.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 font-sans">Billing</span>
                    <span className="text-white font-semibold capitalize">{billingPeriod}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 font-sans">Number of Reps</span>
                    <span className="text-white font-semibold">{repCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 font-sans">Price per Rep</span>
                    <span className="text-white font-semibold">${pricePerRep}/rep/month</span>
                  </div>


                  <div className="pt-4 border-t border-white/10">
                    {billingPeriod === 'annual' ? (
                      <>
                        {validatedDiscount && (
                          <>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white/70 font-sans text-sm">Subtotal</span>
                              <span className="text-white/70 font-sans text-sm line-through">${baseTotalAnnual.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-green-400 font-sans text-sm">
                                Discount ({validatedDiscount.discount_type === 'percentage' ? `${validatedDiscount.discount_value}%` : `$${validatedDiscount.discount_value}`})
                              </span>
                              <span className="text-green-400 font-semibold text-sm">
                                -${(baseTotalAnnual - totalAnnual).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/70 font-sans text-sm">Monthly Equivalent</span>
                          <span className="text-white font-semibold">${totalMonthly.toLocaleString()}/month</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">Due Today</span>
                          {hasFreeTrial ? (
                            <span className="text-green-400 font-bold text-xl">7 day free trial</span>
                          ) : (
                            <span className="text-white font-bold text-xl">${Math.round(totalAnnual).toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {hasFreeTrial 
                            ? 'Start your 7-day free trial • No charge until trial ends'
                            : `Billed annually • ${Math.round(totalAnnual / 12).toLocaleString()}/month equivalent`
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        {validatedDiscount && (
                          <>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white/70 font-sans text-sm">Subtotal</span>
                              <span className="text-white/70 font-sans text-sm line-through">${baseTotalMonthly.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-green-400 font-sans text-sm">
                                Discount ({validatedDiscount.discount_type === 'percentage' ? `${validatedDiscount.discount_value}%` : `$${validatedDiscount.discount_value}`})
                              </span>
                              <span className="text-green-400 font-semibold text-sm">
                                -${(baseTotalMonthly - totalMonthly).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">Due Today</span>
                          {hasFreeTrial ? (
                            <span className="text-green-400 font-bold text-lg">7 day free trial</span>
                          ) : (
                            <span className="text-white font-bold text-lg">${Math.round(totalMonthly).toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {hasFreeTrial 
                            ? 'Start your 7-day free trial • No charge until trial ends'
                            : 'Billed monthly • Renews every month'
                          }
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Billing Period Toggle */}
                <div className="pt-4 border-t border-white/10">
                  <Label className="text-white/80 font-sans mb-3 block">Billing Period</Label>
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/60'}`}>
                          Monthly
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            billingPeriod === 'annual' 
                              ? 'bg-purple-600 border-2 border-purple-500' 
                              : 'bg-white/20 border-2 border-transparent'
                          }`}
                          role="switch"
                          aria-checked={billingPeriod === 'annual'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-white' : 'text-white/60'}`}>
                          Annual
                        </span>
                        {billingPeriod === 'annual' && (
                          <span className="ml-2 text-xs text-green-400 font-semibold">
                            Save 20%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {billingPeriod === 'monthly' && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm text-center font-bold">
                        💰 Switch to annual billing to save 20% (${Math.round(totalMonthly * 0.2 * 12).toLocaleString()}/year savings)
                      </p>
                    </div>
                  )}
                </div>

                {/* Discount Code */}
                <div className="pt-4 border-t border-white/10">
                  <Label className="text-white/80 font-sans mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Discount Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter discount code"
                      value={formData.discountCode}
                      onChange={(e) => {
                        setFormData({ ...formData, discountCode: e.target.value })
                        setDiscountError(null)
                        setDiscountApplied(false)
                        setValidatedDiscount(null)
                      }}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                    <Button
                      type="button"
                      onClick={() => validateDiscountCode(formData.discountCode)}
                      disabled={discountApplied || !formData.discountCode.trim() || validatingDiscount}
                      className="bg-white hover:bg-gray-100 text-gray-900 border-0 font-medium"
                    >
                      {validatingDiscount ? 'Validating...' : discountApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                  {discountError && (
                    <p className="text-red-400 text-sm mt-2">{discountError}</p>
                  )}
                  {discountApplied && (
                    <p className="text-green-400 text-sm mt-2">Discount code applied successfully!</p>
                  )}
                </div>

                {billingPeriod === 'annual' && (
                  <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 text-sm font-medium text-center">
                      Save 20% with annual billing
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-2xl font-space font-bold text-white mb-4">Confirm Your Purchase</h2>
            <p className="text-white/80 font-sans mb-6">
              You're about to proceed to secure payment processing. Please review your order details:
            </p>
            
            <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70 font-sans">Plan:</span>
                <span className="text-white font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 font-sans">Reps:</span>
                <span className="text-white font-semibold">{repCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 font-sans">Billing:</span>
                <span className="text-white font-semibold capitalize">{billingPeriod}</span>
              </div>
              {validatedDiscount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/70 font-sans">Subtotal:</span>
                    <span className="text-white/70 font-sans line-through">
                      {billingPeriod === 'annual' 
                        ? `$${baseTotalAnnual.toLocaleString()}`
                        : `$${baseTotalMonthly.toLocaleString()}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400 font-sans">Discount:</span>
                    <span className="text-green-400 font-semibold">
                      {billingPeriod === 'annual' 
                        ? `-$${(baseTotalAnnual - totalAnnual).toLocaleString()}`
                        : `-$${(baseTotalMonthly - totalMonthly).toLocaleString()}`
                      }
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-semibold">Total:</span>
                <span className="text-white font-bold text-lg">
                  {hasFreeTrial 
                    ? '7 day free trial'
                    : billingPeriod === 'annual' 
                      ? `$${Math.round(totalAnnual).toLocaleString()}/year`
                      : `$${Math.round(totalMonthly).toLocaleString()}/month`
                  }
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCancelConfirmation}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-900 border-0 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayment}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-medium border-0"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}

