'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PricingSection } from '@/components/ui/pricing'
import { motion, useSpring } from 'framer-motion'
import { TrendingUp, DollarSign, Calculator, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navigation } from '../page'

export default function PricingPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [roiDealValue, setRoiDealValue] = useState(500)
  const [repCount, setRepCount] = useState(5)
  
  // Automatically detect tier based on rep count
  // Individual: 1 seat, Team: 2-100 reps, Enterprise: 101+ reps
  const selectedTier: 'starter' | 'team' | 'enterprise' | null = repCount >= 101 
    ? 'enterprise' 
    : repCount >= 2 
    ? 'team' 
    : repCount === 1 
    ? 'starter' 
    : null

  // Allow all users to view pricing page - no redirect needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        setIsAuthenticated(!!user && !error)
        setCheckingAuth(false)
      } catch (err) {
        console.error('Error checking authentication:', err)
        setIsAuthenticated(false)
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // Calculate ROI based on selected tier and rep count
  const calculateROI = (tier: 'starter' | 'team' | 'enterprise', reps: number, dealValue: number) => {
    if (reps === 0 || dealValue === 0) {
      return {
        monthlyCost: 0,
        annualCost: 0,
        extraRevenue: 0,
        netProfit: 0,
        roi: 0,
        roiMultiplier: 0
      }
    }

    // Individual plan: $49 flat for 1 seat
    // Team plan: $39 per rep for 2-100 reps
    // Enterprise plan: $29 per rep for 101+ reps
    const pricePerRep = tier === 'starter' ? 49 : tier === 'team' ? 39 : 29
    const monthlyCost = reps * pricePerRep
    // Annual pricing: 2 months free = 10 months payment
    const annualCost = Math.round(monthlyCost * 10)
    
    // Each rep closes 1 extra deal per month
    const extraRevenue = reps * dealValue
    
    // Net profit
    const netProfit = extraRevenue - monthlyCost
    
    // ROI calculation: (Net Profit / Cost) * 100
    const roi = monthlyCost > 0 ? (netProfit / monthlyCost) * 100 : 0
    
    // ROI multiplier
    const roiMultiplier = monthlyCost > 0 ? extraRevenue / monthlyCost : 0
    
    return {
      monthlyCost,
      annualCost,
      extraRevenue: Math.round(extraRevenue),
      netProfit: Math.round(netProfit),
      roi: Math.round(roi),
      roiMultiplier: Math.round(roiMultiplier * 10) / 10
    }
  }

  const roiData = selectedTier ? calculateROI(selectedTier, repCount, roiDealValue) : null

  // Pricing plans configuration
  // Individual: 1 seat at $49/month (flat rate)
  // Team: 2-100 reps at $39/rep/month
  // Enterprise: 101+ reps at $29/rep/month
  // Annual billing: 20% discount applied
  const plans = [
    {
      name: 'Individual',
      price: '49', // Flat rate for 1 seat
      yearlyPrice: '39', // Flat rate with 20% discount
      period: 'month',
      description: 'Perfect for individual sales professionals (1 seat)',
      features: [
        'All 14 AI training agents',
        'Unlimited practice sessions',
        'Basic analytics & reporting',
        'Performance tracking',
        'Email support',
        '7-day free trial',
      ],
      buttonText: 'Start your free trial',
      href: '/team/signup?plan=starter',
      onClickMonthly: () => {
        router.push('/checkout?plan=starter&billing=monthly')
      },
      onClickYearly: () => {
        router.push('/checkout?plan=starter&billing=annual')
      },
      hasFreeTrial: true,
      minReps: 1,
      maxReps: 1,
    },
    {
      name: 'Team',
      price: '39', // Per rep per month
      yearlyPrice: '31', // Per rep per month with 20% discount
      period: 'month',
      description: 'Most popular for growing teams (2-100 reps)',
      features: [
        'Everything in Individual',
        'Team leaderboard',
        'Manager dashboard',
        'Advanced analytics & reporting',
        'Team performance insights',
        'Custom practice scenarios',
        'Priority support',
        'Custom sales playbook',
      ],
      buttonText: 'Purchase',
      href: '/team/signup?plan=team',
      onClickMonthly: () => {
        router.push('/checkout?plan=team&billing=monthly')
      },
      onClickYearly: () => {
        router.push('/checkout?plan=team&billing=annual')
      },
      isPopular: true,
      minReps: 2,
      maxReps: 100,
    },
    {
      name: 'Enterprise',
      price: '29', // Per rep per month
      yearlyPrice: '23', // Per rep per month with 20% discount
      period: 'month',
      description: 'For large organizations (101+ reps)',
      features: [
        'Everything in Team',
        'Custom AI personas',
        'Dedicated success manager',
        'Custom integrations',
        'SSO',
        'API access',
        'Volume discounts',
      ],
      buttonText: 'Contact Sales',
      href: '/contact-sales',
      onClick: () => {
        router.push('/contact-sales')
      },
      isBestValue: true,
      minReps: 101,
      maxReps: 500,
    },
  ]

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70 font-sans">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      {/* Free Trial Banner */}
      <div className="relative pt-24 pb-2 w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-y border-purple-500/30 px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 w-full"
        >
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-space font-semibold text-white text-base sm:text-lg mb-1">
              7-Day Free Trial Available
            </h3>
            <p className="font-sans text-white/80 text-xs sm:text-sm md:text-base leading-relaxed whitespace-nowrap overflow-hidden">
              Individual plans (1 user): <span className="font-semibold text-white">7-day free trial</span>, no credit card required. Plans with 2+ users: immediate payment required. Start risk-free!
            </p>
          </div>
        </motion.div>
      </div>
      {/* Merged Hero and Pricing Section */}
      <div className="relative">
        <PricingSection
          plans={plans}
          title="Simple, Transparent Pricing"
          description="Choose the plan that's right for your team. All plans include our core features and support."
          hideToggle={false}
        />
      </div>

      {/* ROI Calculator Section */}
      <div className="relative py-16 px-4 sm:px-6 md:px-8 lg:px-12 bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Calculator className="w-6 h-6 text-indigo-500" />
              <h2 className="font-space text-3xl sm:text-4xl font-bold">ROI Calculator</h2>
            </div>
            <p className="font-sans text-white/70 text-lg">
              Calculate your return on investment with DoorIQ
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6"
            >
              <h3 className="font-space text-xl font-bold mb-6">Your Details</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="reps" className="text-white/80 font-sans mb-2 block">
                    Number of Sales Reps
                  </Label>
                  <Input
                    id="reps"
                    type="number"
                    min={0}
                    max={999}
                    value={repCount || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      setRepCount(Math.max(0, Math.min(999, val)))
                    }}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter number of reps"
                  />
                  {repCount > 0 && selectedTier && (
                    <div className="mt-2">
                      <p className="text-sm text-white/80 font-sans mb-1">
                        Selected Plan: <span className="font-semibold text-white">
                          {selectedTier === 'starter' ? 'Individual' : selectedTier === 'team' ? 'Team' : 'Enterprise'}
                        </span>
                      </p>
                      <p className="text-xs text-white/60 font-sans">
                        {selectedTier === 'starter' 
                          ? '1 seat • $49/month (flat rate)' 
                          : selectedTier === 'team' 
                          ? '2-100 reps • $39/rep/month' 
                          : '101+ reps • $29/rep/month'}
                      </p>
                    </div>
                  )}
                  {repCount === 0 && (
                    <p className="text-xs text-yellow-400 mt-1 font-sans">
                      Enter number of reps to see pricing
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dealValue" className="text-white/80 font-sans mb-2 block">
                    Average Deal Value ($)
                  </Label>
                  <Input
                    id="dealValue"
                    type="number"
                    min={0}
                    max={5000}
                    value={roiDealValue || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      setRoiDealValue(Math.max(0, Math.min(5000, val)))
                    }}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter average deal value"
                  />
                  <p className="text-xs text-white/60 mt-1 font-sans">
                    Average value of a closed deal (maximum $5,000)
                  </p>
                  {roiDealValue > 5000 && (
                    <p className="text-xs text-yellow-400 mt-1 font-sans">
                      Maximum deal value is $5,000
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-white/60 font-sans leading-relaxed">
                  <span className="text-white/80 font-semibold">*</span> ROI Calculation: DoorIQ provides comprehensive training and unlimited practice sessions with 14 AI agents, enabling sales reps to improve their skills and close more deals. On average, reps using DoorIQ close a minimum of 1 extra deal per month. The calculator multiplies your number of reps by your average deal value to estimate additional monthly revenue, then subtracts your monthly DoorIQ cost to show your net profit and ROI.
                </p>
              </div>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-6"
            >
              <h3 className="font-space text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Your ROI
              </h3>

              {roiData && selectedTier ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/60 font-sans mb-1">Monthly Cost</p>
                    <p className="text-2xl font-bold text-white font-space">
                      ${roiData.monthlyCost.toLocaleString()}/month
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/60 font-sans mb-1">Extra Revenue</p>
                    <p className="text-2xl font-bold text-green-400 font-space">
                      ${roiData.extraRevenue.toLocaleString()}/month
                    </p>
                    <p className="text-xs text-white/60 mt-1 font-sans">
                      {repCount} extra deal{repCount !== 1 ? 's' : ''} per month
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/60 font-sans mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold font-space ${roiData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${roiData.netProfit.toLocaleString()}/month
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-500/30">
                    <p className="text-sm text-white/60 font-sans mb-1">ROI</p>
                    <p className="text-3xl font-bold text-white font-space">
                      {roiData.roi > 0 ? '+' : ''}{roiData.roi}%
                    </p>
                    <p className="text-xs text-white/60 mt-1 font-sans">
                      {roiData.roiMultiplier}x return on investment
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 font-sans">
                    Select a plan tier to see your ROI calculation
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

