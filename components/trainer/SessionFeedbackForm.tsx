'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, Loader2 } from 'lucide-react'

interface SessionFeedbackFormProps {
  sessionId: string
  onFeedbackComplete: () => void
}

const SESSION_DESCRIPTION_OPTIONS = [
  'Great! I closed the deal',
  'Good session, but didn\'t close',
  'Challenging but learned a lot',
  'Too easy, need more challenge',
  'Agent was unrealistic',
  'Other'
]

export default function SessionFeedbackForm({ sessionId, onFeedbackComplete }: SessionFeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [improvementArea, setImprovementArea] = useState<string>('')
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // All fields are now optional - no validation required
    setIsSubmitting(true)
    setError(null)

    try {
      // Only submit if there's at least one field filled
      if (rating || improvementArea || feedbackText.trim()) {
        const response = await fetch('/api/session/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            rating: rating || null,
            improvementArea: improvementArea || null,
            feedbackText: feedbackText.trim() || null
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to submit feedback')
        }
      }

      // Success - proceed to analytics page (even if skipped)
      onFeedbackComplete()
    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    // Skip feedback and go directly to analytics
    onFeedbackComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl w-full mx-auto"
    >
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-700 shadow-2xl w-full max-w-full">
        <div className="text-center mb-4 sm:mb-6 lg:mb-7">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-2 font-space leading-tight px-2">
            How did your session go?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed px-2">
            Your feedback helps us improve the AI agent and your training experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-7">
          {/* Rating Section */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-3 sm:mb-4 font-space">
              Rate your session experience (1-10)
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-3 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`
                    w-11 h-11 sm:w-12 sm:h-12 lg:w-11 lg:h-11 rounded-lg font-semibold text-sm sm:text-base transition-all touch-manipulation active:scale-95
                    ${rating === num
                      ? 'bg-purple-500 text-white scale-110 shadow-lg shadow-purple-500/50'
                      : 'bg-slate-800 text-slate-300 active:bg-slate-700 border border-slate-600'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            {rating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-center"
              >
                <div className="inline-flex items-center gap-1 text-purple-400">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Session Description Section */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-3 sm:mb-4 font-space">
              Which best describes how your session went?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {SESSION_DESCRIPTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setImprovementArea(option)}
                  className={`
                    px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-left transition-all border text-xs sm:text-sm min-h-[44px] touch-manipulation active:scale-[0.98] leading-relaxed
                    ${improvementArea === option
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 active:bg-slate-750 active:border-slate-600'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Text Feedback Section */}
          <div>
            <label htmlFor="feedback-text" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2 sm:mb-3 font-space">
              Additional feedback <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us more about your session experience and how the AI agent performed... (optional)"
              rows={5}
              className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-sans text-sm sm:text-base leading-relaxed"
              style={{ 
                minHeight: '120px',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {/* Submit and Skip Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-800 border border-slate-600 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-space text-sm sm:text-base min-h-[48px] sm:min-h-[52px] touch-manipulation active:scale-[0.98]"
            >
              Skip Feedback
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg active:from-purple-600 active:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-space text-sm sm:text-base min-h-[48px] sm:min-h-[52px] touch-manipulation active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit & Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

