'use client'

import { useState } from 'react'
import { 
  Brain, Heart, MessageSquare, Zap, TrendingUp, 
  AlertCircle, Target, Activity, BarChart3 
} from 'lucide-react'
import { motion } from 'framer-motion'

interface AdvancedMetricsProps {
  advancedMetrics?: {
    conversationFlow: {
      pacing: number
      pauseEffectiveness: number
      topicTransitions: number
      energyLevel: 'low' | 'moderate' | 'high' | 'too_aggressive'
    }
    linguisticAnalysis: {
      vocabularyComplexity: number
      sentenceClarity: number
      jargonUsage: number
      positiveLanguageRatio: number
      fillerWordCount: number
    }
    emotionalIntelligence: {
      empathyScore: number
      mirroringScore: number
      activeListeningIndicators: number
      emotionalRegulation: number
    }
    salesStrategy: {
      needsDiscoveryDepth: number
      valuePropositionClarity: number
      urgencyCreation: number
      assumptiveClosingSkill: number
      objectionPreemption: number
    }
  }
  patterns?: {
    strengths: string[]
    weaknesses: string[]
    missedOpportunities: string[]
    criticalMoments: Array<{
      timestamp: number
      type: 'positive' | 'negative' | 'missed_opportunity'
      description: string
      impact: 'high' | 'medium' | 'low'
    }>
  }
}

export default function AdvancedMetrics({ advancedMetrics, patterns }: AdvancedMetricsProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'linguistic' | 'ei' | 'strategy' | 'patterns'>('flow')
  
  if (!advancedMetrics && !patterns) {
    return null
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-500/20'
    if (score >= 70) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }
  
  const getEnergyLevelColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-blue-400'
      case 'moderate': return 'text-green-400'
      case 'high': return 'text-yellow-400'
      case 'too_aggressive': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }
  
  const MetricCard = ({ label, value, max = 100, icon: Icon }: any) => (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-semibold ${getScoreColor(value)}`}>
          {typeof value === 'number' ? value : value}
        </span>
        {typeof value === 'number' && max && (
          <span className="text-xs text-slate-500">/ {max}</span>
        )}
      </div>
      {typeof value === 'number' && (
        <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(value / max) * 100}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full ${getScoreBg(value)} rounded-full`}
          />
        </div>
      )}
    </div>
  )
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-blue-400" />
        Advanced Performance Analysis
      </h3>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {advancedMetrics && (
          <>
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'flow' 
                  ? 'bg-slate-700 text-slate-100' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Conversation Flow
            </button>
            <button
              onClick={() => setActiveTab('linguistic')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'linguistic' 
                  ? 'bg-slate-700 text-slate-100' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Language Analysis
            </button>
            <button
              onClick={() => setActiveTab('ei')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ei' 
                  ? 'bg-slate-700 text-slate-100' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Emotional Intelligence
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'strategy' 
                  ? 'bg-slate-700 text-slate-100' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-4 h-4" />
              Sales Strategy
            </button>
          </>
        )}
        {patterns && (
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'patterns' 
                ? 'bg-slate-700 text-slate-100' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Patterns & Insights
          </button>
        )}
      </div>
      
      {/* Content */}
      {advancedMetrics && (
        <>
          {activeTab === 'flow' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Pacing Score" value={advancedMetrics.conversationFlow.pacing} icon={Zap} />
              <MetricCard label="Pause Effectiveness" value={advancedMetrics.conversationFlow.pauseEffectiveness} />
              <MetricCard label="Topic Transitions" value={advancedMetrics.conversationFlow.topicTransitions} />
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Energy Level</span>
                </div>
                <span className={`text-2xl font-semibold ${getEnergyLevelColor(advancedMetrics.conversationFlow.energyLevel)}`}>
                  {advancedMetrics.conversationFlow.energyLevel.charAt(0).toUpperCase() + 
                   advancedMetrics.conversationFlow.energyLevel.slice(1).replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
          
          {activeTab === 'linguistic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard label="Vocabulary Complexity" value={advancedMetrics.linguisticAnalysis.vocabularyComplexity} />
                <MetricCard label="Sentence Clarity" value={advancedMetrics.linguisticAnalysis.sentenceClarity} />
                <MetricCard label="Jargon Usage" value={advancedMetrics.linguisticAnalysis.jargonUsage} />
                <MetricCard label="Positive Language" value={advancedMetrics.linguisticAnalysis.positiveLanguageRatio} />
                <MetricCard label="Filler Words" value={advancedMetrics.linguisticAnalysis.fillerWordCount} max={null} />
              </div>
              {advancedMetrics.linguisticAnalysis.fillerWordCount > 5 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    <AlertCircle className="inline w-4 h-4 mr-2" />
                    High filler word count detected. Practice speaking more confidently without "um", "uh", or "like".
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'ei' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Empathy Score" value={advancedMetrics.emotionalIntelligence.empathyScore} icon={Heart} />
              <MetricCard label="Mirroring" value={advancedMetrics.emotionalIntelligence.mirroringScore} />
              <MetricCard label="Active Listening" value={advancedMetrics.emotionalIntelligence.activeListeningIndicators} />
              <MetricCard label="Emotional Control" value={advancedMetrics.emotionalIntelligence.emotionalRegulation} />
            </div>
          )}
          
          {activeTab === 'strategy' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard label="Discovery Depth" value={advancedMetrics.salesStrategy.needsDiscoveryDepth} />
              <MetricCard label="Value Clarity" value={advancedMetrics.salesStrategy.valuePropositionClarity} />
              <MetricCard label="Urgency Creation" value={advancedMetrics.salesStrategy.urgencyCreation} />
              <MetricCard label="Assumptive Closing" value={advancedMetrics.salesStrategy.assumptiveClosingSkill} />
              <MetricCard label="Objection Preemption" value={advancedMetrics.salesStrategy.objectionPreemption} />
            </div>
          )}
        </>
      )}
      
      {activeTab === 'patterns' && patterns && (
        <div className="space-y-6">
          {patterns.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Strengths Identified
              </h4>
              <div className="space-y-2">
                {patterns.strengths.map((strength, idx) => (
                  <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-300">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {patterns.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas for Improvement
              </h4>
              <div className="space-y-2">
                {patterns.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-300">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {patterns.missedOpportunities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Missed Opportunities
              </h4>
              <div className="space-y-2">
                {patterns.missedOpportunities.map((opportunity, idx) => (
                  <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm text-red-300">{opportunity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
