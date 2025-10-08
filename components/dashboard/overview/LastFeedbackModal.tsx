'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Award, TrendingUp, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LastFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

interface SessionFeedback {
  id: number
  homeowner: string
  score: number
  feedback: string
  created_at: string
  scores: {
    rapport: number
    discovery: number
    objectionHandling: number
    closing: number
  }
}

export default function LastFeedbackModal({ isOpen, onClose, userId }: LastFeedbackModalProps) {
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && userId) {
      fetchLastFeedback()
    }
  }, [isOpen, userId])

  const fetchLastFeedback = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data && !error) {
      setFeedback({
        id: data.id,
        homeowner: data.homeowner_name || 'Unknown',
        score: data.overall_score || 0,
        feedback: data.feedback || 'No feedback available',
        created_at: data.created_at,
        scores: {
          rapport: data.rapport_score || 0,
          discovery: data.discovery_score || 0,
          objectionHandling: data.objection_handling_score || 0,
          closing: data.closing_score || 0,
        }
      })
    }
    
    setLoading(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg">
                    <Award className="w-5 h-5 text-teal-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Last Session Feedback</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
                  </div>
                ) : feedback ? (
                  <div className="space-y-6">
                    {/* Session Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{feedback.homeowner}</h3>
                        <p className="text-sm text-slate-400">{formatDate(feedback.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
                          {feedback.score}
                        </div>
                        <p className="text-xs text-slate-400">Overall Score</p>
                      </div>
                    </div>

                    {/* Skill Scores */}
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(feedback.scores).map(([skill, score]) => (
                        <div key={skill} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400 capitalize">
                              {skill.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                              {score}
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-full rounded-full ${
                                score >= 80 ? 'bg-green-400' : 
                                score >= 60 ? 'bg-yellow-400' : 
                                'bg-red-400'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Feedback Text */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-white">Detailed Feedback</h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {feedback.feedback}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => window.location.href = `/analytics/${feedback.id}`}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg text-white font-medium transition-all"
                    >
                      View Full Analysis
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Sessions Yet</h3>
                    <p className="text-sm text-slate-400">
                      Complete your first training session to see feedback here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

