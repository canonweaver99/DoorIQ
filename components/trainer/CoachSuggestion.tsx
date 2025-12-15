'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface CoachSuggestionProps {
  suggestion: {
    suggestedLine: string
  } | null
  isLoading?: boolean
}

export function CoachSuggestion({ suggestion, isLoading }: CoachSuggestionProps) {
  if (!suggestion && !isLoading) {
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

          {/* Large suggestion text - uses full space */}
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
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
