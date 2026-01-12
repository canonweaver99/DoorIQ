'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  ArrowRight,
  ArrowLeft,
  Mic,
  Play,
  MessageSquare,
  BarChart3,
  Lightbulb,
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 md:mb-16"
      >
        {/* Austin's Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto mb-8 flex justify-center"
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl">
            <Image
              src="/Austin Boss.png"
              alt="Average Austin"
              width={160}
              height={160}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-2xl -z-10"></div>
        </motion.div>

        <h1 className="font-space text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Your First <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Practice Session</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
          {role === 'manager'
            ? "Here's how your reps will practice their pitch with DoorIQ."
            : "Here's how to get started with AI-powered practice."}
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-6 mb-12">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Step number and icon */}
                <div className="flex items-start gap-4 flex-shrink-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-lg">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-space text-xl md:text-2xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/80 text-base md:text-lg mb-4 leading-relaxed">{step.description}</p>
                  <div className="flex items-start gap-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-xl p-4">
                    <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/90 text-sm md:text-base font-medium">
                      {step.tip}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick start box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-6 md:p-8 mb-8"
      >
        <div className="flex items-start gap-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Play className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-space text-xl md:text-2xl font-semibold text-white mb-2">
              Ready to try it?
            </h3>
            <p className="text-white/80 text-base md:text-lg leading-relaxed">
              After completing this setup, you'll be able to start your first
              practice session right away. Most reps see improvement after just
              3-5 sessions!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
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
          Start Your First Session
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}

