'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Cal, { getCalApi } from "@calcom/embed-react"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'dooriq_contact_sales_flow'

interface FormData {
  salesRepRange: string
  industry: string
  companyName: string
  fullName: string
  workEmail: string
  phoneNumber: string
}

const salesRepRanges = [
  '1-20 reps',
  '21-100 reps',
  '101+ reps'
]

const industries = [
  { name: 'Pest', icon: '🐛' },
  { name: 'Windows', icon: '🪟' },
  { name: 'Solar', icon: '☀️' },
  { name: 'Roofing', icon: '🏠' },
  { name: 'Internet', icon: '📡' },
  { name: 'Other', icon: '⭐' },
]

export function ContactSalesFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [calLoaded, setCalLoaded] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    salesRepRange: '',
    industry: '',
    companyName: '',
    fullName: '',
    workEmail: '',
    phoneNumber: ''
  })

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData(parsed.formData)
        setCurrentStep(parsed.currentStep)
      } catch (error) {
        console.error('Error loading saved form data:', error)
      }
    }
  }, [])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      formData,
      currentStep
    }))
  }, [formData, currentStep])

  // Initialize Cal.com embed when reaching step 3 (calendar step)
  useEffect(() => {
    if (currentStep === 3) {
      // Store form data in sessionStorage for Cal.com webhook
      sessionStorage.setItem('dooriq_contact_sales_form', JSON.stringify(formData))
      
      // Submit form data to API
      fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          workEmail: formData.workEmail,
          phoneNumber: formData.phoneNumber,
          companyName: formData.companyName,
          industry: formData.industry,
          numberOfReps: formData.salesRepRange,
          howDidYouHear: 'Pricing Page - Enterprise Plan',
          preferredContactMethod: 'video',
        }),
      }).catch(error => {
        console.error('Error submitting contact sales form:', error)
      })

      (async function () {
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
  }, [currentStep, formData])

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSelectSalesRepRange = (range: string) => {
    setFormData(prev => ({ ...prev, salesRepRange: range }))
    setTimeout(() => handleNext(), 300)
  }

  const handleSelectIndustry = (industry: string) => {
    setFormData(prev => ({ ...prev, industry }))
    setTimeout(() => handleNext(), 300)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-3 font-space">
            Get Started with DoorIQ
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg sm:text-xl text-neutral-700 dark:text-neutral-300 font-sans"
            >
              {currentStep === 0 && 'How many sales reps does your business have?'}
              {currentStep === 1 && 'What industry are you in?'}
              {currentStep === 2 && 'Tell us about your company'}
              {currentStep === 3 && 'Book your personalized demo'}
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
              className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 font-space">
                Select your sales rep range
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 font-sans">
                Choose the option that best describes your business
              </p>
              <div className="space-y-3">
                {salesRepRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => handleSelectSalesRepRange(range)}
                    className="w-full text-left px-6 py-4 rounded-full bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-0 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span className="text-lg font-medium text-neutral-900 dark:text-white">
                      {range}
                    </span>
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
              className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 sm:p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">← Back to sales rep selection</span>
              </button>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 font-space">
                Choose Your Industry
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 font-sans">
                Choose the category that best fits your business. This helps us tailor your setup.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {industries.map((industry) => (
                  <button
                    key={industry.name}
                    onClick={() => handleSelectIndustry(industry.name)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                      formData.industry === industry.name
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-200 dark:bg-neutral-700'
                        : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-4xl mb-2">{industry.icon}</span>
                    <span className="text-base font-medium text-neutral-900 dark:text-white">
                      {industry.name}
                    </span>
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
              className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 sm:p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">← Back to industry selection</span>
              </button>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 font-space">
                Company Information
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 font-sans">
                Please provide your company details so we can prepare for our call
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Company Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter your company name"
                    className="w-full bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Your Full Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Work Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, workEmail: e.target.value }))}
                    placeholder="your.email@company.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Phone Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="w-full bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
                  />
                </div>
                <Button
                  onClick={handleNext}
                  disabled={!formData.companyName.trim() || !formData.fullName.trim() || !formData.workEmail.trim()}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Continue to Schedule Meeting
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 sm:p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">← Back to company information</span>
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
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-base font-medium text-neutral-900 dark:text-white">
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

