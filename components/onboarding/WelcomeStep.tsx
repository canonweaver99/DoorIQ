'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

interface WelcomeStepProps {
  userName?: string
  role: 'manager' | 'rep'
  planName?: string
  trialDays?: number
  onContinue: () => void
}

// Calculate ROI value for unlimited practice
// Assumes: 75 sessions/month, average deal value $500, practice helps close 1 extra deal/month
const calculatePracticeValue = () => {
  const sessionsPerMonth = 75
  const averageDealValue = 500 // Default deal value
  const extraDealsPerMonth = 1 // Conservative estimate
  const annualValue = extraDealsPerMonth * averageDealValue * 12
  return Math.round(annualValue)
}

export function WelcomeStep({
  userName,
  role,
  planName = 'Individual Plan',
  trialDays = 7,
  onContinue,
}: WelcomeStepProps) {
  const displayName = userName?.split(' ')[0] || 'there'
  const [practiceValue, setPracticeValue] = useState(calculatePracticeValue())
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate ROI dynamically if we have user data
  useEffect(() => {
    // Could fetch user's average deal value from their profile/sessions
    // For now, use default calculation
    setPracticeValue(calculatePracticeValue())
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12 md:space-y-16">
        {/* Header Section */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-4"
        >
          <h1 className="font-space text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Welcome,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {displayName}
            </span>
            !
        </h1>

          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            You're about to master door-to-door sales with AI homeowners who feel completely real
          </p>
        </motion.div>

        {/* Plan Section - Wrapped in Single Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-7 lg:p-9"
        >
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-bold text-2xl md:text-3xl">
                {planName}
              </h2>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* Card 1: Head Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-1">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg md:text-xl">Your {trialDays}-Day Head Start</h3>
                    <p className="text-white/90 text-sm md:text-base leading-relaxed">Start mastering your pitch risk-free</p>
                  </div>
        </div>
          </motion.div>

          {/* Card 2: Unlimited Practice with ROI */}
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-1">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg md:text-xl">Unlimited Practice Sessions</h3>
                    <p className="text-white/90 text-sm md:text-base leading-relaxed">
              Worth <span className="text-green-400 font-bold">${practiceValue.toLocaleString()}/year</span> in saved leads
            </p>
                  </div>
              </div>
          </motion.div>

          {/* Card 3: Personas */}
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-1">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg md:text-xl">14 Realistic Homeowner Personas</h3>
                    <p className="text-white/90 text-sm md:text-base leading-relaxed">From friendly to hostile</p>
                  </div>
                </div>
          </motion.div>
        </div>

            {/* See Calculation Link - Positioned under Card 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div></div>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-purple-400 text-xs hover:text-purple-300 underline transition-colors relative"
                >
                  * See calculation
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-4 bg-zinc-900/95 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white/90 w-72 z-20 shadow-2xl"
                    >
                      Based on 75 sessions/month helping close 1 extra deal/month at $500/deal value. Actual results may vary.
                    </motion.div>
                  )}
                </button>
              </div>
              <div></div>
          </div>
        </div>
      </motion.div>

      {/* Onboarding Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl py-4 px-3 md:py-5 md:px-4 max-w-2xl mx-auto"
      >
          <h3 className="text-white font-bold text-2xl md:text-3xl mb-4 text-center md:text-left">
          Your path from nervous to confident:
        </h3>
        <ul className="space-y-4">
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center gap-4"
          >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
              1
            </div>
              <span className="text-white text-xl font-semibold">Explore DoorIQ's powerful features</span>
          </motion.li>
          {role === 'manager' && (
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex items-center gap-4"
            >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
                2
              </div>
                <span className="text-white text-xl font-semibold">Invite your sales team to start training</span>
            </motion.li>
          )}
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: role === 'manager' ? 0.6 : 0.5 }}
              className="flex items-center gap-4"
          >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
              {role === 'manager' ? '3' : '2'}
            </div>
              <span className="text-white text-xl font-semibold">Practice with your first AI homeowner</span>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: role === 'manager' ? 0.7 : 0.6 }}
              className="flex items-center gap-4"
          >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
              {role === 'manager' ? '4' : '3'}
            </div>
              <span className="text-white text-xl font-semibold">Master advanced closing techniques</span>
          </motion.li>
        </ul>
      </motion.div>

        {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center pt-4"
      >
        <Button
          onClick={onContinue}
            className="h-14 px-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg transition-all rounded-xl"
        >
          Let's Transform Your Sales Game
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
      </div>
    </div>
  )
}

