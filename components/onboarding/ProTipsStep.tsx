'use client'

import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Rocket,
  Target,
  Clock,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProTipsStepProps {
  role: 'manager' | 'rep'
  onComplete: () => void
  onBack: () => void
  loading?: boolean
}

const repTips = [
  {
    icon: Clock,
    title: 'Practice Daily',
    description:
      'Even 15 minutes a day compounds. Top performers practice 3-5 times per week.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Target,
    title: 'Focus on Objections',
    description:
      'Master the tough personas. If you can handle "Skeptical Steve", real doors are easy.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Review Your Analytics',
    description:
      'After each session, check your transcript. Small tweaks lead to big results.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Start Fast',
    description:
      'Your first 10 seconds matter most. Practice your opener until it\'s natural.',
    color: 'from-amber-500 to-orange-500',
  },
]

const managerTips = [
  {
    icon: Users,
    title: 'Set Practice Goals',
    description:
      'Encourage reps to complete at least 3 sessions per week. Consistency beats intensity.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Target,
    title: 'Customize Grading',
    description:
      'Upload your company scripts and set grading criteria that match your sales process.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Review Session Recordings',
    description:
      'Listen to your reps\' sessions. Provide personalized coaching based on real data.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Use Leaderboards',
    description:
      'Gamification drives engagement. Top sales teams see 40% more practice when competing.',
    color: 'from-amber-500 to-orange-500',
  },
]

export function ProTipsStep({ role, onComplete, onBack, loading }: ProTipsStepProps) {
  const tips = role === 'manager' ? managerTips : repTips

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="font-space text-3xl md:text-4xl font-bold text-white mb-4">
          Pro Tips for Success
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          {role === 'manager'
            ? 'Best practices from teams that have ramped reps 3x faster.'
            : 'Secrets from top performers who\'ve mastered the art of the pitch.'}
        </p>
      </div>

      {/* Tips grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {tips.map((tip, index) => {
          const Icon = tip.icon
          return (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  'bg-gradient-to-br',
                  tip.color
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-space text-lg font-semibold text-white mb-2">
                {tip.title}
              </h3>
              <p className="text-white/60 text-sm">{tip.description}</p>
            </div>
          )
        })}
      </div>

      {/* Success message */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-space text-xl font-bold text-white mb-2">
              You're All Set!
            </h3>
            <p className="text-white/70">
              {role === 'manager'
                ? 'Your team is ready to start practicing. Head to your dashboard to track their progress and manage your organization.'
                : 'You\'re ready to start practicing. Head to the home page to begin your first session with an AI homeowner.'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-12 px-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onComplete}
          disabled={loading}
          className="h-14 px-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Finishing...
            </span>
          ) : (
            <>
              Go to Home
              <Rocket className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

