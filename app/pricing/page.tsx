'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowLeft, ChevronRight } from "lucide-react"
import Cal, { getCalApi } from "@calcom/embed-react"

const salesRepRanges = [
  'Under 10 reps',
  '10-50 reps',
  '50+ reps'
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
  const [formData, setFormData] = useState<FormData>({
    salesRepRange: '',
    industry: ''
  })

  // Initialize Cal.com embed when reaching step 2 (calendar step)
  useEffect(() => {
    if (currentStep === 2) {
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
    setFormData(prev => ({ ...prev, industry }))
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-geist leading-[1.1] tracking-tight bg-clip-text text-transparent bg-[linear-gradient(180deg,_#FFF_0%,_rgba(200,_200,_200,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(150,_150,_150,_0.75)_100%)] mb-4">
            Get Started with DoorIQ
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg sm:text-xl text-slate-300"
            >
              {currentStep === 0 && 'How many sales reps does your business have?'}
              {currentStep === 1 && 'What industry are you in?'}
              {currentStep === 2 && 'Schedule Your Demo'}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Select your sales rep range
              </h2>
              <p className="text-slate-400 mb-8">
                Choose the option that best describes your business
              </p>
              <div className="space-y-3">
                {salesRepRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => handleSelectSalesRepRange(range)}
                    className="group w-full flex items-center justify-between px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span className="text-lg font-medium text-white">
                      {range}
                    </span>
                    <ChevronRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">← Back</span>
              </button>
              <h2 className="text-2xl font-bold text-white mb-2">
                Choose Your Industry
              </h2>
              <p className="text-slate-400 mb-8">
                Choose the category that best fits your business. This helps us tailor your setup.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {industries.map((industry) => (
                  <button
                    key={industry.name}
                    onClick={() => handleSelectIndustry(industry.name)}
                    className={`group flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 relative ${
                      formData.industry === industry.name
                        ? 'border-white bg-white/10'
                        : 'border-white/20 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <span className="text-4xl mb-2">{industry.icon}</span>
                    <span className="text-base font-medium text-white mb-1">
                      {industry.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 absolute bottom-3" />
                  </button>
                ))}
                </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
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
                <span className="text-sm">← Back to industry selection</span>
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
