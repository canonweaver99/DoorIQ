'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, CheckCircle, MessageSquare, Calendar, FileText, Target } from 'lucide-react'

const POST_SALES_TIPS = [
  'Schedule follow-up within 24 hours - strike while the iron is hot',
  'Send a thank you text immediately after service completion',
  'Review your notes before the next appointment to personalize your approach',
  'Ask for referrals when customers are most satisfied - right after service',
  'Document objections and your responses for continuous improvement',
  'Set calendar reminders for seasonal follow-ups and upsells',
  'Take photos of problem areas before and after treatment for proof',
  'Follow up with a "how did we do?" call 48 hours after service',
  'Update your CRM with detailed notes about family situation and concerns',
  'Practice your pitch recap - what worked and what didn\'t?',
  'Prepare your next day\'s route and research each neighborhood',
  'Review competitor pricing and value propositions monthly',
  'Study your best closes and replicate the language that worked',
  'Build relationships with neighbors who see your truck regularly',
  'Track which objections are most common and develop better responses'
]

interface CalculatingScoreProps {
  sessionId: string
  onComplete: () => void
  className?: string
}

export default function CalculatingScore({ sessionId, onComplete, className = "" }: CalculatingScoreProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'analyzing' | 'grading' | 'finalizing'>('analyzing')

  useEffect(() => {
    // Rotate tips every 2.5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % POST_SALES_TIPS.length)
    }, 2500)

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2
        if (next >= 100) {
          clearInterval(progressInterval)
          setTimeout(onComplete, 500) // Small delay before redirect
          return 100
        }
        return next
      })
    }, 150) // Complete in ~7.5 seconds

    // Stage progression
    const stageTimer1 = setTimeout(() => setStage('grading'), 2500)
    const stageTimer2 = setTimeout(() => setStage('finalizing'), 5000)

    return () => {
      clearInterval(tipInterval)
      clearInterval(progressInterval)
      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
    }
  }, [onComplete])

  const getStageInfo = (stage: string) => {
    switch (stage) {
      case 'analyzing':
        return { text: 'Analyzing Transcript', icon: MessageSquare, color: 'text-blue-400' }
      case 'grading':
        return { text: 'Calculating Scores', icon: Calculator, color: 'text-yellow-400' }
      case 'finalizing':
        return { text: 'Generating Feedback', icon: CheckCircle, color: 'text-green-400' }
      default:
        return { text: 'Processing', icon: Calculator, color: 'text-blue-400' }
    }
  }

  const stageInfo = getStageInfo(stage)
  const StageIcon = stageInfo.icon

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center ${stageInfo.color}`}
            >
              <StageIcon className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {stageInfo.text}
            </h1>
            <p className="text-slate-300">
              Analyzing your conversation with Austin Rodriguez
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-mono text-slate-300">{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Post-Sales Tips */}
          <div className="bg-gradient-to-r from-slate-700/50 to-slate-700/30 rounded-lg p-6 mb-6 border border-slate-600/50 min-h-[180px] flex items-center justify-center">
            <div className="text-center max-w-2xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center justify-center">
                <Target className="w-5 h-5 mr-2 text-orange-400" />
                Post-Sales Mastery Tip
              </h2>
              
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-700 rounded-lg p-4 shadow-lg border border-slate-600"
              >
                <p className="text-lg text-slate-200 leading-relaxed">
                  {POST_SALES_TIPS[currentTipIndex]}
                </p>
              </motion.div>

              {/* Progress Dots */}
              <div className="flex justify-center mt-4 space-x-2">
                {POST_SALES_TIPS.slice(0, 5).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      index === currentTipIndex % 5 ? 'bg-orange-400' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div 
              className={`text-center p-4 rounded-lg border transition-all duration-500 ${
                stage === 'analyzing' ? 'bg-blue-900/30 border-blue-700/50' : 'bg-slate-700/30 border-slate-600/50'
              }`}
              animate={{ scale: stage === 'analyzing' ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: stage === 'analyzing' ? Infinity : 0 }}
            >
              <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${stage === 'analyzing' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className={`text-sm font-medium ${stage === 'analyzing' ? 'text-blue-300' : 'text-slate-400'}`}>
                Transcript Analysis
              </span>
            </motion.div>

            <motion.div 
              className={`text-center p-4 rounded-lg border transition-all duration-500 ${
                stage === 'grading' ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-slate-700/30 border-slate-600/50'
              }`}
              animate={{ scale: stage === 'grading' ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: stage === 'grading' ? Infinity : 0 }}
            >
              <Calculator className={`w-6 h-6 mx-auto mb-2 ${stage === 'grading' ? 'text-yellow-400' : 'text-slate-500'}`} />
              <span className={`text-sm font-medium ${stage === 'grading' ? 'text-yellow-300' : 'text-slate-400'}`}>
                Score Calculation
              </span>
            </motion.div>

            <motion.div 
              className={`text-center p-4 rounded-lg border transition-all duration-500 ${
                stage === 'finalizing' ? 'bg-green-900/30 border-green-700/50' : 'bg-slate-700/30 border-slate-600/50'
              }`}
              animate={{ scale: stage === 'finalizing' ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: stage === 'finalizing' ? Infinity : 0 }}
            >
              <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${stage === 'finalizing' ? 'text-green-400' : 'text-slate-500'}`} />
              <span className={`text-sm font-medium ${stage === 'finalizing' ? 'text-green-300' : 'text-slate-400'}`}>
                Finalizing Results
              </span>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">
              This usually takes 5-10 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
