'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Cal, { getCalApi } from "@calcom/embed-react"

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
  '10-25',
  '26-50',
  '51-100',
  '101-250',
  '250+'
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

  // Initialize Cal.com embed after form submission
  useEffect(() => {
    if (formSubmitted) {
      (async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"})
          cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"})
          setTimeout(() => {
            setCalLoaded(true)
          }, 1000)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true)
        }
      })()
    }
  }, [formSubmitted])

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

  const handleCalBookingComplete = () => {
    // Redirect to thank you page after booking
    router.push('/book-demo/thank-you')
  }

  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center">Ready to see DoorIQ in action?</h1>
            <p className="text-slate-400 text-center">Pick a time that works best for you</p>
          </motion.div>

          <div 
            className="relative w-full overflow-hidden rounded-lg bg-white"
            style={{ 
              minHeight: 'calc(100vh - 300px)',
              height: 'calc(100vh - 300px)',
              maxHeight: '900px'
            }}
          >
            <Cal 
              namespace="dooriq"
              calLink="canon-weaver-aa0twn/dooriq"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "calc(100vh - 300px)",
                maxHeight: "900px",
                overflow: "auto",
                padding: "0"
              }}
              config={{"layout":"month_view"}}
              calSuccessCallback={handleCalBookingComplete}
            />
            {!calLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-base font-medium text-slate-900">Loading calendar...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="w-[80%] max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-center">
            Ready to see DoorIQ in action?
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 sm:p-10 lg:p-12 border border-slate-700/50 shadow-2xl"
        >
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* First Name and Last Name - Same Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
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
                  className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
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
                  className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

          {/* Work Email */}
          <div>
            <label htmlFor="workEmail" className="block text-sm font-medium text-white mb-2">
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
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
            />
            {errors.workEmail && (
              <p className="mt-1 text-sm text-red-400">{errors.workEmail}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-white mb-2">
              Phone Number*
            </label>
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="px-3 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {COUNTRY_CODES.map(({ code, flag }) => (
                  <option key={code} value={code}>
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
                className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
              />
            </div>
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-white mb-2">
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
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-white mb-2">
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
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
            />
            {errors.jobTitle && (
              <p className="mt-1 text-sm text-red-400">{errors.jobTitle}</p>
            )}
          </div>

          {/* Number of Sales Representatives */}
          <div>
            <label htmlFor="numberOfReps" className="block text-sm font-medium text-white mb-2">
              Number of Sales Representatives*
            </label>
            <select
              id="numberOfReps"
              value={formData.numberOfReps}
              onChange={(e) => {
                setFormData({ ...formData, numberOfReps: e.target.value })
                if (errors.numberOfReps) setErrors({ ...errors, numberOfReps: undefined })
              }}
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Please Select</option>
              {NUMBER_OF_REPS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-300">
              PLEASE NOTE: DoorIQ is designed for established sales teams with 10+ sales reps
            </p>
            {errors.numberOfReps && (
              <p className="mt-1 text-sm text-red-400">{errors.numberOfReps}</p>
            )}
          </div>

          {/* How did you hear about us */}
          <div>
            <label htmlFor="howDidYouHear" className="block text-sm font-medium text-white mb-2">
              How did you hear about us?*
            </label>
            <select
              id="howDidYouHear"
              value={formData.howDidYouHear}
              onChange={(e) => {
                setFormData({ ...formData, howDidYouHear: e.target.value })
                if (errors.howDidYouHear) setErrors({ ...errors, howDidYouHear: undefined })
              }}
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Please Select</option>
              {HOW_DID_YOU_HEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
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
            <label htmlFor="meetingGoals" className="block text-sm font-medium text-white mb-2">
              What do you hope to get out of this meeting?
            </label>
            <textarea
              id="meetingGoals"
              value={formData.meetingGoals}
              onChange={(e) => setFormData({ ...formData, meetingGoals: e.target.value })}
              placeholder="e.g. Understand how DoorIQ increases sales, improves sales rep retention, and streamlines my sales operations"
              rows={4}
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>SUBMIT</span>
              )}
            </button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
}

