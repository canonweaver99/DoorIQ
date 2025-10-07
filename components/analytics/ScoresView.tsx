'use client'

import { Star, TrendingUp, Users, Target, Shield, HandshakeIcon, DollarSign } from 'lucide-react'

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
}

export default function ScoresView({ overallScore, scores, feedback, virtualEarnings }: ScoresViewProps) {
  const getStarRating = (score: number) => {
    if (score >= 90) return 5
    if (score >= 80) return 4
    if (score >= 70) return 3
    if (score >= 60) return 2
    return 1
  }

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
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

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const starRating = getStarRating(overallScore)

  const mainMetrics = [
    {
      name: 'Rapport Building',
      score: scores.rapport,
      icon: Users,
      description: 'Building trust and connection with the homeowner'
    },
    {
      name: 'Discovery',
      score: scores.discovery,
      icon: Target,
      description: 'Understanding customer needs and pain points'
    },
    {
      name: 'Objection Handling',
      score: scores.objection_handling,
      icon: Shield,
      description: 'Addressing concerns and overcoming resistance'
    },
    {
      name: 'Closing Technique',
      score: scores.closing,
      icon: HandshakeIcon,
      description: 'Effectively asking for the sale and securing commitment'
    }
  ]

  // Generate AI overview based on scores and feedback
  const generateAIOverview = () => {
    const avgScore = overallScore
    let overview = ''
    
    if (avgScore >= 80) {
      overview = `Excellent performance! You demonstrated strong sales skills throughout the conversation. ${feedback.strengths[0] || 'Your approach was professional and effective.'}${scores.closing >= 80 ? ' Your closing technique was particularly impressive.' : ''}`
    } else if (avgScore >= 60) {
      overview = `Good effort with room for improvement. You showed competence in several areas, particularly ${scores.rapport >= scores.discovery ? 'building rapport' : 'discovery'}.${feedback.improvements[0] ? ` Focus on ${feedback.improvements[0].toLowerCase()}` : ' Keep practicing to refine your technique.'}`
    } else {
      overview = `This conversation highlighted several areas for development. While challenging, each interaction is a learning opportunity. ${feedback.improvements[0] || 'Focus on building stronger foundations in each stage of the sales process.'}`
    }
    
    return overview
  }

  return (
    <div className="p-8">
      {/* Overall Score Section */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-slate-200 mb-8">Overall Performance</h2>
        
        <div className="relative inline-block mb-6">
          {/* Score Circle */}
          <div className="w-48 h-48 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-slate-400 text-sm mt-1">out of 100</div>
            </div>
          </div>
          
          {/* Grade Letter Badge */}
          <div className="absolute -top-2 -right-2 w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center shadow-lg border-2 border-slate-600">
            <span className="text-white font-bold text-lg">{getGradeLetter(overallScore)}</span>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center mb-6 space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${
                i < starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`}
            />
          ))}
        </div>

        {/* AI Overview */}
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-300 leading-relaxed">
            {generateAIOverview()}
          </p>
        </div>

        {/* Virtual Earnings */}
        {virtualEarnings > 0 && (
          <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-400 mr-2" />
            <span className="text-emerald-400 font-semibold">${virtualEarnings.toFixed(2)} earned</span>
          </div>
        )}
      </div>

      {/* Main Metrics - Horizontal Progress Bars */}
      <div className="space-y-6 mb-12 max-w-4xl mx-auto">
        {mainMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.name} className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <h3 className="text-white font-medium">{metric.name}</h3>
                </div>
                <span className={`text-2xl font-bold ${getGradeColor(metric.score)}`}>
                  {metric.score}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(metric.score)}`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-2">{metric.description}</p>
            </div>
          )
        })}
      </div>

      {/* Feedback Section */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">What You Did Well</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-emerald-400 mr-2 mt-0.5">✓</span>
                  <span className="text-slate-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.improvements.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-400 mr-2 mt-0.5">→</span>
                  <span className="text-slate-300">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Tips */}
        {feedback.specific_tips.length > 0 && (
          <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Pro Tips</h3>
            <ul className="space-y-2">
              {feedback.specific_tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-slate-400 mr-2 mt-0.5">💡</span>
                  <span className="text-slate-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}