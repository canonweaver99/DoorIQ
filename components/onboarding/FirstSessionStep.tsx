'use client'

import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  ArrowLeft,
  Mic,
  Play,
  MessageSquare,
  BarChart3,
  Volume2,
} from 'lucide-react'

interface FirstSessionStepProps {
  role: 'manager' | 'rep'
  onContinue: () => void
  onBack: () => void
}

export function FirstSessionStep({ role, onContinue, onBack }: FirstSessionStepProps) {
  const steps = [
    {
      icon: Play,
      title: 'Choose Your AI Homeowner',
      description:
        'Pick from 14 unique personas, each with different personalities and objection styles.',
      tip: 'Start with "Average Austin" - he\'s friendly and great for warming up.',
    },
    {
      icon: Mic,
      title: 'Enable Your Microphone',
      description:
        'When prompted, allow microphone access. Speak naturally as if you\'re at a real door.',
      tip: 'Use headphones for the best audio experience.',
    },
    {
      icon: MessageSquare,
      title: 'Have a Conversation',
      description:
        'The AI will respond in real-time. Practice your opening, handle objections, and close.',
      tip: 'Try to set an appointment or get them interested in learning more.',
    },
    {
      icon: BarChart3,
      title: 'Get Instant Feedback',
      description:
        'After each session, see detailed analytics on your performance with AI-powered insights.',
      tip: 'Review the transcript to see exactly where you can improve.',
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <Volume2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-space text-3xl md:text-4xl font-bold text-white mb-4">
          Your First Practice Session
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          {role === 'manager'
            ? "Here's how your reps will practice their pitch with DoorIQ."
            : "Here's how to get started with AI-powered practice."}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-10">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex gap-4">
                {/* Step number */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-space text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{step.description}</p>
                  <p className="text-purple-400/80 text-sm italic">
                    💡 {step.tip}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick start box */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Play className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-space text-lg font-semibold text-white mb-1">
              Ready to try it?
            </h3>
            <p className="text-white/60 text-sm">
              After completing this setup, you'll be able to start your first
              practice session right away. Most reps see improvement after just
              3-5 sessions!
            </p>
          </div>
        </div>
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

