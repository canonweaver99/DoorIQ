'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Loader2, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const REFERRAL_SOURCES = [
  'Social Media',
  'Referral',
  'ChatGPT',
  'Google Search',
  'Other'
]

export default function PricingContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    numReps: '',
    email: '',
    referralSource: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required'
    }

    if (!formData.numReps) {
      newErrors.numReps = 'Number of reps is required'
    } else {
      const reps = parseInt(formData.numReps)
      if (isNaN(reps) || reps < 5 || reps > 100) {
        newErrors.numReps = 'Please enter a number between 5 and 100'
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.referralSource) {
      newErrors.referralSource = 'Please select how you found DoorIQ'
    }

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
      const response = await fetch('/api/pricing/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      // Store reps in sessionStorage as backup
      sessionStorage.setItem('dooriq_pricing_reps', formData.numReps)

      // Redirect to pricing page with reps param
      router.push(`/pricing?reps=${formData.numReps}`)
    } catch (error: any) {
      console.error('Form submission error:', error)
      setErrors({ submit: error.message || 'Something went wrong. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="w-full relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full min-h-screen py-6 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-2xl mx-auto pt-12 pb-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8 relative pb-8"
            >
              <div
                className={cn(
                  'z-[-10] pointer-events-none absolute -inset-10 size-[calc(100%+5rem)]',
                  'bg-[linear-gradient(to_right,theme(colors.white/.085)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.085)_1px,transparent_1px)]',
                  'bg-[size:32px_32px]',
                  '[mask-image:radial-gradient(ellipse_120%_100%_at_50%_50%,var(--background)_10%,transparent_80%)]',
                )}
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                Get Started with DoorIQ
              </h1>
              <p className="text-lg sm:text-xl text-white/80 mb-8 font-medium relative z-10">
                Tell us a bit about your team and we'll show you pricing
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black relative border border-white/20 p-6 sm:p-8 rounded-lg"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-white text-sm font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-black text-white placeholder-white/40",
                      "focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                      errors.name ? "border-red-500" : "border-white/30"
                    )}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="industry" className="block text-white text-sm font-semibold mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-black text-white placeholder-white/40",
                      "focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                      errors.industry ? "border-red-500" : "border-white/30"
                    )}
                    placeholder="e.g., Pest Control, Windows, Solar"
                  />
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-500">{errors.industry}</p>
                  )}
                </div>

                {/* Number of Reps */}
                <div>
                  <label htmlFor="numReps" className="block text-white text-sm font-semibold mb-2">
                    Number of Sales Reps *
                  </label>
                  <input
                    type="number"
                    id="numReps"
                    min="5"
                    max="100"
                    value={formData.numReps}
                    onChange={(e) => setFormData({ ...formData, numReps: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-black text-white placeholder-white/40",
                      "focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                      errors.numReps ? "border-red-500" : "border-white/30"
                    )}
                    placeholder="15"
                  />
                  <p className="mt-1 text-sm text-white/60">Between 5 and 100 reps</p>
                  {errors.numReps && (
                    <p className="mt-1 text-sm text-red-500">{errors.numReps}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-black text-white placeholder-white/40",
                      "focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                      errors.email ? "border-red-500" : "border-white/30"
                    )}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* How they found DoorIQ */}
                <div>
                  <label htmlFor="referralSource" className="block text-white text-sm font-semibold mb-2">
                    How did you find DoorIQ? *
                  </label>
                  <div className="relative">
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none z-10" />
                    <select
                      id="referralSource"
                      value={formData.referralSource}
                      onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-lg border bg-black text-white appearance-none",
                        "focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                        errors.referralSource ? "border-red-500" : "border-white/30"
                      )}
                    >
                      <option value="" className="bg-black">Select an option</option>
                      {REFERRAL_SOURCES.map((source) => (
                        <option key={source} value={source} className="bg-black">
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.referralSource && (
                    <p className="mt-1 text-sm text-red-500">{errors.referralSource}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                    <p className="text-sm text-red-500">{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-lg bg-white text-black hover:bg-gray-100 font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Pricing</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

