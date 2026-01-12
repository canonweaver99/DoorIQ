'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  ArrowLeft,
  Mic,
  BarChart3,
  Users,
  Brain,
  Target,
  Trophy,
  BookOpen,
  Headphones,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeaturesStepProps {
  role: 'manager' | 'rep'
  onContinue: () => void
  onBack: () => void
}

const repFeatures = [
  {
    icon: Mic,
    title: 'AI Voice Practice',
    description:
      'Practice your pitch with realistic AI homeowners. Get instant feedback on your tone, pacing, and objection handling.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Brain,
    title: '14 Unique Personas',
    description:
      'From "Skeptical Steve" to "Busy Betty" - train with every type of homeowner you\'ll meet in the field.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Track your progress with detailed session analytics. See what\'s working and where to improve.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description:
      'Compete with your team and see how you stack up. Gamified training keeps you motivated.',
    color: 'from-amber-500 to-orange-600',
  },
]

const managerFeatures = [
  {
    icon: Users,
    title: 'Team Dashboard',
    description:
      'See real-time performance across your entire team. Identify top performers and reps who need coaching.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Target,
    title: 'Custom Grading',
    description:
      'Set your own grading criteria based on your company\'s sales methodology and scripts.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: BookOpen,
    title: 'Training Materials',
    description:
      'Upload custom videos and documents. Create a knowledge base tailored to your products.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Headphones,
    title: 'Session Reviews',
    description:
      'Listen to rep sessions and provide personalized coaching feedback to accelerate their growth.',
    color: 'from-amber-500 to-orange-600',
  },
]

export function FeaturesStep({ role, onContinue, onBack }: FeaturesStepProps) {
  const [activeFeature, setActiveFeature] = useState(0)
  const features = role === 'manager' ? managerFeatures : repFeatures

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="font-space text-3xl md:text-4xl font-bold text-white mb-4">
          {role === 'manager'
            ? 'Your Team Management Tools'
            : 'Your Training Arsenal'}
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          {role === 'manager'
            ? 'Everything you need to build and manage a high-performing sales team.'
            : 'Powerful tools designed to make you the best door-to-door salesperson.'}
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const isActive = activeFeature === index

          return (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={cn(
                'relative p-6 rounded-2xl text-left transition-all duration-300',
                'border hover:scale-[1.02] focus:outline-none',
                isActive
                  ? 'bg-white/10 border-purple-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              )}
            >
              {/* Icon with gradient */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  'bg-gradient-to-br',
                  feature.color
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-space text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>

              <p className="text-white/60 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tip box */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-8">
        <p className="text-white/80 text-center">
          <span className="text-purple-400 font-medium">Pro tip:</span>{' '}
          {role === 'manager'
            ? 'Invite your team first, then upload your training materials for a personalized experience.'
            : 'Start with the easier AI personas and work your way up to the challenging ones.'}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 px-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onContinue}
          className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

