'use client'

import { Star, TrendingUp, Users, Target, Shield, HandshakeIcon, Mic, DollarSign } from 'lucide-react'

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
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
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

  const starRating = getStarRating(overallScore)

  const mainMetrics = [
    {
      name: 'Rapport Building',
      score: scores.rapport,
      icon: Users,
      color: 'purple',
      description: 'Building trust and connection with the homeowner'
    },
    {
      name: 'Discovery',
      score: scores.discovery,
      icon: Target,
      color: 'blue',
      description: 'Understanding customer needs and pain points'
    },
    {
      name: 'Objection Handling',
      score: scores.objection_handling,
      icon: Shield,
      color: 'orange',
      description: 'Addressing concerns and overcoming resistance'
    },
    {
      name: 'Closing Technique',
      score: scores.closing,
      icon: HandshakeIcon,
      color: 'green',
      description: 'Effectively asking for the sale and securing commitment'
    }
  ]

  return (
    <div className="p-6">
      {/* Overall Score Section */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-white mb-8">Overall Performance</h2>
        
        <div className="relative inline-block">
          {/* Score Circle */}
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center shadow-2xl border-4 border-purple-500/30">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-slate-400 text-sm mt-1">out of 100</div>
            </div>
          </div>
          
          {/* Grade Letter */}
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">{getGradeLetter(overallScore)}</span>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center mt-6 space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-8 h-8 ${
                i < starRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Virtual Earnings */}
        {virtualEarnings > 0 && (
          <div className="mt-6 inline-flex items-center px-6 py-3 bg-green-500/20 rounded-full border border-green-500/30">
            <DollarSign className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">${virtualEarnings.toFixed(2)} earned!</span>
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {mainMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.name} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 text-${metric.color}-400`} />
                <span className={`text-2xl font-bold ${getGradeColor(metric.score)}`}>
                  {metric.score}%
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">{metric.name}</h3>
              <p className="text-xs text-slate-400">{metric.description}</p>
            </div>
          )
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span className="text-slate-300">Introduction</span>
            </div>
            <span className={`font-semibold ${getGradeColor(scores.introduction)}`}>
              {scores.introduction}%
            </span>
          </div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-pink-400" />
              <span className="text-slate-300">Active Listening</span>
            </div>
            <span className={`font-semibold ${getGradeColor(scores.listening)}`}>
              {scores.listening}%
            </span>
          </div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300">Safety Focus</span>
            </div>
            <span className={`font-semibold ${getGradeColor(scores.safety)}`}>
              {scores.safety}%
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="space-y-6">
        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-3">What You Did Well</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-white/80">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.improvements.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-400 mr-2">→</span>
                  <span className="text-white/80">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Tips */}
        {feedback.specific_tips.length > 0 && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Pro Tips</h3>
            <ul className="space-y-2">
              {feedback.specific_tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-400 mr-2">💡</span>
                  <span className="text-white/80">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
