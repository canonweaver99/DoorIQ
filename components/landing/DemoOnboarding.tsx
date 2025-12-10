'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface DemoOnboardingProps {
  onSkip: () => void
  onStart: () => void
}

export function DemoOnboarding({ onSkip, onStart }: DemoOnboardingProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleSkip = () => {
    setIsVisible(false)
    setTimeout(() => onSkip(), 300)
  }

  const handleStart = () => {
    setIsVisible(false)
    setTimeout(() => onStart(), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-space">
                Try Instant Demo
              </h2>
              <p className="text-slate-400 text-sm font-sans">
                Practice with Average Austin in 30 seconds
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-medium font-sans">Real AI Conversation</p>
                  <p className="text-slate-400 text-sm font-sans">Practice with hyper-realistic AI homeowner</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-medium font-sans">2-3 Minute Session</p>
                  <p className="text-slate-400 text-sm font-sans">Quick practice to see how it works</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-medium font-sans">Instant Feedback</p>
                  <p className="text-slate-400 text-sm font-sans">See your score and virtual earnings</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2.5 text-slate-400 hover:text-white transition-colors font-medium font-sans"
              >
                Skip
              </button>
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 font-sans"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
