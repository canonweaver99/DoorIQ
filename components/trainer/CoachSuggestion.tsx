'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface CoachSuggestionProps {
  suggestion: {
    suggestedLine: string
  } | null
  isLoading?: boolean
  showPlaceholder?: boolean // If true, show placeholder even when no suggestion
  sessionActive?: boolean // Whether a session is currently active
}

export function CoachSuggestion({ suggestion, isLoading, showPlaceholder = false, sessionActive = false }: CoachSuggestionProps) {

  // Show pre-session card when not active and placeholder is requested
  if (!sessionActive && showPlaceholder && !suggestion && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full flex flex-col justify-center p-6 md:p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-white font-space">
            Live Coaching
          </h3>
        </div>

        {/* Description */}
        <div className="space-y-4 max-w-2xl mx-auto text-center">
          <p className="text-slate-300 text-base md:text-lg leading-relaxed font-space">
            Get real-time AI-powered coaching suggestions during your practice session. 
            The coach will analyze your conversation and provide tactical advice to help 
            you improve your sales skills.
          </p>
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-space">
              Start a practice session to see live coaching suggestions appear here.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!suggestion && !isLoading && !showPlaceholder) {
    return null
  }

  return (
    <AnimatePresence>
      {(suggestion || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col justify-center p-6"
        >
          {/* Compact header */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
              Live Coaching
            </span>
          </div>

          {/* Large suggestion text - uses full space with typing effect */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 bg-white/10 rounded animate-pulse" />
              <div className="h-6 bg-white/10 rounded animate-pulse w-5/6 mx-auto" />
              <div className="h-6 bg-white/10 rounded animate-pulse w-4/6 mx-auto" />
            </div>
          ) : suggestion ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white text-lg md:text-xl lg:text-2xl leading-relaxed text-center font-medium max-w-4xl">
                {suggestion.suggestedLine}
              </p>
            </div>
          ) : showPlaceholder ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 text-base md:text-lg leading-relaxed text-center font-medium max-w-4xl">
                Waiting for coaching suggestions...
              </p>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
