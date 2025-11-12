'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowLeft, ChevronRight, Calculator, DollarSign, Calendar } from "lucide-react"
import Cal, { getCalApi } from "@calcom/embed-react"

const salesRepRanges = [
  'Between 10-50 reps',
  'Between 50-100 reps',
  'Over 100+ reps'
]

const industries = [
  { name: 'Pest', icon: '🐛' },
  { name: 'Windows', icon: '🪟' },
  { name: 'Solar', icon: '☀️' },
  { name: 'Roofing', icon: '🏠' },
  { name: 'Internet', icon: '📡' },
  { name: 'Other', icon: '⭐' },
]

interface FormData {
  salesRepRange: string
  industry: string
}

function PricingPageContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [calLoaded, setCalLoaded] = useState(false)
  const [customIndustry, setCustomIndustry] = useState('')
  const [numReps, setNumReps] = useState<number>(10)
  const [formData, setFormData] = useState<FormData>({
    salesRepRange: '',
    industry: ''
  })

  // Calculate pricing based on number of reps
  const calculatePricing = (reps: number) => {
    if (reps < 10) return { monthly: 0, annual: 0 }
    
    let monthly = 0
    
    // Reps 1-50: $50 each
    const tier1Reps = Math.min(reps, 50)
    monthly += tier1Reps * 50
    
    // Reps 51-100: $40 each
    if (reps > 50) {
      const tier2Reps = Math.min(reps - 50, 50)
      monthly += tier2Reps * 40
    }
    
    // Reps 101+: $35 each
    if (reps > 100) {
      const tier3Reps = reps - 100
      monthly += tier3Reps * 35
    }
    
    // Annual with 30% discount
    const annual = monthly * 12 * 0.7
    
    return { monthly, annual }
  }

  // Initialize Cal.com embed when reaching step 3 (calendar step)
  useEffect(() => {
    if (currentStep === 3) {
      setCalLoaded(false)
      ;(async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"});
          cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
      setTimeout(() => {
            setCalLoaded(true)
          }, 1000)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true) // Show anyway if there's an error
        }
      })();
            } else {
      setCalLoaded(false)
    }
  }, [currentStep])

  const handleSelectSalesRepRange = (range: string) => {
    setFormData(prev => ({ ...prev, salesRepRange: range }))
    setTimeout(() => setCurrentStep(1), 300)
  }

  const handleSelectIndustry = (industry: string) => {
    if (industry === 'Other') {
      setFormData(prev => ({ ...prev, industry: 'Other' }))
      // Don't advance to next step yet - wait for custom input
    } else {
      setFormData(prev => ({ ...prev, industry }))
      setTimeout(() => setCurrentStep(2), 300)
    }
  }

  const handleCustomIndustrySubmit = () => {
    if (customIndustry.trim()) {
      setFormData(prev => ({ ...prev, industry: customIndustry.trim() }))
      setTimeout(() => setCurrentStep(2), 300)
    }
  }

  const handleContinueToCalendar = () => {
    setTimeout(() => setCurrentStep(3), 300)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      if (newStep === 1 && formData.industry === 'Other') {
        // Reset Other selection when going back to industry step
        setFormData(prev => ({ ...prev, industry: '' }))
        setCustomIndustry('')
      }
      setCurrentStep(newStep)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center px-4 pb-12 relative overflow-hidden" style={{ marginTop: '-20px' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-geist leading-[1.1] tracking-tight bg-clip-text text-transparent bg-[linear-gradient(180deg,_#FFF_0%,_rgba(200,_200,_200,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(150,_150,_150,_0.75)_100%)] mb-4">
            Get Started with DoorIQ
          </h1>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-purple-500/5"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-25 animate-pulse" />
              
              <div className="relative z-10">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white"
                >
                  How many sales reps do you have?
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg sm:text-xl text-slate-300 mb-8"
                >
                  Choose the option that best describes your company
                </motion.p>
                <div className="space-y-4">
                  {salesRepRanges.map((range, index) => (
                    <motion.button
                      key={range}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => handleSelectSalesRepRange(range)}
                      className="group relative w-full flex items-center justify-between px-8 py-5 rounded-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 hover:from-white/20 hover:via-white/10 hover:to-white/20 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/20 overflow-hidden"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <span className="text-lg font-semibold text-white relative z-10">
                        {range}
                      </span>
                      <ChevronRight className="w-5 h-5 text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-purple-500/5"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-25 animate-pulse" />
              
              <div className="relative z-10">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm">Back</span>
                </motion.button>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white"
                >
                  Choose Your Industry
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg sm:text-xl text-slate-300 mb-8"
                >
                  Choose the category that best fits your business. This helps us tailor your setup.
                </motion.p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {industries.map((industry, index) => (
                    <motion.button
                      key={industry.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      onClick={() => handleSelectIndustry(industry.name)}
                      className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 overflow-hidden ${
                        formData.industry === industry.name
                          ? 'border-purple-400 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg shadow-purple-500/30'
                          : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                      }`}
                    >
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 rounded-2xl" />
                      
                      <span className="text-5xl mb-3 relative z-10 transform group-hover:scale-110 transition-transform duration-300">{industry.icon}</span>
                      <span className="text-base font-semibold text-white relative z-10">
                        {industry.name}
                      </span>
                      {industry.name !== 'Other' && (
                        <ChevronRight className="w-4 h-4 text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 absolute bottom-3 z-10" />
                      )}
                    </motion.button>
                  ))}
                </div>
                
                {/* Custom Industry Input - Shows when "Other" is selected */}
                {formData.industry === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <label className="block text-sm font-medium text-white mb-2">
                      Please specify your industry
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customIndustry.trim()) {
                            handleCustomIndustrySubmit()
                          }
                        }}
                        placeholder="Enter your industry..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all"
                        autoFocus
                      />
                      <button
                        onClick={handleCustomIndustrySubmit}
                        disabled={!customIndustry.trim()}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/30"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (() => {
            const pricing = calculatePricing(numReps)
            return (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-purple-500/5"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-25 animate-pulse" />
                
                <div className="relative z-10">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={handleBack}
                    className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Back</span>
                  </motion.button>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
                      Calculate Your Pricing
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-300">
                      See how much DoorIQ costs for your team
                    </p>
                  </motion.div>

                  {/* Reps Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <label className="block text-sm font-medium text-white mb-3">
                      Number of Sales Reps
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        value={numReps}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 10
                          setNumReps(Math.max(10, value))
                        }}
                        className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-semibold focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        Minimum: 10
                      </div>
                    </div>
                  </motion.div>

                  {/* Pricing Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                  >
                    {/* Monthly Pricing */}
                    <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:border-purple-400/50 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <DollarSign className="w-5 h-5 text-purple-300" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-300">Monthly</h3>
                          <p className="text-xs text-slate-400">Per month</p>
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${pricing.monthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      <p className="text-sm text-slate-400">
                        ${(pricing.monthly / numReps).toFixed(0)} per rep/month
                      </p>
                    </div>

                    {/* Annual Pricing */}
                    <div className="relative bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 hover:border-green-400/50 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Calendar className="w-5 h-5 text-green-300" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-300">Annual</h3>
                          <p className="text-xs text-green-300 font-semibold">30% discount</p>
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${pricing.annual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      <p className="text-sm text-slate-400">
                        ${(pricing.annual / 12 / numReps).toFixed(0)} per rep/month
                      </p>
                      <div className="mt-2 text-xs text-green-300 font-semibold">
                        Save ${((pricing.monthly * 12) - pricing.annual).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year
                      </div>
                    </div>
                  </motion.div>

                  {/* Pricing Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10"
                  >
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Pricing Breakdown
                    </h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex justify-between">
                        <span>Reps 1-50:</span>
                        <span className="text-white font-medium">$50/rep/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reps 51-100:</span>
                        <span className="text-white font-medium">$40/rep/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reps 101+:</span>
                        <span className="text-white font-medium">$35/rep/month</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleContinueToCalendar}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Continue to Schedule</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )
          })()}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 overflow-hidden"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">← Back to pricing calculator</span>
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
                  config={{"layout":"month_view"}}
                />
                {!calLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
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
      <PricingPageContent />
  )
}
