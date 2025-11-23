'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

interface KeyMoment {
  id: string
  type: 'objection' | 'close_attempt' | 'rapport' | 'discovery' | 'safety'
  startIndex: number
  endIndex: number
  transcript: string
  timestamp: string
  importance: number // 1-10
  outcome: 'success' | 'failure' | 'neutral'
  analysis?: {
    whatHappened: string
    whatWorked: string
    whatToImprove: string
    alternativeResponse: string
  }
}

interface KeyMomentsTimelineProps {
  moments: KeyMoment[]
}

function getMomentTypeColor(type: KeyMoment['type']): string {
  const colors = {
    objection: 'bg-red-100 text-red-700 border-red-200',
    close_attempt: 'bg-blue-100 text-blue-700 border-blue-200',
    rapport: 'bg-green-100 text-green-700 border-green-200',
    discovery: 'bg-purple-100 text-purple-700 border-purple-200',
    safety: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return ''
  
  try {
    // Try parsing as ISO string or timestamp
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      // If not a valid date, might be MM:SS format already
      return timestamp
    }
    
    // Format as MM:SS
    const minutes = Math.floor(date.getMinutes() || 0)
    const seconds = String(date.getSeconds() || 0).padStart(2, '0')
    return `${minutes}:${seconds}`
  } catch {
    return timestamp
  }
}

export function KeyMomentsTimeline({ moments }: KeyMomentsTimelineProps) {
  if (!moments || moments.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">No key moments identified for this session</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700" />
      
      <div className="space-y-8">
        {moments.map((moment, index) => (
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start"
          >
            {/* Icon */}
            <div className={`
              z-10 flex items-center justify-center w-16 h-16 rounded-full border-2
              ${moment.outcome === 'success' ? 'bg-green-500/20 border-green-500/50' : 
                moment.outcome === 'failure' ? 'bg-red-500/20 border-red-500/50' : 
                'bg-slate-500/20 border-slate-500/50'}
            `}>
              {moment.outcome === 'success' ? 
                <CheckCircle className="w-8 h-8 text-green-400" /> :
                moment.outcome === 'failure' ?
                <XCircle className="w-8 h-8 text-red-400" /> :
                <AlertCircle className="w-8 h-8 text-slate-400" />
              }
            </div>
            
            {/* Content */}
            <div className="ml-6 flex-1">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-lg hover:border-slate-600/50 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-400">
                      {formatTimestamp(moment.timestamp) || `Moment ${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-3 py-1 text-xs font-semibold rounded-full border
                      ${getMomentTypeColor(moment.type)}
                    `}>
                      {moment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {moment.importance >= 8 && (
                      <span className="px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                        High Impact
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Transcript snippet */}
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "{moment.transcript.length > 200 ? moment.transcript.slice(0, 200) + '...' : moment.transcript}"
                  </p>
                </div>
                
                {/* Analysis */}
                {moment.analysis && (
                  <div className="space-y-3 border-t border-slate-700/50 pt-4">
                    <div className="text-sm">
                      <span className="font-medium text-slate-400">What happened: </span>
                      <span className="text-slate-300">{moment.analysis.whatHappened}</span>
                    </div>
                    
                    {moment.analysis.whatWorked && (
                      <div className="text-sm">
                        <span className="font-medium text-green-400">✓ What worked: </span>
                        <span className="text-slate-300">{moment.analysis.whatWorked}</span>
                      </div>
                    )}
                    
                    {moment.analysis.whatToImprove && (
                      <div className="text-sm">
                        <span className="font-medium text-orange-400">⚠ Improvement: </span>
                        <span className="text-slate-300">{moment.analysis.whatToImprove}</span>
                      </div>
                    )}
                    
                    {moment.analysis.alternativeResponse && (
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-sm">
                          <span className="font-medium text-blue-400">💡 Try this instead: </span>
                          <span className="text-blue-200 italic">"{moment.analysis.alternativeResponse}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

