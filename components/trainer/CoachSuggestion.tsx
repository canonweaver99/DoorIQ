'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface CoachSuggestionProps {
  suggestion: {
    suggestedLine: string
    explanation?: string
    reasoning?: string
    confidence?: 'high' | 'medium' | 'low'
    tacticalNote?: string
    alternatives?: string[]
    isAdapted?: boolean
  } | null
  isLoading?: boolean
}

export function CoachSuggestion({ suggestion, isLoading }: CoachSuggestionProps) {
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile()

  const handleCopy = async () => {
    if (!suggestion?.suggestedLine) return

    try {
      await navigator.clipboard.writeText(suggestion.suggestedLine)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-orange-400'
      default:
        return 'text-white/60'
    }
  }

  if (!suggestion && !isLoading) {
    return null
  }

  return (
    <AnimatePresence>
      {(suggestion || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative bg-gradient-to-br from-purple-900/40 to-blue-900/40",
            "border-2 border-purple-500/60 rounded-xl p-4 shadow-lg",
            "backdrop-blur-sm",
            isMobile ? "mx-4 mb-4" : "mb-6"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white text-sm md:text-base">
                Coach Suggestion
              </h3>
              {suggestion?.confidence && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full bg-white/10",
                  getConfidenceColor(suggestion.confidence)
                )}>
                  {suggestion.confidence}
                </span>
              )}
            </div>
            {suggestion && (
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/70" />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
            </div>
          ) : suggestion ? (
            <div className="space-y-3">
              {/* Suggested Line */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-start gap-2">
                  <p className="text-white text-sm md:text-base leading-relaxed flex-1">
                    {suggestion.suggestedLine}
                  </p>
                  {suggestion.isAdapted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                      Adapted
                    </span>
                  )}
                </div>
              </div>

              {/* Reasoning or Explanation (if available) */}
              {(suggestion.reasoning || suggestion.explanation) && (
                <details className="group">
                  <summary className="cursor-pointer text-white/60 text-xs md:text-sm hover:text-white/80 transition-colors">
                    Why this suggestion?
                  </summary>
                  <p className="mt-2 text-white/70 text-xs md:text-sm leading-relaxed pl-4 border-l-2 border-purple-500/30">
                    {suggestion.reasoning || suggestion.explanation}
                  </p>
                </details>
              )}

              {/* Tactical Note (if available) */}
              {suggestion.tacticalNote && (
                <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    💡 <strong>Tip:</strong> {suggestion.tacticalNote}
                  </p>
                </div>
              )}

              {/* Alternatives (if available) */}
              {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-white/60 text-xs md:text-sm hover:text-white/80 transition-colors">
                    Other options ({suggestion.alternatives.length})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4 border-l-2 border-purple-500/30">
                    {suggestion.alternatives.map((alt, idx) => (
                      <li key={idx} className="text-white/70 text-xs leading-relaxed">
                        • {alt}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
