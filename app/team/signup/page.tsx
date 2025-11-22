'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TeamSignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [organizationName, setOrganizationName] = useState('')
  const [seatCount, setSeatCount] = useState(10)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  const monthlyCost = seatCount * 69
  const trialDays = 14

  const handleNext = () => {
    if (step === 1 && organizationName.trim()) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/team/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          seatCount,
          userEmail: userEmail.trim() || undefined,
          userName: userName.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-32 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Start Your Team Plan</h1>
          <p className="text-gray-400">Get your sales team trained with DoorIQ</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > s ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Organization Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-bold text-white">Organization Name</h2>
              </div>
              <div>
                <Label htmlFor="orgName" className="text-gray-300">
                  What's your company or organization name?
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Sales Co."
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!organizationName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Number of Seats */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-bold text-white">Team Size</h2>
              </div>
              <div>
                <Label htmlFor="seats" className="text-gray-300">
                  How many sales reps will be using DoorIQ?
                </Label>
                <div className="mt-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={seatCount}
                    onChange={(e) => setSeatCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-400">
                    <span>1</span>
                    <span className="text-2xl font-bold text-white">{seatCount}</span>
                    <span>100</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  You can always add or remove seats later
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Review Your Plan</h2>
              
              <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Organization:</span>
                  <span className="text-white font-semibold">{organizationName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Seats:</span>
                  <span className="text-white font-semibold">{seatCount}</span>
                </div>
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Monthly Cost:</span>
                    <span className="text-2xl font-bold text-white">${monthlyCost.toLocaleString()}/month</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    ${69} per seat × {seatCount} seats
                  </p>
                </div>
                <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-purple-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">{trialDays}-day free trial</span>
                  </div>
                  <p className="text-sm text-purple-200 mt-1">
                    No charge for {trialDays} days, then ${monthlyCost.toLocaleString()}/month
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>All plans include unlimited practice sessions and full access to all features.</p>
          <p className="mt-2">
            Questions? <a href="/contact-sales" className="text-purple-400 hover:text-purple-300">Contact Sales</a>
          </p>
        </div>
      </div>
    </div>
  )
}

