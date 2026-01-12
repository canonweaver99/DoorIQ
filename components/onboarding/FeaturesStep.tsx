'use client'

import { motion } from 'framer-motion'
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
  Shield,
  Zap,
  MessageSquare,
  LineChart,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
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
      'Practice your pitch with realistic AI homeowners. Get instant feedback on your tone and pacing.',
  },
  {
    icon: Brain,
    title: '14 Unique Personas',
    description:
      'From "Skeptical Steve" to "Busy Betty" - train with every homeowner type you\'ll meet.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Track your progress with detailed analytics. See what\'s working and where to improve.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description:
      'Compete with your team and see how you stack up. Gamified training keeps you motivated.',
  },
  {
    icon: Shield,
    title: 'Objection Handling',
    description:
      'Master tough objections with AI-powered scenarios that prepare you for anything.',
  },
  {
    icon: Zap,
    title: 'Real-time Feedback',
    description:
      'Instant coaching on tone, pacing, and persuasion techniques as you practice.',
  },
  {
    icon: MessageSquare,
    title: 'Script Practice',
    description:
      'Perfect your scripts with AI homeowners who respond naturally to your approach.',
  },
  {
    icon: Clock,
    title: 'Unlimited Practice',
    description:
      'No caps, no limits. Train as much as you need to become a closer.',
  },
]

const managerFeatures = [
  {
    icon: Users,
    title: 'Team Dashboard',
    description:
      'See real-time performance across your team. Identify top performers and reps needing coaching.',
  },
  {
    icon: Target,
    title: 'Custom Grading',
    description:
      'Set your own grading criteria based on your company\'s sales methodology.',
  },
  {
    icon: BookOpen,
    title: 'Training Materials',
    description:
      'Upload custom videos and documents. Create a knowledge base for your products.',
  },
  {
    icon: Headphones,
    title: 'Session Reviews',
    description:
      'Listen to rep sessions and provide personalized coaching to accelerate growth.',
  },
  {
    icon: LineChart,
    title: 'Manager Insights',
    description:
      'See where each rep needs coaching without sitting in on calls.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Reports',
    description:
      'Get detailed analytics on team performance and improvement trends.',
  },
  {
    icon: FileText,
    title: 'Custom Scripts',
    description:
      'Create and assign custom scripts tailored to your company\'s approach.',
  },
  {
    icon: CheckCircle2,
    title: 'Progress Tracking',
    description:
      'Monitor each rep\'s training progress and completion rates.',
  },
]

export function FeaturesStep({ role, onContinue, onBack }: FeaturesStepProps) {
  const features = role === 'manager' ? managerFeatures : repFeatures

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-6 md:mb-8"
      >
        <h1 className="font-space text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6">
          {role === 'manager' ? (
            <>
              Your Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Management Tools</span>
            </>
          ) : (
            <>
              Your Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Arsenal</span>
            </>
          )}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
          {role === 'manager'
            ? 'Everything you need to build and manage a high-performing sales team.'
            : 'Powerful tools designed to make you the best door-to-door salesperson.'}
        </p>
      </motion.div>

      {/* Features Grid - Matching Landing Page Style */}
      <div className="flex justify-center w-full relative z-10 pt-4 pb-8 md:pt-6 md:pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 max-w-7xl w-full border-t-[2px] border-white/20">
        {features.map((feature, index) => {
          const Icon = feature.icon
            const isLeftColumn = index % 4 === 0
            const isBottomRow = index >= 4

          return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full flex"
              >
                <div
                  className={cn(
                    'flex flex-col py-6 md:py-8 lg:py-10 relative group/feature border-white/20 h-full min-h-[160px] md:min-h-[200px] w-full',
                    // Left border for left column only
                    isLeftColumn && 'border-l-[2px]',
                    // Right border for all cards
                    'border-r-[2px]',
                    // Bottom border for all cards
                    'border-b-[2px]',
                    // Extra padding for bottom row
                    isBottomRow && 'pb-8 md:pb-10'
                  )}
                >
                  {/* Hover gradient effect */}
                  {index % 4 < 2 && (
                    <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
                  )}
                  {index % 4 >= 2 && (
                    <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                  )}

                  {/* Icon */}
                  <div className="mb-4 md:mb-5 relative z-10 px-5 md:px-8 lg:px-10 text-white">
                    <div className="scale-110 md:scale-125">
                      <Icon className="w-6 h-6" />
                    </div>
              </div>

                  {/* Title */}
                  <div className="text-xl md:text-2xl lg:text-3xl font-medium mb-3 md:mb-4 relative z-10 px-5 md:px-8 lg:px-10">
                    <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-7 w-[3px] bg-purple-500/80 group-hover/feature:bg-purple-400 transition-all duration-300 origin-center rounded-full" />
                    <span className="group-hover/feature:translate-x-1 transition duration-300 inline-block text-white font-space tracking-tight leading-relaxed">
                {feature.title}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm md:text-base lg:text-lg text-white/95 max-w-sm md:max-w-md relative z-10 px-5 md:px-8 lg:px-10 font-normal leading-relaxed">
                {feature.description}
              </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Tip box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-white/12 rounded-xl p-4 mb-8 mt-0"
      >
        <p className="text-white/80 text-center font-medium">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-semibold">Pro tip:</span>{' '}
          {role === 'manager'
            ? 'Invite your team first, then upload your training materials for a personalized experience.'
            : 'Start with the easier AI personas and work your way up to the challenging ones.'}
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-between items-center"
      >
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 px-6 bg-white/[0.06] border-2 border-white/12 text-white hover:bg-white/[0.08] hover:border-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onContinue}
          className="h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium transition-all rounded-xl"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}

