'use client'

import { motion } from 'framer-motion'
import { Mic, MessageCircle, Target, BarChart3, TrendingUp, AlertTriangle, CheckCircle, XCircle, BookOpen, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SessionPerformance } from '@/app/dashboard/types'

interface PerformanceMetricCardsProps {
  session: SessionPerformance | null
}

export default function PerformanceMetricCards({ session }: PerformanceMetricCardsProps) {
  const router = useRouter()
  
  if (!session) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 animate-pulse"
          >
            <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
            <div className="h-12 bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-6 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  const { voice, conversation, closing, overall } = session

  const getStatusBadge = (score: number) => {
    if (score >= 80) {
      return {
        text: 'Strong',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-[#059669] to-[#065f46]',
        borderColor: 'border-[#10b981]',
        glow: false
      }
    } else if (score >= 60) {
      return {
        text: 'Needs work',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-[#d97706] to-[#92400e]',
        borderColor: 'border-[#f59e0b]',
        glow: false
      }
    } else {
      return {
        text: 'Critical',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-[#dc2626] to-[#991b1b]',
        borderColor: 'border-[#ef4444]',
        glow: true
      }
    }
  }

  const cards = [
    {
      id: 'overall',
      title: 'Overall',
      icon: BarChart3,
      status: getStatusBadge(overall.averageScore),
      delay: 0.1,
      data: overall
    },
    {
      id: 'voice',
      title: 'Voice',
      icon: Mic,
      status: getStatusBadge(voice.averageScore),
      delay: 0.2,
      data: voice
    },
    {
      id: 'conversation',
      title: 'Conversation',
      icon: MessageCircle,
      status: getStatusBadge(conversation.averageScore),
      delay: 0.3,
      data: conversation
    },
    {
      id: 'closing',
      title: 'Closing',
      icon: Target,
      status: getStatusBadge(closing.averageScore),
      delay: 0.4,
      data: closing
    }
  ]

  const renderCardContent = (card: typeof cards[0]) => {
    switch (card.id) {
      case 'voice':
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Confidence</span>
                  <span className="font-space text-white font-bold text-lg md:text-xl">{voice.confidence}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${voice.confidence}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {voice.confidence >= 80 ? 'Excellent confidence level' : 
                   voice.confidence >= 60 ? 'Good confidence, room for improvement' : 
                   'Low confidence - focus on reducing filler words'}
                </p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Energy</span>
                  <span className="font-space text-white font-bold text-lg md:text-xl">{voice.energy}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${voice.energy}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {voice.energy >= 80 ? 'High energy, engaging delivery' : 
                   voice.energy >= 60 ? 'Moderate energy - vary your pace' : 
                   'Low energy - increase enthusiasm and volume'}
                </p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Clarity</span>
                  <span className="font-space text-white font-bold text-lg md:text-xl">{voice.clarity}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${voice.clarity}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {voice.clarity >= 80 ? 'Clear and articulate speech' : 
                   voice.clarity >= 60 ? 'Generally clear, watch pronunciation' : 
                   'Unclear speech - slow down and enunciate'}
                </p>
              </div>
            </div>
            {/* Tips and Filler Words - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Tips */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-3">Voice Quality Tips</h4>
                <ul className="space-y-2 font-space text-base md:text-lg text-white/80 font-bold">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Speak at 140-160 words per minute for optimal clarity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Reduce filler words like "um" and "uh" to boost confidence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Vary your pitch and volume to maintain energy</span>
                  </li>
                </ul>
              </div>
              {/* Most Common Filler Words */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-3">Most Common Filler Words</h4>
                <div className="space-y-3 font-space text-base md:text-lg text-white/80 font-bold">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span>"um"</span>
                    </span>
                    <span className="text-white font-bold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      <span>"uh"</span>
                    </span>
                    <span className="text-white font-bold">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      <span>"like"</span>
                    </span>
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      <span>"you know"</span>
                    </span>
                    <span className="text-white font-bold">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'conversation':
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Talk Ratio</span>
                  <span className="font-space text-white font-bold text-lg md:text-xl">{conversation.talkRatio}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${conversation.talkRatio}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {conversation.talkRatio >= 50 && conversation.talkRatio <= 70 ? 
                   'Ideal balance - good listening' : 
                   conversation.talkRatio < 50 ? 
                   'Too quiet - speak more and engage' : 
                   'Too talkative - let the customer speak more'}
                </p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Speaking Pace</span>
                  <span className="font-space text-white font-bold text-lg md:text-xl">{conversation.pace} WPM</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      conversation.pace >= 140 && conversation.pace <= 160 ? 'bg-green-500' :
                      conversation.pace > 160 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, (conversation.pace / 200) * 100)}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {conversation.pace >= 140 && conversation.pace <= 160 ? 
                   'Perfect pace - easy to follow' : 
                   conversation.pace > 160 ? 
                   'Too fast - slow down for clarity' : 
                   'Too slow - pick up the pace'}
                </p>
              </div>
            </div>
            {/* Warning */}
            {conversation.warning && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-space text-yellow-400 text-base md:text-lg font-bold mb-1">Pace Warning</h4>
                    <p className="font-space text-white/80 text-base md:text-lg font-bold">
                      Your speaking pace of {conversation.pace} WPM is above the recommended range. 
                      Slow down to 140-160 WPM for better clarity and customer understanding.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Tips and Lesson Card - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-3">Conversation Balance Tips</h4>
                <ul className="space-y-2 font-space text-base md:text-lg text-white/80 font-bold">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Aim for 50-70% talk ratio - balance speaking with listening</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Ask open-ended questions to encourage customer participation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Pause after asking questions to give customers time to respond</span>
                  </li>
                </ul>
              </div>
              {/* Lesson Card */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-space text-white text-base md:text-lg font-bold">Master Conversation</h4>
                  </div>
                  <p className="font-space text-white/80 text-sm md:text-base font-bold mb-4">
                    Learn to balance speaking and listening, ask better questions, and improve your conversation flow.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/learning?focus=conversation')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-space font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-white/95 transition-all"
                >
                  Start Lesson
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        )
      
      case 'closing':
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Success Rate</span>
                  <span className="font-space text-white font-bold text-3xl md:text-4xl">{closing.success}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      closing.success > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${closing.success}%` }}
                  />
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {closing.success > 0 ? 
                   'Great job closing the deal!' : 
                   'No close attempted - always ask for the sale'}
                </p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Close Attempts</span>
                  <span className="font-space text-white font-bold text-3xl md:text-4xl">{closing.attempts}</span>
                </div>
                <div className="mt-2">
                  {closing.status === 'MISSED' ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">No close attempted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Close successful</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Critical Warning */}
            {closing.status === 'MISSED' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-space text-red-400 text-base md:text-lg font-bold mb-1">Critical: No Close Attempt</h4>
                    <p className="font-space text-white/80 text-base md:text-lg font-bold mb-3">
                      You didn't attempt to close the sale. Always ask for the close, even if you expect objections.
                    </p>
                    <ul className="space-y-1 font-space text-base md:text-lg text-white/80 font-bold">
                      <li>• Use assumptive language: "When would you like to schedule?"</li>
                      <li>• Ask directly: "Are you ready to move forward?"</li>
                      <li>• Create urgency: "This offer expires at the end of the week"</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* Tips and Lesson Card - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-3">Closing Techniques</h4>
                <ul className="space-y-2 font-space text-base md:text-lg text-white/80 font-bold">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Use assumptive language: "When would you like to schedule?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Ask for the close multiple times throughout the conversation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Address objections, then immediately ask for the close again</span>
                  </li>
                </ul>
              </div>
              {/* Lesson Card */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-space text-white text-base md:text-lg font-bold">Master Closing</h4>
                  </div>
                  <p className="font-space text-white/80 text-sm md:text-base font-bold mb-4">
                    Learn proven closing techniques and practice with real scenarios to improve your success rate.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/learning?focus=closing')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-space font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-white/95 transition-all"
                >
                  Start Lesson
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        )
      
      case 'overall':
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Overall Score</span>
                  <span className="font-space text-white font-bold text-2xl md:text-3xl">{overall.score}/100</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      overall.score >= 80 ? 'bg-green-500' :
                      overall.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${overall.score}%` }}
                  />
                </div>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Grade</span>
                  <span className={`font-space text-4xl md:text-5xl font-bold ${overall.grade.color}`}>
                    {overall.grade.letter}
                  </span>
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  {overall.grade.letter === 'A' ? 'Excellent performance' :
                   overall.grade.letter === 'B' ? 'Good work, keep improving' :
                   overall.grade.letter === 'C' ? 'Average - focus on key areas' :
                   overall.grade.letter === 'D' ? 'Needs significant improvement' :
                   'Critical - review all fundamentals'}
                </p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-white/80 text-base md:text-lg font-bold">Percentile</span>
                  <span className="font-space text-white font-bold text-2xl md:text-3xl">{overall.percentile}</span>
                </div>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mt-2">
                  Your performance compared to other users
                </p>
              </div>
            </div>
            {/* Score Breakdown and Improvement Areas - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Score Breakdown */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-4">Score Breakdown</h4>
                <div className="space-y-4 md:space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="font-space text-white/80 text-lg md:text-xl font-bold">Voice Quality</span>
                    <span className="font-space text-white font-bold text-xl md:text-2xl">{voice.averageScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-space text-white/80 text-lg md:text-xl font-bold">Conversation Skills</span>
                    <span className="font-space text-white font-bold text-xl md:text-2xl">{conversation.averageScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-space text-white/80 text-lg md:text-xl font-bold">Closing Ability</span>
                    <span className="font-space text-white font-bold text-xl md:text-2xl">{closing.averageScore}%</span>
                  </div>
                </div>
              </div>
              {/* Improvement Areas */}
              <div className="bg-white/[0.05] border border-white/10 rounded-lg p-4">
                <h4 className="font-space text-white text-base md:text-lg font-bold mb-3">Improvement Areas</h4>
                <ul className="space-y-2 font-space text-base md:text-lg text-white/80 font-bold">
                  {voice.averageScore < 80 && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Focus on voice quality - reduce filler words and improve clarity</span>
                    </li>
                  )}
                  {conversation.averageScore < 80 && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Improve conversation balance - adjust talk ratio and speaking pace</span>
                    </li>
                  )}
                  {closing.averageScore < 80 && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Practice closing techniques - always ask for the sale</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:gap-8">
      {cards.map((card) => {
        const Icon = card.icon
        const isCritical = card.status.glow
        const isNeedsWork = card.status.text === 'Needs work'
        const isStrong = card.status.text === 'Strong'
        
        // Determine border color based on card type
        const getBorderColor = () => {
          if (card.id === 'overall') return 'border-green-500/50'
          if (card.id === 'voice') return 'border-blue-500/50'
          if (card.id === 'conversation') return 'border-white/30'
          if (card.id === 'closing') return 'border-red-500/50'
          return 'border-white/5'
        }
        
        // Determine background color based on card type (subtle match to border)
        const getBackgroundColor = () => {
          if (card.id === 'overall') return 'bg-green-500/5'
          if (card.id === 'voice') return 'bg-blue-500/5'
          if (card.id === 'conversation') return 'bg-white/5'
          if (card.id === 'closing') return 'bg-red-500/5'
          return 'bg-white/[0.02]'
        }
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: card.delay }}
            className={`relative rounded-lg p-2.5 sm:p-4 md:p-6 lg:p-8 overflow-hidden border-2 ${getBorderColor()} ${getBackgroundColor()}`}
          >
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-white">
                    <Icon className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="font-space text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white">{card.title}</h3>
                </div>
                {/* Enhanced Status Badge */}
                <div className={`inline-flex items-center gap-0.5 sm:gap-2 px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-lg border-2 ${card.status.borderColor} ${card.status.bgColor}`}
                >
                  <span className={`text-[9px] sm:text-xs font-space font-bold ${card.status.color}`}>
                    {card.status.text.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {renderCardContent(card)}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
