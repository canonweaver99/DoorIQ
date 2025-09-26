'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface MetricProps {
  label: string
  score: number
  color: 'blue' | 'green' | 'yellow' | 'purple'
  relatedLines?: Array<{
    lineNumber: number
    text: string
    impact: 'positive' | 'negative' | 'neutral'
    explanation: string
  }>
  feedback?: string
}

interface PerformanceMetricsProps {
  metrics: MetricProps[]
  transcript?: any[]
  onLineClick?: (lineNumber: number) => void
  className?: string
}

function MetricBar({ label, score, color, relatedLines = [], feedback, onLineClick }: MetricProps & { onLineClick?: (lineNumber: number) => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const colorClasses = {
    blue: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    green: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
    yellow: { bar: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
    purple: { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  }

  const colors = colorClasses[color]
  const hasRelatedLines = relatedLines.length > 0

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'negative':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="mb-6">
      <div 
        className={`p-4 rounded-lg border ${colors.border} ${colors.bg} cursor-pointer transition-all duration-200 hover:shadow-md`}
        onClick={() => hasRelatedLines && setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-700">{label}</span>
            {hasRelatedLines && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </motion.div>
            )}
          </div>
          <span className={`font-semibold text-lg ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-3 rounded-full ${colors.bar}`}
          />
        </div>
        
        {feedback && (
          <p className={`text-sm ${colors.text} font-medium`}>{feedback}</p>
        )}
        
        {hasRelatedLines && (
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <MessageSquare className="w-3 h-3 mr-1" />
            {relatedLines.length} transcript moment{relatedLines.length !== 1 ? 's' : ''} affected this score
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && hasRelatedLines && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`ml-4 mt-2 p-4 border-l-4 ${colors.border} bg-white rounded-r-lg shadow-sm`}>
              <h4 className={`font-semibold ${colors.text} mb-3 flex items-center`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Critical Moments
              </h4>
              
              <div className="space-y-3">
                {relatedLines.map((line, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onLineClick && onLineClick(line.lineNumber)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getImpactIcon(line.impact)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          Line {line.lineNumber}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          line.impact === 'positive' ? 'bg-green-100 text-green-700' :
                          line.impact === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {line.impact === 'positive' ? '+' : line.impact === 'negative' ? '-' : '±'} Impact
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 italic mb-2 line-clamp-2">
                        &ldquo;{line.text}&rdquo;
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {line.explanation}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PerformanceMetrics({ 
  metrics, 
  transcript = [], 
  onLineClick, 
  className = "" 
}: PerformanceMetricsProps) {
  // Generate sample related lines for demonstration
  const generateRelatedLines = (label: string, score: number, transcript: any[]) => {
    const lines: Array<{
      lineNumber: number
      text: string
      impact: 'positive' | 'negative' | 'neutral'
      explanation: string
    }> = []

    if (!Array.isArray(transcript)) return lines

    // Analyze transcript for each metric
    transcript.forEach((entry, idx) => {
      if (entry.speaker !== 'user' && entry.speaker !== 'rep') return
      
      const text = entry.text.toLowerCase()
      const lineNumber = idx + 1

      switch (label) {
        case 'Rapport Building':
          if (text.includes('how are you') || text.includes('nice to meet')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'positive',
              explanation: 'Good personal connection attempt'
            })
          } else if (text.includes('same man') || text.includes('appreciate')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'positive',
              explanation: 'Built connection and showed appreciation'
            })
          } else if (text.length < 10 && entry.speaker === 'user') {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'negative',
              explanation: 'Missed opportunity to build rapport with longer response'
            })
          }
          break

        case 'Objection Handling':
          if (text.includes('understand') || text.includes('i hear you')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'positive',
              explanation: 'Acknowledged customer concern with empathy'
            })
          } else if (text.includes('but') && entry.speaker === 'user') {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'negative',
              explanation: 'Used &quot;but&quot; which can sound dismissive - try &quot;and&quot; instead'
            })
          }
          break

        case 'Safety Discussion':
          if (text.includes('safe') || text.includes('pets') || text.includes('children')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'positive',
              explanation: 'Addressed critical safety concerns'
            })
          }
          break

        case 'Close Effectiveness':
          if (text.includes('which works better') || text.includes('appointments available')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'positive',
              explanation: 'Assumptive close technique - presented options rather than asking yes/no'
            })
          } else if (text.includes('would you like') || text.includes('are you interested')) {
            lines.push({
              lineNumber,
              text: entry.text,
              impact: 'negative',
              explanation: 'Weak close - allows for easy rejection'
            })
          }
          break
      }
    })

    return lines.slice(0, 5) // Limit to top 5 most relevant lines
  }

  const enhancedMetrics = metrics.map(metric => ({
    ...metric,
    relatedLines: generateRelatedLines(metric.label, metric.score, transcript)
  }))

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Breakdown</h2>
      <div className="space-y-4">
        {enhancedMetrics.map((metric, idx) => (
          <MetricBar 
            key={idx} 
            {...metric} 
            onLineClick={onLineClick}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Click on any metric to see specific transcript moments that affected your score. 
          Click on individual lines to jump to that part of the conversation.
        </p>
      </div>
    </div>
  )
}
