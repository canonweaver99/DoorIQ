'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

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

  // Load Cal.com embed script when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && !calLoaded) {
      console.log('Step 4 reached, loading Cal.com...')
      
      // Cal.com initialization function
      const initCal = () => {
        try {
          (function (C: any, A: string, L: string) { 
            let p = function (a: any, ar: any) { a.q.push(ar); }; 
            let d = C.document; 
            C.Cal = C.Cal || function () { 
              let cal = C.Cal; 
              let ar = arguments; 
              if (!cal.loaded) { 
                cal.ns = {}; 
                cal.q = cal.q || []; 
                d.head.appendChild(d.createElement("script")).src = A; 
                cal.loaded = true; 
              } 
              if (ar[0] === L) { 
                const api = function () { p(api, arguments); }; 
                const namespace = ar[1]; 
                api.q = api.q || []; 
                if(typeof namespace === "string"){
                  cal.ns[namespace] = cal.ns[namespace] || api;
                  p(cal.ns[namespace], ar);
                  p(cal, ["initNamespace", namespace]);
                } else p(cal, ar); 
                return;
              } 
              p(cal, ar); 
            }; 
          })(window, "https://app.cal.com/embed/embed.js", "init");
          
          console.log('Cal.com script initialized')
          
          // Wait for Cal to be available
          const checkAndInit = () => {
            if ((window as any).Cal && (window as any).Cal.ns) {
              const Cal = (window as any).Cal;
              console.log('Calling Cal.init...')
              Cal("init", "dooriq", {origin:"https://app.cal.com"});
              
              setTimeout(() => {
                console.log('Calling Cal.ns.dooriq inline...')
                Cal.ns.dooriq("inline", {
                  elementOrSelector:"#my-cal-inline-dooriq",
                  config: {"layout":"month_view"},
                  calLink: "canon-weaver-aa0twn/dooriq",
                });
                Cal.ns.dooriq("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
                console.log('Cal.com embed initialized')
                setCalLoaded(true)
              }, 500)
            } else {
              console.log('Cal not ready yet, retrying...')
              setTimeout(checkAndInit, 200)
            }
          }
          
          checkAndInit()
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
        }
      }
      
      // Ensure DOM is ready
      setTimeout(initCal, 100)
    }
  }, [currentStep, calLoaded])

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
    
    switch (step) {
      case 0:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
        if (!formData.workEmail.trim()) newErrors.workEmail = 'Email is required'
        else if (!validateEmail(formData.workEmail)) newErrors.workEmail = 'Invalid email format'
        if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required'
        break
      
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
        if (!formData.industry) newErrors.industry = 'Industry is required'
        if (formData.numberOfReps < 1) newErrors.numberOfReps = 'Must have at least 1 sales rep'
        break
      
      case 2:
        if (!formData.howDidYouHear) newErrors.howDidYouHear = 'Please tell us how you heard about DoorIQ'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    }
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
    'Basic Information',
    'Company Details',
    'Needs Assessment',
    'Contact Preferences',
    'Schedule a Demo'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-purple-950/20 to-neutral-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Contact Sales</h1>
          <p className="text-slate-400">Let's discuss how DoorIQ can transform your sales team</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                    index < currentStep
                      ? "bg-primary text-white"
                      : index === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-slate-800 text-slate-500"
                  )}
                  initial={false}
                  animate={{
                    scale: index === currentStep ? 1.1 : 1
                  }}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-12 h-1 mx-2 transition-all",
                    index < currentStep ? "bg-primary" : "bg-slate-800"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <p key={index} className={cn(
                "text-xs transition-colors",
                index <= currentStep ? "text-slate-300" : "text-slate-600"
              )}>
                {step}
              </p>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {submitStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-emerald-900/20 via-emerald-800/20 to-green-900/20 rounded-2xl p-8 border border-emerald-700/30 text-center"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-900/20"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(88, 28, 135, 0.1) 100%)',
                boxShadow: '0 0 0 1px rgba(147, 51, 234, 0.1)',
              }}
            >
              {/* Step 0: Basic Information */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Let's get to know you</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.fullName ? "border-red-500" : "border-slate-700"
                      )}
                      placeholder="John Smith"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formData.workEmail}
                      onChange={(e) => handleInputChange('workEmail', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.workEmail ? "border-red-500" : "border-slate-700"
                      )}
                      placeholder="john@company.com"
                    />
                    {errors.workEmail && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.workEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        handleInputChange('phoneNumber', formatted)
                      }}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Title / Role *
                    </label>
                    <select
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.jobTitle ? "border-red-500" : "border-slate-700"
                      )}
                    >
                      <option value="" className="bg-slate-900">Select your role</option>
                      {jobTitles.map(title => (
                        <option key={title} value={title} className="bg-slate-900">
                          {title}
                        </option>
                      ))}
                    </select>
                    {errors.jobTitle && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.jobTitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Company Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Tell us about your company</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.companyName ? "border-red-500" : "border-slate-700"
                      )}
                      placeholder="ABC Company Inc."
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Industry *
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.industry ? "border-red-500" : "border-slate-700"
                      )}
                    >
                      <option value="" className="bg-slate-900">Select your industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry} className="bg-slate-900">
                          {industry}
                        </option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.industry}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Sales Reps *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.numberOfReps === 0 ? '' : formData.numberOfReps}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        handleInputChange('numberOfReps', value === '' ? 0 : parseInt(value))
                      }}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        errors.numberOfReps ? "border-red-500" : "border-slate-700"
                      )}
                      placeholder="e.g., 5"
                    />
                    {errors.numberOfReps && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.numberOfReps}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Needs Assessment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">How can we help?</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Primary Use Case (Optional)
                    </label>
                    <select
                      value={formData.primaryUseCase}
                      onChange={(e) => handleInputChange('primaryUseCase', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="" className="bg-slate-900">Select a use case</option>
                      {useCases.map(useCase => (
                        <option key={useCase} value={useCase} className="bg-slate-900">
                          {useCase}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      How did you hear about DoorIQ? *
                    </label>
                    <select
                      value={formData.howDidYouHear}
                      onChange={(e) => handleInputChange('howDidYouHear', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                        errors.howDidYouHear ? "border-red-500" : "border-slate-700"
                      )}
                    >
                      <option value="" className="bg-slate-900">Select an option</option>
                      {referralSources.map(source => (
                        <option key={source} value={source} className="bg-slate-900">
                          {source}
                        </option>
                      ))}
                    </select>
                    {errors.howDidYouHear && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.howDidYouHear}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      value={formData.additionalComments}
                      onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder="Tell us more about your sales training needs..."
                    />
                    <p className="mt-1 text-xs text-slate-500 text-right">
                      {formData.additionalComments.length}/500 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">How should we reach you?</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Preferred Contact Method
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'email', label: 'Email', icon: '✉️' },
                        { value: 'phone', label: 'Phone', icon: '📞' },
                        { value: 'video', label: 'Video Call', icon: '📹' }
                      ].map(method => (
                        <label
                          key={method.value}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                            formData.preferredContactMethod === method.value
                              ? "bg-primary/10 border-primary"
                              : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                          )}
                        >
                          <input
                            type="radio"
                            name="contactMethod"
                            value={method.value}
                            checked={formData.preferredContactMethod === method.value}
                            onChange={(e) => handleInputChange('preferredContactMethod', e.target.value as any)}
                            className="sr-only"
                          />
                          <span className="text-2xl">{method.icon}</span>
                          <span className="text-white font-medium">{method.label}</span>
                          {formData.preferredContactMethod === method.value && (
                            <Check className="w-5 h-5 text-primary ml-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Best Time to Reach You
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        value={formData.bestTimeToReach}
                        onChange={(e) => handleInputChange('bestTimeToReach', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="" className="bg-slate-900">Select a time</option>
                        <option value="morning" className="bg-slate-900">Morning (8am - 12pm)</option>
                        <option value="afternoon" className="bg-slate-900">Afternoon (12pm - 5pm)</option>
                        <option value="evening" className="bg-slate-900">Evening (5pm - 8pm)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Schedule Demo */}
              {currentStep === 4 && (
                <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-purple-950/20 to-neutral-950 z-50 flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800">
                    <div className="max-w-7xl mx-auto">
                      <div className="flex items-center gap-4 mb-2">
                        <Calendar className="w-8 h-8 text-primary" />
                        <div>
                          <h2 className="text-2xl font-bold text-white">Schedule Your Demo</h2>
                          <p className="text-sm text-slate-400">30-minute personalized demo with our sales team</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cal.com Embed - Full Height */}
                  <div className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto p-6">
                      <div 
                        style={{ width: '100%', minHeight: 'calc(100vh - 250px)' }} 
                        id="my-cal-inline-dooriq"
                        className="rounded-xl bg-white relative"
                      >
                        {!calLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer with navigation and note */}
                  <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="max-w-7xl mx-auto">
                      <p className="text-sm text-slate-400 text-center mb-4">
                        You can also submit without scheduling and we'll reach out within 24 hours
                      </p>
                      
                      <div className="flex gap-4 max-w-md mx-auto">
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit & Get Started'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons - Hidden on step 4 (full screen calendar) */}
              {currentStep !== 4 && (
                <div className="flex gap-4 mt-8">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
                    >
                      Previous
                    </button>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit & Get Started'
                      )}
                    </button>
                  )}
                </div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-900/20 border border-red-700/30 rounded-xl"
                >
                  <p className="text-red-400 text-sm flex items-center gap-2">
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
