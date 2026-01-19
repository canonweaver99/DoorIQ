'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Cal, { getCalApi } from "@calcom/embed-react"
import Link from 'next/link'
import Image from 'next/image'

interface FormData {
  firstName: string
  lastName: string
  workEmail: string
  phoneNumber: string
  countryCode: string
  companyName: string
  jobTitle: string
  numberOfReps: string
  howDidYouHear: string
  meetingGoals: string
}

const HOW_DID_YOU_HEAR_OPTIONS = [
  'Google search',
  'ChatGPT or other AI/LLM',
  'Social media',
  'Referral',
  'Industry event/conference',
  'Other'
]

const NUMBER_OF_REPS_OPTIONS = [
  '1-20',
  '21-100',
  '101+'
]

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+1', country: 'CA', flag: '🇨🇦' },
]

export default function BookDemoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    workEmail: '',
    phoneNumber: '',
    countryCode: '+1',
    companyName: '',
    jobTitle: '',
    numberOfReps: '',
    howDidYouHear: '',
    meetingGoals: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [calLoaded, setCalLoaded] = useState(false)

  // Initialize Cal.com embed after form submission with prefill
  useEffect(() => {
    if (formSubmitted) {
      (async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"})
          cal("ui", {
            "hideEventTypeDetails": false,
            "layout": "month_view",
            "prefill": {
              "name": `${formData.firstName} ${formData.lastName}`,
              "email": formData.workEmail,
              "notes": formData.meetingGoals || undefined
            }
          })
          
          // Set up success callback via Cal.com API
          cal("on", {
            action: "bookingSuccessful",
            callback: () => {
              router.push('/book-demo/thank-you')
            }
          })
          
          setTimeout(() => {
            setCalLoaded(true)
          }, 1000)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true)
        }
      })()
    }
  }, [formSubmitted, formData, router])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.workEmail.trim()) {
      newErrors.workEmail = 'Work email is required'
    } else if (!emailRegex.test(formData.workEmail)) {
      newErrors.workEmail = 'Please enter a valid email address'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    }

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
    if (!formData.numberOfReps) newErrors.numberOfReps = 'Please select number of sales representatives'
    if (!formData.howDidYouHear) newErrors.howDidYouHear = 'Please select how you heard about us'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          workEmail: formData.workEmail,
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          numberOfReps: formData.numberOfReps,
          howDidYouHear: formData.howDidYouHear,
          meetingGoals: formData.meetingGoals || null
        })
      })

      if (response.ok) {
        // Store form data for Cal.com webhook
        sessionStorage.setItem('demo_request_data', JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          workEmail: formData.workEmail,
          companyName: formData.companyName
        }))
        
        setFormSubmitted(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setErrors({ submit: errorData.error || 'Failed to submit form. Please try again.' })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ submit: 'Failed to submit form. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-pink-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -70, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/15 via-blue-500/15 to-transparent rounded-full blur-[100px]"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20 md:h-24">
            <Link href="/landing" className="group">
              <Image 
                src="/dooriqlogo.png" 
                alt="DoorIQ" 
                width={1280}
                height={214}
                className="h-8 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <Link
              href="/landing"
              className="text-white/80 hover:text-white transition-colors text-sm font-space"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {formSubmitted ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-white text-center font-bold leading-[1.2] sm:leading-[1.3] mb-2 w-full">Ready to see <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">DoorIQ</span> in action?</h1>
            <p className="text-white/80 text-center font-sans">Pick a time that works best for you</p>
          </motion.div>

          <div 
            className="relative w-full overflow-hidden rounded-lg bg-white/[0.02] border-2 border-white/20 shadow-2xl"
            style={{ 
              minHeight: 'calc(100vh - 300px)',
              height: 'calc(100vh - 300px)',
              maxHeight: '900px'
            }}
          >
            <Cal 
              namespace="dooriq"
              calLink={`canon-weaver-aa0twn/dooriq?name=${encodeURIComponent(`${formData.firstName} ${formData.lastName}`)}&email=${encodeURIComponent(formData.workEmail)}${formData.meetingGoals ? `&notes=${encodeURIComponent(formData.meetingGoals)}` : ''}`}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "calc(100vh - 300px)",
                maxHeight: "900px",
                overflow: "auto",
                padding: "0"
              }}
              config={{
                "layout": "month_view",
                "prefill": {
                  "name": `${formData.firstName} ${formData.lastName}`,
                  "email": formData.workEmail,
                  "notes": formData.meetingGoals || undefined
                },
                "hideEventTypeDetails": false
              }}
            />
            {!calLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-base font-medium text-slate-900">Loading calendar...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pt-28 md:pt-32">
          <div className="w-full max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <h1 className="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-white text-center font-bold leading-[1.2] sm:leading-[1.3] mb-4 w-full">
                Ready to see <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">DoorIQ</span> in action?
              </h1>
              <p className="text-white/80 text-lg md:text-xl font-sans font-light">
                Book a demo and see how we can transform your sales team
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.02] border-2 border-white/20 rounded-lg p-8 sm:p-10 lg:p-12 hover:border-white/30 transition-all duration-500"
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* First Name and Last Name - Same Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2 font-space">
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value })
                        if (errors.firstName) setErrors({ ...errors, firstName: undefined })
                      }}
                      placeholder="e.g. Alex"
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2 font-space">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value })
                        if (errors.lastName) setErrors({ ...errors, lastName: undefined })
                      }}
                      placeholder="e.g. Hormozi"
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label htmlFor="workEmail" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    Work Email*
                  </label>
                  <input
                    type="email"
                    id="workEmail"
                    value={formData.workEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, workEmail: e.target.value })
                      if (errors.workEmail) setErrors({ ...errors, workEmail: undefined })
                    }}
                    placeholder="e.g. alex@acquisition.com"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                  />
                  {errors.workEmail && (
                    <p className="mt-1 text-sm text-red-400">{errors.workEmail}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    Phone Number*
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="px-3 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] font-sans transition-all"
                    >
                      {COUNTRY_CODES.map(({ code, flag, country }) => (
                        <option key={`${code}-${country}`} value={code} className="bg-black text-white">
                          {flag} {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, phoneNumber: e.target.value })
                        if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined })
                      }}
                      placeholder="(555) 123-4567"
                      className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    Company Name*
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value })
                      if (errors.companyName) setErrors({ ...errors, companyName: undefined })
                    }}
                    placeholder="e.g. Acquisition.com"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    Job Title*
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, jobTitle: e.target.value })
                      if (errors.jobTitle) setErrors({ ...errors, jobTitle: undefined })
                    }}
                    placeholder="e.g. Founder"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 font-sans transition-all"
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-400">{errors.jobTitle}</p>
                  )}
                </div>

                {/* Number of Sales Representatives */}
                <div>
                  <label htmlFor="numberOfReps" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    Number of Sales Representatives*
                  </label>
                  <select
                    id="numberOfReps"
                    value={formData.numberOfReps}
                    onChange={(e) => {
                      setFormData({ ...formData, numberOfReps: e.target.value })
                      if (errors.numberOfReps) setErrors({ ...errors, numberOfReps: undefined })
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] font-sans transition-all"
                  >
                    <option value="" className="bg-black text-white">Please Select</option>
                    {NUMBER_OF_REPS_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-black text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-white/70 font-sans">
                    PLEASE NOTE: DoorIQ is designed for established sales teams with 10+ sales reps
                  </p>
                  {errors.numberOfReps && (
                    <p className="mt-1 text-sm text-red-400">{errors.numberOfReps}</p>
                  )}
                </div>

                {/* How did you hear about us */}
                <div>
                  <label htmlFor="howDidYouHear" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    How did you hear about us?*
                  </label>
                  <select
                    id="howDidYouHear"
                    value={formData.howDidYouHear}
                    onChange={(e) => {
                      setFormData({ ...formData, howDidYouHear: e.target.value })
                      if (errors.howDidYouHear) setErrors({ ...errors, howDidYouHear: undefined })
                    }}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] font-sans transition-all"
                  >
                    <option value="" className="bg-black text-white">Please Select</option>
                    {HOW_DID_YOU_HEAR_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-black text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.howDidYouHear && (
                    <p className="mt-1 text-sm text-red-400">{errors.howDidYouHear}</p>
                  )}
                </div>

                {/* What do you hope to get out of this meeting */}
                <div>
                  <label htmlFor="meetingGoals" className="block text-sm font-medium text-white/90 mb-2 font-space">
                    What do you hope to get out of this meeting?
                  </label>
                  <textarea
                    id="meetingGoals"
                    value={formData.meetingGoals}
                    onChange={(e) => setFormData({ ...formData, meetingGoals: e.target.value })}
                    placeholder="e.g. Understand how DoorIQ increases sales, improves sales rep retention, and streamlines my sales operations"
                    rows={4}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 text-white rounded-md focus:outline-none focus:border-white/30 focus:bg-white/[0.08] placeholder:text-white/40 resize-none font-sans transition-all"
                  />
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-red-400 text-sm flex items-center gap-2 font-sans">
                      <AlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full px-8 py-3.5 bg-gray-200 text-gray-900 font-medium rounded-md text-base tracking-tight hover:bg-gray-300 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-space"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Calendar</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

