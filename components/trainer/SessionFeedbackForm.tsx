'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, Loader2 } from 'lucide-react'

interface SessionFeedbackFormProps {
  sessionId: string
  onFeedbackComplete: () => void
}

const IMPROVEMENT_OPTIONS = [
  'Rapport building',
  'Discovery questions',
  'Objection handling',
  'Closing techniques',
  'Overall confidence',
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
    
    // Validation
    if (!rating) {
      setError('Please provide a rating')
      return
    }
    if (!improvementArea) {
      setError('Please select an area you would like to improve')
      return
    }
    if (!feedbackText.trim()) {
      setError('Please provide feedback text')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/session/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating,
          improvementArea,
          feedbackText: feedbackText.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      // Success - proceed to analytics page
      onFeedbackComplete()
    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl w-full mx-auto"
    >
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-2 font-space">
            How did your session go?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Your feedback helps us improve your training experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-4 font-space">
              Rate your session experience (1-10)
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold text-sm sm:text-base transition-all
                    ${rating === num
                      ? 'bg-purple-500 text-white scale-110 shadow-lg shadow-purple-500/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
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

          {/* Improvement Area Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-4 font-space">
              What would you like to be improved?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {IMPROVEMENT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setImprovementArea(option)}
                  className={`
                    px-4 py-3 rounded-lg text-left transition-all border
                    ${improvementArea === option
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
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
            <label htmlFor="feedback-text" className="block text-sm font-semibold text-slate-300 mb-3 font-space">
              Additional feedback
            </label>
            <textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us more about your session experience..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-sans"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !rating || !improvementArea || !feedbackText.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-space"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Continue to Results</span>
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

