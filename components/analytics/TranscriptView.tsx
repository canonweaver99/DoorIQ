'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Bot, Info } from 'lucide-react'

interface TranscriptEntry {
  text: string
  speaker: string
  timestamp?: string
}

interface TranscriptViewProps {
  transcript: TranscriptEntry[]
  analytics?: any
  className?: string
}

export default function TranscriptView({ transcript, analytics, className = "" }: TranscriptViewProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  // Enhanced line effectiveness analysis
  const analyzeLineEffectiveness = (entry: TranscriptEntry, idx: number, transcript: TranscriptEntry[]) => {
    if (entry.speaker !== 'user' && entry.speaker !== 'rep') return 'neutral'
    
    const text = entry.text.toLowerCase()
    const prevEntry = idx > 0 ? transcript[idx - 1] : null
    const nextEntry = idx < transcript.length - 1 ? transcript[idx + 1] : null
    
    // Check for AI line ratings first
    try {
      const ratings = analytics?.line_ratings || []
      const aiRating = ratings.find((r: any) => r.idx === idx && (entry.speaker === 'user' || entry.speaker === 'rep'))
      if (aiRating?.label) return aiRating.label
    } catch {}
    
    // Excellent moves (green)
    if (
      text.includes('understand how you feel') ||
      text.includes('many homeowners have told me') ||
      text.includes('what if i could show you') ||
      text.includes('safe for pets and children') ||
      text.includes('i have two appointments available') ||
      text.includes('which works better for you') ||
      text.includes('let me ask you this') ||
      (text.includes('?') && (text.includes('pest') || text.includes('concern') || text.includes('issue'))) ||
      text.includes('i completely understand') ||
      text.includes('that makes perfect sense')
    ) return 'excellent'
    
    // Good moves (yellow)
    if (
      text.includes('great question') ||
      text.includes('i appreciate') ||
      text.includes('let me explain') ||
      text.includes('what we do is') ||
      text.includes('our service includes') ||
      text.includes('schedule') ||
      text.includes('appointment') ||
      text.includes('thank you for') ||
      text.includes('i can help')
    ) return 'good'
    
    // Poor moves (red) 
    if (
      text.includes('um') || text.includes('uh') ||
      text.includes('i think') || text.includes('maybe') ||
      text.includes('probably') || text.includes('i guess') ||
      text.length < 10 || // Too short responses
      (prevEntry?.speaker !== 'user' && prevEntry?.speaker !== 'rep' && text.includes('price') && !text.includes('value')) ||
      (text.includes('sorry') && text.length < 20) ||
      text.includes('i don\'t know') ||
      text.includes('not sure')
    ) return 'poor'
    
    return 'average'
  }

  const getLineStyles = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent':
        return {
          border: 'border-l-4 border-green-500',
          background: 'bg-green-50',
          textColor: 'text-green-900'
        }
      case 'good':
        return {
          border: 'border-l-4 border-yellow-500',
          background: 'bg-yellow-50',
          textColor: 'text-yellow-900'
        }
      case 'poor':
        return {
          border: 'border-l-4 border-red-500',
          background: 'bg-red-50',
          textColor: 'text-red-900'
        }
      default:
        return {
          border: 'border-l-4 border-blue-500',
          background: 'bg-blue-50',
          textColor: 'text-blue-900'
        }
    }
  }

  const getHoverExplanation = (entry: TranscriptEntry, idx: number, effectiveness: string) => {
    const text = entry.text.toLowerCase()
    
    // Check for AI explanation first
    try {
      const ratings = analytics?.line_ratings || []
      const aiRating = ratings.find((r: any) => r.idx === idx && (entry.speaker === 'user' || entry.speaker === 'rep'))
      if (aiRating?.explanation) return aiRating.explanation
    } catch {}

    // Provide heuristic explanations
    switch (effectiveness) {
      case 'excellent':
        if (text.includes('understand how you feel')) return 'Excellent empathy - shows you understand customer concerns'
        if (text.includes('safe for pets and children')) return 'Perfect safety focus - addresses key customer concern'
        if (text.includes('which works better for you')) return 'Assumptive close - presents options, not yes/no'
        if (text.includes('?') && (text.includes('pest') || text.includes('concern'))) return 'Great discovery question - uncovers specific problems'
        return 'Excellent response - advances the sale effectively'
        
      case 'good':
        if (text.includes('great question')) return 'Good acknowledgment, but could be more specific'
        if (text.includes('let me explain')) return 'Good transition, shows expertise'
        return 'Good response - adequate but could be stronger'
        
      case 'poor':
        if (text.includes('um') || text.includes('uh')) return 'Filler words reduce confidence - practice smoother delivery'
        if (text.includes('i think') || text.includes('maybe')) return 'Weak language undermines authority - be more definitive'
        if (text.length < 10) return 'Response too brief - elaborate to build rapport'
        return 'Missed opportunity - could have been more effective'
        
      default:
        return 'Average response - does the job but no standout elements'
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timestamp
    }
  }

  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Conversation Transcript</h2>
        <div className="text-center text-gray-500 py-12">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No transcript available for this session.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Conversation Transcript</h2>
      <div className="max-w-4xl mx-auto space-y-3 max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg p-4">
        {transcript.map((entry, idx) => {
          const isRep = entry.speaker === 'user' || entry.speaker === 'rep'
          const effectiveness = isRep ? analyzeLineEffectiveness(entry, idx, transcript) : 'neutral'
          const styles = isRep ? getLineStyles(effectiveness) : { border: '', background: 'bg-gray-100', textColor: 'text-gray-900' }
          const explanation = isRep ? getHoverExplanation(entry, idx, effectiveness) : ''
          
          return (
            <motion.div
              key={idx}
              className={`flex ${isRep ? 'justify-end' : 'justify-start'} mb-2`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className={`max-w-[85%] relative`}>
                <div
                  className={`px-4 py-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                    isRep 
                      ? `${styles.background} ${styles.textColor} ${styles.border} hover:shadow-md` 
                      : 'bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-50'
                  } ${selectedLine === idx ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  onMouseEnter={() => setHoveredLine(idx)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => setSelectedLine(selectedLine === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center text-sm font-medium">
                      {isRep ? (
                        <>
                          <User className="w-4 h-4 mr-1" />
                          Sales Rep
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-1" />
                          Austin Rodriguez
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {entry.timestamp && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(entry.timestamp)}
                        </div>
                      )}
                      {isRep && explanation && (
                        <Info className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-1 leading-relaxed">{entry.text}</div>
                  
                  {/* Effectiveness Badge */}
                  {isRep && effectiveness !== 'neutral' && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        effectiveness === 'excellent' ? 'bg-green-100 text-green-700' :
                        effectiveness === 'good' ? 'bg-yellow-100 text-yellow-700' :
                        effectiveness === 'poor' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {effectiveness === 'excellent' ? '★ Excellent' :
                         effectiveness === 'good' ? '✓ Good' :
                         effectiveness === 'poor' ? '⚠ Poor' : 'Average'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Explanation */}
                <AnimatePresence>
                  {isRep && hoveredLine === idx && explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute z-10 top-full right-0 mt-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg"
                    >
                      <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-900 rotate-45"></div>
                      <p className="leading-relaxed">{explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Excellent (Advances Sale)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Good (Adequate)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Poor (Missed Opportunity)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
