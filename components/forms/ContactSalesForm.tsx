'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import Cal, { getCalApi } from "@calcom/embed-react"

// Form validation types
interface FormData {
  // Basic Information
  fullName: string
  workEmail: string
  phoneNumber: string
  jobTitle: string
  
  // Company Details
  companyName: string
  industry: string
  numberOfReps: number
  
  // Needs Assessment
  primaryUseCase: string
  howDidYouHear: string
  
  // Contact Preferences
  preferredContactMethod: 'email' | 'phone' | 'video'
  bestTimeToReach: string
  timezone: string
  
  // Additional Information
  additionalComments: string
}

interface FormErrors {
  [key: string]: string
}

const jobTitles = [
  'Sales Manager',
  'Sales Representative',
  'Sales Enablement',
  'Executive/Owner',
  'Other'
]

const industries = [
  'Pest Control',
  'Solar',
  'Internet',
  'Roofing',
  'Other Home Service'
]

const useCases = [
  'New hire onboarding',
  'Ongoing training',
  'Performance improvement',
  'All of the above'
]

const referralSources = [
  'Google search',
  'ChatGPT or other AI/LLM',
  'Social media',
  'Referral',
  'Industry event/conference',
  'Other'
]


const STORAGE_KEY = 'dooriq_contact_sales_form'

export function ContactSalesForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<FormErrors>({})
  const [calLoaded, setCalLoaded] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    jobTitle: '',
    companyName: '',
    industry: '',
    numberOfReps: 0,
    primaryUseCase: '',
    howDidYouHear: '',
    preferredContactMethod: 'email',
    bestTimeToReach: '',
    timezone: '',
    additionalComments: ''
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
    if (submitStatus !== 'success') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData,
        currentStep
      }))
    } else {
      // Clear saved data after successful submission
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [formData, currentStep, submitStatus])

  // Initialize Cal.com embed when reaching step 0 (first step)
  useEffect(() => {
    if (currentStep === 0) {
      (async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"});
          cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
          // Set loaded after a brief delay to allow Cal to initialize
          setTimeout(() => {
            setCalLoaded(true)
          }, 1000)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true) // Show anyway if there's an error
        }
      })();
    } else {
      setCalLoaded(false) // Reset when leaving step 0
    }
  }, [currentStep])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    }
    return value
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}
    // No validation required - calendar step is optional
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    // No longer needed - only one step now
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        
        // Trigger celebration confetti
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
        
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min
        
        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now()
          
          if (timeLeft <= 0) {
            return clearInterval(interval)
          }
          
          const particleCount = 50 * (timeLeft / duration)
          
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          })
          
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          })
        }, 250)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    'Calendar'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-purple-950/20 to-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header - Minimalist */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Schedule a Demo</h1>
          <p className="text-sm sm:text-base text-slate-400">Choose a time that works for you</p>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {submitStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-emerald-900/20 via-emerald-800/20 to-green-900/20 rounded-2xl p-8 border border-emerald-700/30 text-center max-w-2xl mx-auto"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
              <p className="text-slate-300 mb-6">
                We've received your information and our sales team will contact you within 24 hours.
              </p>
              <div className="space-y-3">
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all"
                >
                  Go to Dashboard
                </a>
                <p className="text-sm text-slate-400">
                  Check your email for a confirmation message
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              {/* Cal.com Embed - Full Width, No Padding */}
              <div 
                className="rounded-xl bg-white relative w-full shadow-2xl overflow-hidden"
                        style={{ 
                  minHeight: 'calc(100vh - 200px)',
                  height: 'calc(100vh - 200px)',
                  maxHeight: '900px'
                        }}
                      >
                        <Cal 
                          namespace="dooriq"
                          calLink="canon-weaver-aa0twn/dooriq"
                          style={{
                            width: "100%",
                            height: "100%",
                    minHeight: "calc(100vh - 200px)",
                    maxHeight: "900px",
                    overflow: "auto",
                    padding: "0"
                          }}
                          config={{"layout":"month_view"}}
                        />
                        {!calLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-base font-medium text-slate-700">Loading calendar...</p>
                            </div>
                          </div>
                        )}
                  </div>

              {/* Optional Submit Button - Positioned below */}
              <div className="flex justify-center mt-6">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                    'Skip scheduling'
                          )}
                        </button>
                      </div>

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-900/20 border border-red-700/30 rounded-xl max-w-2xl mx-auto"
                >
                  <p className="text-red-400 text-sm flex items-center gap-2 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    Something went wrong. Please try again or contact support.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
