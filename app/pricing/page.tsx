'use client'

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { Loader2, ChevronRight, CheckCircle2, X, Shield, Star, Award, ShieldCheck, Users, TrendingUp, Zap, BarChart3, Headphones, UserCog, Building2, Code, Globe, Calculator, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BorderTrail } from "@/components/ui/border-trail"
import { cn } from "@/lib/utils"

// Lazy load heavy components
const Cal = dynamic(() => import("@calcom/embed-react").then(mod => ({ default: mod.default, getCalApi: mod.getCalApi })), { 
  ssr: false,
  loading: () => <div className="h-[600px] animate-pulse bg-black/20 rounded-lg" />
})
const NumberFlow = dynamic(() => import("@number-flow/react").then(mod => mod.default), { 
  ssr: false,
  loading: () => <span>0</span>
})

interface PricingTier {
  id: string
  name: string
  subtitle: string
  price: number | string
  priceLabel: string
  repRange: string
  features: string[]
  why: string
  math?: string
  popular?: boolean
  icon: any
  socialProof?: string
  badge?: string
}

function PricingPageContent() {
  const searchParams = useSearchParams()
  const [calLoaded, setCalLoaded] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>('team') // Pre-select most popular
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [roiReps, setRoiReps] = useState(10)
  const [roiDealValue, setRoiDealValue] = useState(300)

  const tiers: PricingTier[] = [
    {
      id: 'solo',
      name: 'SOLO/STARTUP',
      subtitle: 'Perfect for individual reps or tiny companies',
      price: 99,
      priceLabel: '/month for 1 rep',
      repRange: '1 rep',
      icon: Users,
      features: [
        'Unlimited practice sessions',
        'All AI personas',
        'Basic analytics',
        'Upload/record pitch feedback',
        'Practice history tracking'
      ],
      why: 'Catches individual reps or tiny companies. Low commitment, easy yes. Gets people in the door.',
      popular: false,
      badge: 'Best for Individuals'
    },
    {
      id: 'team',
      name: 'TEAM',
      subtitle: 'Sweet spot for small-to-medium pest control companies',
      price: 79,
      priceLabel: '/month per rep',
      repRange: '5-20 reps',
      icon: TrendingUp,
      features: [
        'Everything in Solo',
        'Team leaderboard',
        'Manager dashboard',
        'Priority support',
        'Team performance insights',
        'Custom practice scenarios'
      ],
      why: 'Sweet spot for small-to-medium pest control companies (most of your market). Still affordable, but you\'re making real money.',
      math: 'Min 5 reps = $395/month starting point. Math: 10 reps = $790/month ($26/day total, $2.60/day per rep)',
      popular: true,
      badge: 'Most Popular'
    },
    {
      id: 'growth',
      name: 'GROWTH',
      subtitle: 'Regional companies scaling up',
      price: 59,
      priceLabel: '/month per rep',
      repRange: '21-100 reps',
      icon: BarChart3,
      features: [
        'Everything in Team',
        'Custom AI personas (clone top performer\'s voice/style)',
        'Advanced analytics & reporting',
        'Custom sales playbook'
      ],
      why: 'Regional companies scaling up. Custom personas become a moat - they can\'t leave because their top rep is cloned into the system.',
      math: 'Math: 50 reps = $2,950/month ($98/day total, ~$2/day per rep)',
      popular: false,
      badge: 'Best Value'
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      subtitle: 'Large organizations with custom needs',
      price: 'Starting at $39',
      priceLabel: '/month per rep',
      repRange: '100+ reps',
      icon: Building2,
      features: [
        'Everything in Growth',
        'API access',
        'White-label option',
        'Dedicated account team',
        'Volume discounts (typically $39-49/month per rep)'
      ],
      why: 'Large organizations need custom solutions. Volume discounts make it affordable at scale - typically 40% less than Growth tier.',
      popular: false,
      badge: 'Enterprise Ready'
    }
  ]

  // Calculate pricing with annual discount
  const getTierPrice = (tier: PricingTier, reps: number = 10): { monthly: number, annual: number } => {
    let monthlyPrice: number
    
    if (tier.id === 'solo') {
      monthlyPrice = 99
    } else if (tier.id === 'team') {
      monthlyPrice = Math.max(5, reps) * 79
    } else if (tier.id === 'growth') {
      monthlyPrice = reps * 59
    } else if (tier.id === 'enterprise') {
      monthlyPrice = reps * 39 // Starting at $39
    } else {
      monthlyPrice = 0
    }
    
    const annualPrice = Math.round(monthlyPrice * 12 * 0.85) // 15% discount
    
    return { monthly: monthlyPrice, annual: annualPrice }
  }

  // Calculate ROI
  const calculateROI = () => {
    // Determine tier based on reps
    let monthlyCost: number
    if (roiReps === 0) {
      monthlyCost = 0
    } else if (roiReps === 1) {
      monthlyCost = 99
    } else if (roiReps >= 5 && roiReps <= 20) {
      monthlyCost = Math.max(5, roiReps) * 79
    } else if (roiReps >= 21 && roiReps <= 100) {
      monthlyCost = roiReps * 59
    } else {
      monthlyCost = roiReps * 39
    }

    const extraRevenue = roiReps * roiDealValue // 1 extra deal per rep per month
    const netProfit = extraRevenue - monthlyCost
    const roi = monthlyCost > 0 ? (netProfit / monthlyCost) * 100 : 0
    const roiMultiplier = monthlyCost > 0 ? extraRevenue / monthlyCost : 0
    
    return { 
      monthlyCost,
      extraRevenue,
      netProfit,
      roi,
      roiMultiplier
    }
  }

  const roiData = calculateROI()

  // Initialize Cal.com embed
    useEffect(() => {
    if (selectedTier) {
      setCalLoaded(false)
      ;(async function () {
        try {
          const { getCalApi } = await import("@calcom/embed-react")
          const cal = await getCalApi({"namespace":"dooriq"});
          
          const tier = tiers.find(t => t.id === selectedTier)
          const pricingData = {
            tier: tier?.name || '',
            tierId: selectedTier,
          }
          
          sessionStorage.setItem('dooriq_pricing_data', JSON.stringify(pricingData));
          
          cal("ui", {
            "hideEventTypeDetails": false,
            "layout": "month_view"
          });
          
              setTimeout(() => {
            setCalLoaded(true)
          }, 1500)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true)
        }
      })();
    } else {
      setCalLoaded(false)
    }
  }, [selectedTier])

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId)
  }

  const handleBack = () => {
    setSelectedTier(null)
  }

  const getCTA = (tierId: string) => {
    if (tierId === 'enterprise') return 'Book a Demo'
    return 'Start Free Trial'
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pt-20">
      <div className="w-full relative z-10">
        <AnimatePresence mode="wait">
          {!selectedTier ? (
            <motion.div
              key="tiers"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
                className="w-full min-h-screen py-6 px-4 sm:px-6 lg:px-8"
              >
                <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  className="text-center mb-6 pt-2 relative pb-4"
                  >
                    <div
                      className={cn(
                        'z-[-10] pointer-events-none absolute -inset-10 size-[calc(100%+5rem)]',
                        'bg-[linear-gradient(to_right,theme(colors.white/.085)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.085)_1px,transparent_1px)]',
                        'bg-[size:32px_32px]',
                        '[mask-image:radial-gradient(ellipse_120%_100%_at_50%_50%,var(--background)_10%,transparent_80%)]',
                      )}
                    />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-3 tracking-tight relative z-10 font-space" style={{ letterSpacing: '-0.02em' }}>
                    Simple, Transparent Pricing
                  </h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-3 font-medium relative z-10 font-sans">
                    Choose the plan that fits your team size. All plans include unlimited practice sessions.
                  </p>
                  
                  {/* Billing Period Toggle */}
                  <div className="relative z-10 flex items-center justify-center gap-3 mb-4 mt-6">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={cn(
                        "px-6 py-2 rounded-lg font-semibold transition-all",
                        billingPeriod === 'monthly'
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('annual')}
                      className={cn(
                        "px-6 py-2 rounded-lg font-semibold transition-all relative",
                        billingPeriod === 'annual'
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      Annual
                      <span className="ml-2 text-xs bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold">
                        Save 15%
                      </span>
                    </button>
                      </div>
                </motion.div>

                {/* Pricing Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-4">
                  {tiers.map((tier, index) => {
                    const Icon = tier.icon
                    const isPopular = tier.popular
                    const isEnterprise = tier.id === 'enterprise'
                    // For display, we show per-rep pricing
                    let displayPrice: number
                    if (tier.id === 'solo') {
                      displayPrice = billingPeriod === 'annual' ? Math.round(99 * 0.85) : 99
                    } else if (tier.id === 'team') {
                      displayPrice = billingPeriod === 'annual' ? Math.round(79 * 0.85) : 79
                    } else if (tier.id === 'growth') {
                      displayPrice = billingPeriod === 'annual' ? Math.round(59 * 0.85) : 59
                    } else {
                      displayPrice = billingPeriod === 'annual' ? Math.round(39 * 0.85) : 39
                    }
                    
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={cn(
                          "relative rounded-none border-2 p-4 bg-black/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] flex flex-col min-h-[470px]",
                          selectedCard === tier.id
                            ? "lg:scale-105 lg:-mt-4 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-black/80 via-black/60 to-black/80"
                            : "border-2 border-white/20 hover:border-white/40"
                        )}
                        onClick={() => setSelectedCard(tier.id)}
                      >
                        {/* Corner Plus Icons on Each Card */}
                        <Plus className="absolute -top-3 -left-3 size-5 text-white z-30 pointer-events-none" />
                        <Plus className="absolute -top-3 -right-3 size-5 text-white z-30 pointer-events-none" />
                        <Plus className="absolute -bottom-3 -left-3 size-5 text-white z-30 pointer-events-none" />
                        <Plus className="absolute -right-3 -bottom-3 size-5 text-white z-30 pointer-events-none" />

                        {/* Rotating BorderTrail Effect - Enterprise Only */}
                        {isEnterprise && (
                          <div className="absolute inset-0 overflow-hidden rounded-none">
                            <BorderTrail
                              style={{
                                boxShadow: '0px 0px 60px 30px rgb(16 185 129 / 20%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                              }}
                              size={100}
                            />
                          </div>
                        )}

                        {/* Glow effect for selected card */}
                        {selectedCard === tier.id && (
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-400/20 to-emerald-500/20 rounded-none blur-md opacity-50 -z-10" />
                        )}

                        {tier.badge && (
                          <div className={cn(
                            "absolute -top-3 left-1/2 -translate-x-1/2 z-20 transition-all",
                            selectedCard === tier.id ? "scale-105" : "scale-100"
                          )}>
                            <Badge className="font-semibold px-3 py-1 text-xs shadow-lg backdrop-blur-sm border-0 bg-emerald-500/90 text-black">
                              {tier.popular && <Star className="w-3 h-3 inline-block mr-1 fill-current" />}
                              {tier.badge}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex flex-col h-full relative z-10">
                          {/* Icon */}
                          <div className="mb-2">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center mb-2",
                              selectedCard === tier.id 
                                ? "bg-gradient-to-br from-emerald-500/30 to-emerald-400/20" 
                                : "bg-gradient-to-br from-emerald-500/20 to-purple-500/20"
                            )}>
                              <Icon className={cn(
                                "w-6 h-6",
                                selectedCard === tier.id ? "text-emerald-300" : "text-emerald-400"
                              )} />
                              </div>
                            <h3 className={cn(
                              "font-bold mb-1 font-space",
                              selectedCard === tier.id ? "text-2xl text-white" : "text-xl text-white"
                            )}>{tier.name}</h3>
                            </div>

                          {/* Price */}
                          <div className="mb-2">
                            {tier.id === 'enterprise' ? (
                              <div className="flex items-baseline gap-1">
                                <span className={cn(
                                  "font-black text-white font-mono",
                                  selectedCard === tier.id ? "text-4xl" : "text-3xl"
                                )}>
                                  <NumberFlow
                                    value={displayPrice}
                                    format={{
                                      style: "currency",
                                      currency: "USD",
                                      minimumFractionDigits: 0,
                                    }}
                                  />
                                </span>
                                <span className="text-base text-white font-space">/month per rep</span>
                              </div>
                            ) : typeof tier.price === 'number' ? (
                              <div className="flex items-baseline gap-1">
                                <span className={cn(
                                  "font-black text-white font-mono",
                                  selectedCard === tier.id ? "text-4xl" : "text-3xl"
                                )}>
                                  <NumberFlow
                                    value={displayPrice}
                                    format={{
                                      style: "currency",
                                      currency: "USD",
                                      minimumFractionDigits: 0,
                                    }}
                                  />
                                </span>
                                <span className="text-base text-white font-space">{tier.priceLabel}</span>
                              </div>
                            ) : (
                              <div className="text-2xl font-black text-white font-space">{tier.price}</div>
                            )}
                            <p className="text-base text-white mt-1 font-space">{tier.repRange}</p>
                              </div>

                          {/* Features */}
                          <ul className="space-y-1 mb-1 flex-1 mt-4">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className={cn(
                                  "w-5 h-5 flex-shrink-0 mt-0.5",
                                  selectedCard === tier.id ? "text-emerald-400" : "text-emerald-500"
                                )} />
                                <span className="text-base text-white font-space">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {/* CTA Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectTier(tier.id)
                            }}
                            className={cn(
                              "w-full mt-1 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2",
                              selectedCard === tier.id
                                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                                : "bg-white text-black hover:bg-gray-100"
                            )}
                          >
                            <span>{getCTA(tier.id)}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                    </motion.div>
                    )
                  })}
                </div>

                {/* Free Trial Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-base font-semibold text-white font-sans">
                      14-day free trial • No credit card required
                    </span>
                            </div>
                </motion.div>

                {/* ROI Calculator */}
                                  <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-12 max-w-4xl mx-auto"
                >
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/30 rounded-xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Calculator className="w-6 h-6 text-emerald-400" />
                      <h3 className="text-2xl font-bold text-white font-space">
                        ROI Calculator
                      </h3>
                            </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 font-sans">
                            Number of Reps
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={roiReps || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                              setRoiReps(Math.max(0, Math.min(1000, value)))
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '') {
                                setRoiReps(0)
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-white/20 bg-black text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                          />
                                          </div>
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 font-sans">
                            Value per Extra Deal ($)
                          </label>
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
                                setRoiDealValue(300)
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-white/20 bg-black text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                          />
                                        </div>
                                      </div>
                                      
                      <div className="bg-black/60 rounded-lg p-6 space-y-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium font-sans">Extra Revenue:</span>
                          <span className="text-emerald-400 text-xl font-bold font-mono">
                            +${roiData.extraRevenue.toLocaleString()}/month
                          </span>
                                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium font-sans">DoorIQ Cost:</span>
                          <span className="text-red-400 text-xl font-bold font-mono">
                            -${roiData.monthlyCost.toLocaleString()}/month
                          </span>
                                      </div>
                        <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                          <span className="text-white font-semibold text-lg font-sans">Net Profit:</span>
                          <div className="text-right">
                            <div className="text-emerald-400 text-2xl font-black font-mono">
                              ${roiData.netProfit.toLocaleString()}/month
                                          </div>
                            <div className="text-emerald-400 text-sm font-semibold font-sans">
                              {roiData.roiMultiplier.toFixed(1)}x ROI ({roiData.roi.toFixed(0)}%)
                                          </div>
                                        </div>
                                      </div>
                        <p className="text-xs text-white/60 italic font-sans pt-2 border-t border-white/10">
                          *Assumes each rep closes just 1 extra deal per month
                        </p>
                                </div>
                              </div>
                            </div>
                                  </motion.div>

                {/* Trust Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                    className="mb-12 max-w-6xl mx-auto"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 pb-6 border-b border-white/10">
                      <div className="flex flex-col items-center text-center p-6">
                        <Star className="w-6 h-6 text-white mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">50+</div>
                      <div className="text-base text-white uppercase tracking-wide font-semibold font-sans">sales teams</div>
                        </div>
                      <div className="flex flex-col items-center text-center p-6">
                        <Award className="w-6 h-6 text-white mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">10,000+</div>
                      <div className="text-base text-white uppercase tracking-wide font-semibold font-sans">practice sessions</div>
                        </div>
                      <div className="flex flex-col items-center text-center p-6">
                        <Shield className="w-6 h-6 text-emerald-500 mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">14-day</div>
                      <div className="text-base text-white uppercase tracking-wide font-semibold font-sans">free trial</div>
                      </div>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                      <span className="text-lg font-semibold font-sans">SOC 2 Compliant</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                      <span className="text-lg font-semibold font-sans">SSL Encrypted</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                      <span className="text-lg font-semibold font-sans">GDPR Compliant</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                      <span className="text-lg font-semibold font-sans">Bank-Level Security</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* FAQs Section */}
                  <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mb-12 max-w-5xl mx-auto"
                  >
                  <h4 className="text-3xl md:text-4xl font-black text-white mb-6 text-center tracking-tight font-space" style={{ letterSpacing: '-0.01em' }}>
                    Frequently Asked Questions
                  </h4>
                    <div className="space-y-3 max-w-3xl mx-auto">
                      {[
                        {
                          question: "Can I try DoorIQ before committing?",
                        answer: "Yes! We offer a 14-day free trial with no credit card required. Try DoorIQ risk-free and see the results for yourself."
                        },
                        {
                          question: "How quickly can my team start practicing?",
                          answer: "Your team can start practicing within minutes of signup. No lengthy onboarding or setup required."
                        },
                        {
                        question: "What happens if I need to add or remove reps?",
                        answer: "You can adjust your team size anytime. We'll prorate your billing based on the changes. For Team tier, minimum is 5 reps. For Growth tier, minimum is 21 reps."
                      },
                      {
                        question: "Can I upgrade or downgrade between tiers?",
                        answer: "Yes, you can upgrade or downgrade at any time. Changes will be prorated on your next billing cycle."
                      },
                      {
                        question: "What's the difference between monthly and annual billing?",
                        answer: "Annual billing saves you 15% compared to monthly billing. You'll be charged upfront for the year, but get significant savings."
                      },
                      {
                        question: "What's included in Custom AI personas (Growth tier)?",
                        answer: "We'll clone your top performer's voice and style into an AI persona. This creates a unique training asset that becomes a competitive moat - your team can practice with your best rep anytime."
                      },
                      {
                        question: "What kind of custom integrations are available (Enterprise)?",
                        answer: "We can integrate with Salesforce, HubSpot, and other CRM systems. We also offer API access for custom workflows and white-label options for large organizations. Starting at $39/month per rep for 100+ reps."
                        }
                      ].map((faq, index) => (
                        <div key={index} className="rounded-lg border border-white/20 bg-black overflow-hidden">
                          <button
                            onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                            className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                          >
                            <h5 className="text-white font-bold text-lg pr-4 font-space">{faq.question}</h5>
                            <ChevronRight 
                              className={`w-5 h-5 text-white flex-shrink-0 transition-transform ${openFAQ === index ? 'rotate-90' : ''}`}
                            />
                          </button>
                          <AnimatePresence>
                            {openFAQ === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <p className="text-base md:text-lg text-white px-5 pb-5 pt-0 font-sans">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                {/* CTA Section */}
                  <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  className="space-y-3 max-w-3xl mx-auto pb-8 text-center"
                >
                  <p className="text-white font-semibold text-lg mb-2 font-sans">
                    Ready to transform your sales team?
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-white/60 font-sans">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>14-day free trial • No credit card required • Cancel anytime</span>
              </div>
            </motion.div>
                </div>
              </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-black border border-white/20 rounded-lg p-6 sm:p-8 overflow-hidden max-w-4xl mx-auto"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white hover:text-white/80 mb-6 transition-colors font-sans"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span className="text-sm">Back to pricing</span>
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 font-space">
                  Schedule a Demo
                </h2>
                <p className="text-white/70 font-sans">
                  Let's discuss which plan is right for your team.
                </p>
              </div>

              {/* Cal.com Embed */}
              <div 
                className="relative w-full overflow-hidden rounded-xl"
                style={{ 
                  minHeight: 'calc(100vh - 300px)',
                  height: 'calc(100vh - 300px)',
                  maxHeight: '800px'
                }}
              >
                <Cal 
                  namespace="dooriq"
                  calLink="canon-weaver-aa0twn/dooriq"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "calc(100vh - 300px)",
                    maxHeight: "800px",
                    overflow: "auto",
                    padding: "0"
                  }}
                  config={{
                    layout: "month_view"
                  }}
                />
                {!calLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-white" />
                      <p className="text-base font-medium text-white font-sans">
                        Loading calendar...
                      </p>
                    </div>
                  </div>
                )}
            </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
}
