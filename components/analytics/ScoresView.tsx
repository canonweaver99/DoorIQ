'use client'

import { TrendingUp, Users, Target, Shield, HandshakeIcon, DollarSign, ChevronDown } from 'lucide-react'

interface ScoresViewProps {
  overallScore: number
  scores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    safety: number
    introduction: number
    listening: number
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    specific_tips: string[]
  }
  virtualEarnings: number
  insightsByCategory?: Record<string, Array<{ quote: string; impact: string }>>
}

export default function ScoresView({ overallScore, scores, feedback, virtualEarnings, insightsByCategory = {} }: ScoresViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10'
    if (score >= 60) return 'bg-amber-500/10'
    return 'bg-red-500/10'
  }

  const getGradeLetter = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D'
    return 'F'
  }

  const mainMetrics = [
    {
      id: 'rapport',
      name: 'Rapport Building',
      score: scores.rapport,
      icon: Users,
    },
    {
      id: 'discovery',
      name: 'Discovery',
      score: scores.discovery,
      icon: Target,
    },
    {
      id: 'objection_handling',
      name: 'Objection Handling',
      score: scores.objection_handling,
      icon: Shield,
    },
    {
      id: 'closing',
      name: 'Closing Technique',
      score: scores.closing,
      icon: HandshakeIcon,
    }
  ]

  // Calculate percentage of circle to fill
  const circumference = 2 * Math.PI * 70 // radius of 70
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  return (
    <div className="p-8">
      {/* Overall Score Section */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          {/* Score Circle */}
          <div className="flex-shrink-0">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-bold ${getScoreTextColor(overallScore)}`}>
                  {overallScore}
                </div>
                <div className="text-gray-500 text-sm mt-1">out of 100</div>
                <div className={`text-lg font-semibold mt-2 ${getScoreTextColor(overallScore)}`}>
                  {getGradeLetter(overallScore)}
                </div>
              </div>
            </div>
          </div>

          {/* Score Summary */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-white mb-4">Performance Summary</h2>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-2xl">
              {overallScore >= 80 
                ? `Excellent performance! You demonstrated strong sales skills throughout the conversation. ${feedback.strengths[0] || 'Your approach was professional and effective.'}`
                : overallScore >= 60
                ? `Good effort with room for improvement. You showed competence in several areas. ${feedback.improvements[0] ? `Focus on ${feedback.improvements[0].toLowerCase()}` : 'Keep practicing to refine your technique.'}`
                : `This conversation highlighted several areas for development. ${feedback.improvements[0] || 'Focus on building stronger foundations in each stage of the sales process.'}`
              }
            </p>
            
            {/* Virtual Earnings */}
            {virtualEarnings > 0 && (
              <div className="inline-flex items-center px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-500 font-semibold">${virtualEarnings.toFixed(2)} earned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {mainMetrics.map((metric) => {
          const Icon = metric.icon
          const quotes = insightsByCategory?.[metric.id] || []
          return (
            <div key={metric.id} className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-800 rounded-lg mr-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-white font-medium">{metric.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreTextColor(metric.score)}`}>
                      {metric.score}%
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${metric.score}%`,
                      backgroundColor: getScoreColor(metric.score)
                    }}
                  />
                </div>

                {/* Expandable Quotes */}
                {quotes.length > 0 && (
                  <details className="mt-4 group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                      <span>View transcript insights ({quotes.length})</span>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-4 space-y-3">
                      {quotes.map((item, idx) => (
                        <div key={idx} className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-300 italic">"{item.quote}"</p>
                          <p className="text-xs text-gray-500 mt-2">{item.impact}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback Section */}
      <div className="space-y-6">
        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              What You Did Well
            </h3>
            <ul className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-green-500 mr-3 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.improvements.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-amber-500 mr-3 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Tips */}
        {feedback.specific_tips.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Pro Tips
            </h3>
            <ul className="space-y-3">
              {feedback.specific_tips.map((tip, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-blue-500 mr-3 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}