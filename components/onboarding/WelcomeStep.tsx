'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Calendar, Users, Zap } from 'lucide-react'

interface WelcomeStepProps {
  userName?: string
  role: 'manager' | 'rep'
  planName?: string
  trialDays?: number
  onContinue: () => void
}

export function WelcomeStep({
  userName,
  role,
  planName = 'Team Plan',
  trialDays = 7,
  onContinue,
}: WelcomeStepProps) {
  const displayName = userName?.split(' ')[0] || 'there'

  return (
    <div className="w-full max-w-2xl mx-auto px-4 text-center">
      {/* Celebration icon */}
      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-2xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Welcome message */}
      <h1 className="font-space text-4xl md:text-5xl font-bold text-white mb-4">
        Welcome, {displayName}!
      </h1>

      <p className="text-xl text-white/70 mb-8 max-w-lg mx-auto">
        {role === 'manager'
          ? "You're all set to start building a world-class sales team with DoorIQ."
          : "You're ready to level up your sales skills with AI-powered training."}
      </p>

      {/* Plan info card */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 font-medium">{planName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <Calendar className="w-6 h-6 text-white/60 mx-auto mb-2" />
            <p className="text-white font-semibold">{trialDays}-Day Free Trial</p>
            <p className="text-white/50 text-sm">No charge until trial ends</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <Sparkles className="w-6 h-6 text-white/60 mx-auto mb-2" />
            <p className="text-white font-semibold">Unlimited Practice</p>
            <p className="text-white/50 text-sm">75 sessions per month</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <Users className="w-6 h-6 text-white/60 mx-auto mb-2" />
            <p className="text-white font-semibold">14 AI Personas</p>
            <p className="text-white/50 text-sm">Realistic homeowner types</p>
          </div>
        </div>
      </div>

      {/* Next steps preview */}
      <div className="text-left bg-white/5 rounded-xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-4">
          What's next in your setup:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-white/70">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
              1
            </div>
            Discover key features of DoorIQ
          </li>
          {role === 'manager' && (
            <li className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
                2
              </div>
              Invite your sales team
            </li>
          )}
          <li className="flex items-center gap-3 text-white/70">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
              {role === 'manager' ? '3' : '2'}
            </div>
            Start your first practice session
          </li>
          <li className="flex items-center gap-3 text-white/70">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
              {role === 'manager' ? '4' : '3'}
            </div>
            Learn pro tips for success
          </li>
        </ul>
      </div>

      <Button
        onClick={onContinue}
        className="h-14 px-10 bg-purple-600 hover:bg-purple-700 text-white font-medium text-lg"
      >
        Let's Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )
}

