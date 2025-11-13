'use client'

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowLeft, ChevronRight, DollarSign, Calendar, TrendingUp, Users, CheckCircle2, Sparkles, X, Zap, Shield, Clock, Star, Award, Plus, ShieldCheck } from "lucide-react"
import Cal, { getCalApi } from "@calcom/embed-react"
import { Badge } from "@/components/ui/badge"
import { BorderTrail } from "@/components/ui/border-trail"
import { cn } from "@/lib/utils"

interface PricingData {
  numReps: number
  pricingOption: 'monthly' | 'annual'
  monthlyPrice: number
  annualPrice: number
}

function PricingPageContent() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [calLoaded, setCalLoaded] = useState(false)
  const [numReps, setNumReps] = useState<number>(15) // Default to sweet spot
  const [selectedPricingOption, setSelectedPricingOption] = useState<'monthly' | 'annual' | null>(null)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [showAnnualInvestment, setShowAnnualInvestment] = useState(false)
  const [showROICalculations, setShowROICalculations] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  // Initialize numReps from URL params or sessionStorage
  useEffect(() => {
    // First check URL params
    const repsParam = searchParams.get('reps')
    if (repsParam) {
      const reps = parseInt(repsParam)
      if (!isNaN(reps) && reps >= 5 && reps <= 100) {
        setNumReps(reps)
        return
      }
    }
    
    // Then check sessionStorage
    if (typeof window !== 'undefined') {
      const storedReps = sessionStorage.getItem('dooriq_pricing_reps')
      if (storedReps) {
        const reps = parseInt(storedReps)
        if (!isNaN(reps) && reps >= 5 && reps <= 100) {
          setNumReps(reps)
        }
      }
    }
  }, [searchParams])

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setShowStickyHeader(scrollPosition > 400 && currentStep === 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentStep])

  // Calculate pricing based on number of reps - NEW $2/day model
  const calculatePricing = (reps: number) => {
    if (reps < 5) return { daily: 0, monthly: 0, annual: 0, annualMonthly: 0, annualDaily: 0, savings: 0 }
    
    // $2/day per rep for monthly billing
    const daily = reps * 2
    const monthly = daily * 30 // $2/day × 30 days
    
    // Annual: $1.60/day per rep (20% savings)
    const annualDaily = reps * 1.60
    const annualMonthly = annualDaily * 30
    const annual = annualMonthly * 12
    
    // Calculate savings
    const monthlyAnnual = monthly * 12
    const savings = monthlyAnnual - annual
    
    return { daily, monthly, annual, annualMonthly, annualDaily, savings }
  }


  // Calculate ROI with exponential scaling based on team size
  // Base: 1 extra deal per rep per month
  // Exponential multiplier: Larger teams create compounding value
  // Formula: revenue = base_revenue × exponential_multiplier
  // Multiplier increases exponentially: 1.05^(reps/10)
  // This means: 10 reps = 1.05x, 50 reps = 1.28x, 100 reps = 1.63x multiplier
  const calculateROI = (reps: number, annualCost: number) => {
    const averageCommissionPerDeal = 500 // $500 per deal (realistic)
    const extraDealsPerRepPerMonth = 1 // 1 extra deal per month per rep (base)
    const monthsPerYear = 12
    
    // Base annual value: reps × 1 extra deal/month × 12 months × $500
    const baseAnnualValue = reps * extraDealsPerRepPerMonth * monthsPerYear * averageCommissionPerDeal
    
    // Exponential multiplier - larger teams create compounding value
    const exponentialMultiplier = Math.pow(1.05, reps / 10) // Exponential growth
    
    // Total annual value with exponential scaling
    const annualValue = baseAnnualValue * exponentialMultiplier
    
    const annualROI = annualValue - annualCost
    const roiPercentage = annualCost > 0 ? ((annualValue - annualCost) / annualCost) * 100 : 0
    
    return {
      annualValue,
      annualCost,
      annualROI,
      roiPercentage,
      averageCommission: averageCommissionPerDeal,
      dealsPerRep: extraDealsPerRepPerMonth,
      dealsPerRepPerYear: extraDealsPerRepPerMonth * monthsPerYear
    }
  }

  // Get ROI indicator emoji and message based on percentage
  const getROIIndicator = (roiPercentage: number) => {
    if (roiPercentage >= 200) return { emoji: '🤯', label: 'Mind blown', color: 'text-emerald-500' }
    if (roiPercentage >= 100) return { emoji: '🚀', label: 'Rocket ROI', color: 'text-emerald-500' }
    if (roiPercentage >= 50) return { emoji: '🔥', label: 'Fire ROI', color: 'text-emerald-500' }
    return { emoji: '✓', label: 'Solid ROI', color: 'text-emerald-500' }
  }

  // Get dynamic messaging based on team size
  const getTeamSizeMessage = (reps: number) => {
    if (reps >= 50) return "Enterprise transformation mode"
    if (reps >= 31) return "Competition drives results"
    if (reps >= 16) return "Team momentum building"
    return "Foundation for growth"
  }

  // Animated counting component for dollar amounts
  const AnimatedProfit = ({ value }: { value: number }) => {
    const roundedValue = Math.round(value)
    const [displayValue, setDisplayValue] = useState(roundedValue)
    const frameRef = useRef<number | null>(null)
    const previousValueRef = useRef(roundedValue)
    
    useEffect(() => {
      const endValue = Math.round(value)
      
      // Only animate if value actually changed
      if (previousValueRef.current === endValue) {
        return
      }
      
      // Cancel any ongoing animation
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      
      const startValue = previousValueRef.current
      previousValueRef.current = endValue
      
      // If values are very close, just set directly
      if (Math.abs(startValue - endValue) < 0.5) {
        setDisplayValue(endValue)
        return
      }
      
      const duration = 500 // 500ms animation
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)
        
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
          frameRef.current = null
        }
      }
      
      frameRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
      }
    }, [value])
    
    return <motion.span>${displayValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</motion.span>
  }

  // Initialize Cal.com embed when reaching step 1 (calendar step)
  useEffect(() => {
    if (currentStep === 1) {
      setCalLoaded(false)
      ;(async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"});
          const pricing = calculatePricing(numReps)
          
          // Store pricing data for webhook access
          const pricingData = {
            numReps: numReps.toString(),
            pricingOption: selectedPricingOption || 'monthly',
            monthlyPrice: pricing.monthly.toString(),
            annualPrice: pricing.annual.toString(),
            selectedPrice: selectedPricingOption === 'annual' 
              ? pricing.annual.toString() 
              : pricing.monthly.toString()
          }
          
          // Store in sessionStorage and also in a data attribute on the Cal container
          sessionStorage.setItem('dooriq_pricing_data', JSON.stringify(pricingData));
          
          cal("ui", {
            "hideEventTypeDetails": false,
            "layout": "month_view"
          });
          
          // Inject pricing data into Cal.com booking form when it loads
          // This will be picked up by the webhook
          const injectPricingData = () => {
            try {
              // Try to find Cal.com's booking form and inject data
              const calForm = document.querySelector('[data-cal-namespace="dooriq"]') as HTMLElement
              if (calForm) {
                calForm.setAttribute('data-pricing-info', JSON.stringify(pricingData))
              }
              
              // Also try to inject into any textarea/input fields that might be custom questions
              // Note: This requires custom questions to be set up in Cal.com dashboard
              setTimeout(() => {
                const textareas = document.querySelectorAll('textarea[name*="question"], textarea[name*="notes"], textarea[name*="additional"]')
                textareas.forEach((textarea: any) => {
                  if (!textarea.value) {
                    textarea.value = `Pricing Info: ${pricingData.numReps} reps, ${pricingData.pricingOption} plan, $${pricingData.selectedPrice}`
                  }
                })
              }, 2000)
            } catch (e) {
              console.error('Error injecting pricing data:', e)
            }
          }
          
          // Try to inject after Cal loads
          setTimeout(() => {
            injectPricingData()
            setCalLoaded(true)
          }, 1500)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true) // Show anyway if there's an error
        }
      })();
    } else {
      setCalLoaded(false)
    }
  }, [currentStep, numReps, selectedPricingOption])

  const handleSelectPricingOption = (option: 'monthly' | 'annual') => {
    setSelectedPricingOption(option)
    setTimeout(() => setCurrentStep(1), 300)
  }

  const handleContinueToCalendar = () => {
    // If no pricing option selected, default to monthly
    if (!selectedPricingOption) {
      setSelectedPricingOption('monthly')
    }
    setTimeout(() => setCurrentStep(1), 300)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const pricing = calculatePricing(numReps)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Sticky Header */}
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/20"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-white">
                    <span className="text-2xl font-bold">{numReps}</span>
                    <span className="text-sm text-white ml-1">reps</span>
                  </div>
                  <div className="text-white">
                    <span className="text-lg font-semibold text-white">${pricing.monthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="text-sm ml-1">/mo</span>
                  </div>
                  <div className="hidden sm:block text-white/60 text-sm">
                    →
                  </div>
                </div>
                <motion.button
                  onClick={handleContinueToCalendar}
                  className="px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Schedule Demo</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full relative z-10">
        {/* Form Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (() => {
            // Always calculate ROI based on annual cost for fair comparison
            const roi = calculateROI(numReps, pricing.annual)
            return (
            <motion.div
              key="step-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full min-h-screen py-6 px-4 sm:px-6 lg:px-8"
              >
                <div className="max-w-7xl mx-auto">
                  {/* NEW HERO SECTION */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8 pt-12 relative pb-8"
                  >
                    <div
                      className={cn(
                        'z-[-10] pointer-events-none absolute -inset-10 size-[calc(100%+5rem)]',
                        'bg-[linear-gradient(to_right,theme(colors.white/.085)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.085)_1px,transparent_1px)]',
                        'bg-[size:32px_32px]',
                        '[mask-image:radial-gradient(ellipse_120%_100%_at_50%_50%,var(--background)_10%,transparent_80%)]',
                      )}
                    />
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-2 tracking-tight relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                      Just $2 Per Day, Per Rep
                    </h2>
                    <p className="text-lg sm:text-xl lg:text-2xl text-white mb-8 font-medium relative z-10">
                      Unlimited practice sessions, huge ROI potential
                    </p>
                    
                    {/* Interactive Calculator - Moved inside hero section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4 relative z-10"
                    >
                    <label className="block text-lg font-bold text-white mb-3 text-center tracking-wide">
                      Number of Sales Reps:
                    </label>
                    <div className="max-w-2xl mx-auto">
                      {/* Rep Count Input - Above Slider */}
                      <div className="text-center mb-4">
                        <input
                          type="number"
                          min="5"
                          max="500"
                          value={numReps}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 5
                            setNumReps(Math.max(5, Math.min(500, value)))
                          }}
                          className="inline-block px-4 py-2 rounded-lg border border-white/30 bg-black text-white text-xl font-bold font-mono text-center w-24 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                        />
                        <span className="text-white text-lg ml-2">reps</span>
                      </div>
                      
                      {/* Slider */}
                      <div className="relative mb-8">
                      <input
                          type="range"
                          min="5"
                          max="500"
                        value={numReps}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 5
                            setNumReps(Math.max(5, Math.min(500, value)))
                          }}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer pricing-slider"
                          style={{
                            background: (() => {
                              const percentage = ((numReps - 5) / 495) * 100
                              return `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
                            })()
                          }}
                        />
                        <div className="flex justify-between mt-1 text-base font-semibold text-white">
                          <span>5</span>
                          <span>500+</span>
                        </div>
                      </div>
                      
                      {/* Contact Sales CTA */}
                      <div className="text-center mt-8">
                        <motion.a
                          href="/contact-sales"
                          initial={{ opacity: 0.8 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ opacity: 0.7 }}
                          transition={{ duration: 0.3 }}
                          className="text-white text-lg font-medium inline-flex items-center gap-2 group"
                        >
                          <span>Contact Sales</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </motion.a>
                      </div>
                      
                      {/* Pricing Cards - Moved right under Contact Sales */}
                      <div className="max-w-6xl mx-auto mt-6 relative z-10">
                        <div className="grid md:grid-cols-2 gap-6 bg-black relative border border-white/20 p-4">
                          <Plus className="absolute -top-3 -left-3 size-5 text-white" />
                          <Plus className="absolute -top-3 -right-3 size-5 text-white" />
                          <Plus className="absolute -bottom-3 -left-3 size-5 text-white" />
                          <Plus className="absolute -right-3 -bottom-3 size-5 text-white" />

                          {/* Monthly Investment Card */}
                          <button
                            onClick={() => handleSelectPricingOption('monthly')}
                            className="relative w-full rounded-lg border border-white/20 px-4 pt-5 pb-4 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all group text-left"
                          >
                            <BorderTrail
                              style={{
                                boxShadow:
                                  '0px 0px 60px 30px rgb(16 185 129 / 20%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                              }}
                              size={100}
                            />
                            <div className="space-y-1 mb-4">
                              <div className="flex items-center justify-between">
                                <h3 className="leading-none font-semibold text-white">Monthly</h3>
                              </div>
                            </div>
                            <div className="mt-6 space-y-4">
                              <div className="text-white flex items-end gap-0.5 text-xl">
                                <span>$</span>
                                <motion.span 
                                  key={pricing.monthly}
                                initial={{ scale: 1 }}
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 0.3 }}
                                  className="text-white -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl font-mono"
                                >
                                  {pricing.monthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </motion.span>
                                <span>/month</span>
                              </div>
                              <div className="text-lg text-white font-semibold font-mono">
                                = ${(pricing.monthly * 12).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year
                              </div>
                              <div className="text-base text-white font-semibold">
                                $2/day × {numReps} reps × 30 days
                              </div>
                            </div>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-5 h-5 text-white" />
                            </div>
                          </button>

                          {/* Annual Investment Card */}
                          <button
                            onClick={() => handleSelectPricingOption('annual')}
                            className="relative w-full rounded-lg border border-white/20 px-4 pt-5 pb-4 overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all group text-left"
                          >
                            {/* Green Triangle Corner */}
                            <div className="absolute top-0 right-0 z-20 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-emerald-500"></div>
                            <BorderTrail
                              style={{
                                boxShadow:
                                  '0px 0px 60px 30px rgb(16 185 129 / 20%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                              }}
                              size={100}
                            />
                            <div className="space-y-1 mb-4">
                              <div className="flex items-center justify-between">
                                <h3 className="leading-none font-semibold text-white flex items-center gap-2">
                                  Annual
                                  <Badge>Best Value</Badge>
                                </h3>
                              </div>
                            </div>
                            <div className="mt-6 space-y-4">
                              <div className="text-white flex items-end text-xl">
                                <span>$</span>
                                <motion.span 
                                  key={pricing.annualMonthly}
                                  initial={{ scale: 1 }}
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 0.3 }}
                                  className="text-white -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl font-mono"
                                >
                                  {pricing.annualMonthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </motion.span>
                                <span>/month</span>
                              </div>
                              <div className="text-lg text-white font-semibold font-mono flex items-center gap-2">
                                <span className="text-gray-400 text-base line-through opacity-50">${(pricing.monthly * 12).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                <span>= ${pricing.annual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year</span>
                              </div>
                              <div className="text-base text-emerald-500 font-semibold">
                                Save ${pricing.savings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year vs monthly
                              </div>
                            </div>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                              <ChevronRight className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    </motion.div>
                  </motion.div>

                  {/* Investment & ROI Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 max-w-6xl mx-auto -mt-8 relative"
                  >
                    {/* Large Grid Background - Extended */}
                    <div
                      className={cn(
                        'z-[-10] pointer-events-none absolute -inset-20 size-[calc(100%+10rem)]',
                        'bg-[linear-gradient(to_right,theme(colors.white/.085)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.085)_1px,transparent_1px)]',
                        'bg-[size:32px_32px]',
                        '[mask-image:radial-gradient(ellipse_120%_80%_at_50%_45%,var(--background)_10%,transparent_85%)]',
                      )}
                    />
                    <div className="relative">

                            <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="mx-auto w-full space-y-4"
                      >

                        {/* ROI Header Text */}
                        <div className="text-center py-4 relative z-10">
                          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                            Your Competitive Advantage
                          </h2>
                          <p className="text-2xl md:text-3xl text-white font-medium">
                            When each rep closes just <span className="text-emerald-500 font-semibold">{roi.dealsPerRep} extra deal{roi.dealsPerRep > 1 ? 's' : ''}/month</span>:
                              </p>
                            </div>

                        {/* Simplified ROI Display */}
                        {(() => {
                          const investment = showAnnualInvestment ? pricing.annual : pricing.monthly * 12
                          const netProfit = showAnnualInvestment ? roi.annualROI : roi.annualValue - (pricing.monthly * 12)
                          return (
                            <div className="bg-black relative border border-white/20 p-6 rounded-lg z-10">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-lg font-medium">Revenue:</span>
                                <motion.span 
                                  key={roi.annualValue}
                                  initial={{ scale: 1 }}
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 0.3 }}
                                    className="text-emerald-500 text-2xl font-bold font-mono"
                                >
                                    +${roi.annualValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </motion.span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-lg font-medium">Investment:</span>
                                  <motion.span 
                                    key={investment}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.3 }}
                                    className="text-red-400 text-2xl font-bold font-mono"
                                  >
                                    -${investment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </motion.span>
                              </div>
                                <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                                  <span className="text-white text-lg font-semibold">Net Profit:</span>
                                  <motion.div
                                    key={netProfit}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-emerald-400 text-3xl font-bold font-mono">
                                      ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                  </motion.div>
                            </div>

                                {/* See Calculations Dropdown */}
                                <div className="border-t border-white/20 pt-4">
                                  <button
                                    onClick={() => setShowROICalculations(!showROICalculations)}
                                    className="w-full flex items-center justify-between text-emerald-400 hover:text-emerald-300 transition-colors text-lg font-semibold"
                                  >
                                    <span>{showROICalculations ? 'Hide' : 'See'} calculations</span>
                                    <ChevronRight 
                                      className={`w-5 h-5 transition-transform ${showROICalculations ? 'rotate-90' : ''}`}
                                    />
                                  </button>
                                  {showROICalculations && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-4 space-y-4 pt-4 border-t border-white/10"
                                    >
                                      <div className="space-y-2">
                                        <div className="text-white text-xl font-bold">How we calculate revenue:</div>
                                        <div className="text-white text-lg space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-emerald-400 font-bold">{numReps}</span>
                                            <span>reps</span>
                                            <span className="text-white/60">×</span>
                                            <span className="text-emerald-400 font-bold">{roi.dealsPerRep}</span>
                                            <span>extra deal{roi.dealsPerRep > 1 ? 's' : ''} per month</span>
                                            <span className="text-white/60">×</span>
                                            <span className="text-emerald-400 font-bold">12</span>
                                            <span>months</span>
                                            <span className="text-white/60">×</span>
                                            <span className="text-emerald-400 font-bold">${roi.averageCommission}</span>
                                            <span>average value per deal</span>
                                          </div>
                                          <div className="text-emerald-400 text-2xl font-bold font-mono pt-2">
                                            = ${roi.annualValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="text-white text-xl font-bold">Your investment:</div>
                                        <div className="text-white text-lg">
                                          <span className="text-red-400 font-bold">${investment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                          <span className="ml-2">annual cost</span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2 pt-2 border-t border-white/10">
                                        <div className="text-white text-xl font-bold">Net profit:</div>
                                        <div className="text-white text-lg space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-emerald-400 font-bold">${roi.annualValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            <span>revenue</span>
                                            <span className="text-white/60">-</span>
                                            <span className="text-red-400 font-bold">${investment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            <span>investment</span>
                                          </div>
                                          <div className="text-emerald-400 text-2xl font-bold font-mono pt-2">
                                            = ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()}

                        {/* ROI Highlight Card */}
                                {(() => {
                                  const investment = showAnnualInvestment ? pricing.annual : pricing.monthly * 12
                                  const roiPct = investment > 0 ? ((roi.annualValue - investment) / investment) * 100 : 0
                          const returnPerDollar = investment > 0 ? roi.annualValue / investment : 0
                          const paybackWeeks = investment > 0 ? Math.round((investment / (roi.annualValue / 12)) * 4) : 0
                                  return (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              viewport={{ once: true }}
                              className="relative bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/50 rounded-lg p-5 md:p-6 z-10"
                            >
                              <div className="absolute -top-2 -left-2 size-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">💰</span>
                          </div>
                              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                                <div className="text-center">
                                  <motion.div
                                    key={roiPct}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1 font-mono"
                                  >
                                    {roiPct.toFixed(0)}%
                                  </motion.div>
                                  <div className="text-xs font-semibold text-white uppercase tracking-wide">ROI</div>
                            </div>
                                <div className="text-center">
                                  <motion.div
                                    key={returnPerDollar}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                                    className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1 font-mono"
                                >
                                    ${returnPerDollar.toFixed(0)}
                                  </motion.div>
                                  <div className="text-xs font-semibold text-white uppercase tracking-wide">Return per $1 invested</div>
                              </div>
                                <div className="text-center">
                                  <motion.div
                                    key={paybackWeeks}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1 font-mono"
                                  >
                                    {paybackWeeks}
                                  </motion.div>
                                  <div className="text-xs font-semibold text-white uppercase tracking-wide">Week payback period</div>
                            </div>
                              </div>
                            </motion.div>
                                )
                              })()}

                        <div className="text-white flex items-center justify-center gap-x-2 text-base md:text-lg font-medium relative z-10">
                          <ShieldCheck className="size-4 text-emerald-500" />
                          <span>Access to all features with no hidden fees • 14-day free trial</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Enhanced Comparison Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-12 p-8 rounded-lg border border-white/20 max-w-6xl mx-auto bg-black"
                  >
                    <h4 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                      Why DoorIQ vs. Traditional Training?
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-base md:text-lg">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-4 text-white font-semibold text-lg md:text-xl">Feature</th>
                            <th className="text-center py-4 text-white font-semibold text-lg md:text-xl">Traditional Training</th>
                            <th className="text-center py-4 text-white font-bold bg-white/5 text-lg md:text-xl">DoorIQ</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-2">
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Cost per rep</td>
                            <td className="text-center py-4 text-red-500 font-semibold text-xl md:text-2xl">$2,000</td>
                            <td className="text-center py-4 text-emerald-500 font-semibold text-xl md:text-2xl">$2/day ($60/month)</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-semibold">Annual training cost savings</td>
                            <td className="text-center py-4 text-red-500 font-semibold text-xl md:text-2xl">$58,000/year</td>
                            <td className="text-center py-4 text-emerald-500 font-semibold text-xl md:text-2xl">Save $58,000/year</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Time to first practice</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Ongoing practice</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Available 24/7</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Customized to your scripts</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">AI-powered scenarios</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Real-time feedback</td>
                            <td className="text-center py-4"><X className="w-6 h-6 md:w-7 md:h-7 text-red-500 mx-auto" /></td>
                            <td className="text-center py-4"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 mx-auto" /></td>
                          </tr>
                          <tr>
                            <td className="py-4 text-white text-lg md:text-xl font-medium">Burned lead cost</td>
                            <td className="text-center py-4 text-red-500 font-semibold text-xl md:text-2xl">$300-500 each</td>
                            <td className="text-center py-4 text-emerald-500 font-semibold text-xl md:text-2xl">Prevented</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Combined Trust Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="mb-12 max-w-6xl mx-auto"
                  >
                    {/* Tier 3: Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 pb-6 border-b border-white/10">
                      <div className="flex flex-col items-center text-center p-6">
                        <Star className="w-6 h-6 text-white mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">50+</div>
                        <div className="text-base text-white uppercase tracking-wide font-semibold">sales teams</div>
                        </div>
                      <div className="flex flex-col items-center text-center p-6">
                        <Award className="w-6 h-6 text-white mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">10,000+</div>
                        <div className="text-base text-white uppercase tracking-wide font-semibold">practice sessions</div>
                        </div>
                      <div className="flex flex-col items-center text-center p-6">
                        <Shield className="w-6 h-6 text-emerald-500 mb-3" />
                        <div className="text-4xl font-bold text-white mb-2 font-mono">14-day</div>
                        <div className="text-base text-white uppercase tracking-wide font-semibold">free trial</div>
                      </div>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                        <span className="text-lg font-semibold">SOC 2 Compliant</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                        <span className="text-lg font-semibold">SSL Encrypted</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                        <span className="text-lg font-semibold">GDPR Compliant</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6 text-emerald-500" />
                        <span className="text-lg font-semibold">Bank-Level Security</span>
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
                    <h4 className="text-3xl md:text-4xl font-black text-white mb-6 text-center tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>Frequently Asked Questions</h4>
                    <div className="space-y-3 max-w-3xl mx-auto">
                      {[
                        {
                          question: "Can I try DoorIQ before committing?",
                          answer: "Yes! We offer a 14-day free trial. Try DoorIQ risk-free and see the results for yourself."
                        },
                        {
                          question: "How quickly can my team start practicing?",
                          answer: "Your team can start practicing within minutes of signup. No lengthy onboarding or setup required."
                        },
                        {
                          question: "How is this different from roleplay?",
                          answer: "Real AI conversations, not awkward coworker practice. Our AI adapts to each rep's responses in real-time, providing authentic scenarios that mirror actual customer interactions."
                        },
                        {
                          question: "Can I track individual rep progress?",
                          answer: "Yes, detailed analytics for each rep. You'll see session completion rates, improvement trends, areas of strength, and specific skills that need development."
                        },
                        {
                          question: "What if I need to add or remove reps?",
                          answer: "You can adjust your team size anytime. We'll prorate your billing based on the changes."
                        }
                      ].map((faq, index) => (
                        <div key={index} className="rounded-lg border border-white/20 bg-black overflow-hidden">
                          <button
                            onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                            className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                          >
                            <h5 className="text-white font-bold text-lg pr-4">{faq.question}</h5>
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
                                <p className="text-base md:text-lg text-white px-5 pb-5 pt-0">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Enhanced CTA Button */}
                  <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="space-y-3 max-w-3xl mx-auto pb-8"
                >
                    <p className="text-center text-white font-semibold text-lg mb-2">
                      Limited spots for Q1 onboarding
                    </p>
                    <motion.button
                      onClick={handleContinueToCalendar}
                      className="w-full py-5 rounded-lg bg-white text-black hover:bg-gray-100 font-bold text-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <span>Schedule 15-Min Demo</span>
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-white">
                        Join <span className="text-white font-semibold">50+ sales teams</span> improving their close rates • No credit card required
                      </p>
                      <div className="flex items-center justify-center gap-4 pt-1">
                        <div className="flex items-center gap-2 text-xs text-white">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white">
                          <span>Secure payment via</span>
                          <span className="font-semibold text-white">Stripe</span>
                        </div>
                </div>
              </div>
            </motion.div>
                </div>
              </motion.div>
            )
          })()}

          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-black border border-white/20 rounded-lg p-6 sm:p-8 overflow-hidden"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to pricing calculator</span>
              </button>
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
                      <p className="text-base font-medium text-white">
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
