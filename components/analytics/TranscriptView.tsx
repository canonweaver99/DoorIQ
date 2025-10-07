'use client'

import { useState } from 'react'
import { User, Bot, Lightbulb } from 'lucide-react'

interface TranscriptLine {
  speaker: 'rep' | 'homeowner' | 'system' | 'user' | 'agent' | 'ai'
  text?: string
  message?: string  // Support both text and message fields
  timestamp?: number | string
  id?: string
}

interface LineRating {
  line_number: number
  effectiveness: 'excellent' | 'good' | 'average' | 'poor'
  score: number
  alternative_lines?: string[]
  improvement_notes?: string
  category?: string
}

interface TranscriptViewProps {
  transcript: TranscriptLine[]
  lineRatings: LineRating[]
}

export default function TranscriptView({ transcript, lineRatings }: TranscriptViewProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  // Create a map of line ratings by line number
  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))

  const getLineEffectiveness = (lineIndex: number, speaker: string): LineRating | null => {
    // Only rate rep/user lines
    if (speaker !== 'rep' && speaker !== 'user') return null
    
    return ratingsMap.get(lineIndex) || null
  }

  // Get the text content from either text or message field
  const getLineText = (line: TranscriptLine): string => {
    return line.text || line.message || ''
  }

  const getEffectivenessColor = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'border-emerald-500/50 bg-emerald-500/5'
      case 'good':
      case 'average':
        return 'border-amber-500/50 bg-amber-500/5'
      case 'poor':
        return 'border-red-500/50 bg-red-500/5'
      default:
        return 'border-slate-700'
    }
  }

  const getEffectivenessLabel = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'average':
        return 'Average'
      case 'poor':
        return 'Needs Improvement'
      default:
        return ''
    }
  }

  const getSpeakerIcon = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') {
      return <User className="w-5 h-5 text-purple-400" />
    }
    return <Bot className="w-5 h-5 text-blue-400" />
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'Sales Rep'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Homeowner'
    return 'System'
  }

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    const minutes = Math.floor(timestamp / 60)
    const seconds = Math.floor(timestamp % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-slate-200 mb-6">Full Transcript</h2>

      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <div className="space-y-3">
          {transcript.map((line, index) => {
          const rating = getLineEffectiveness(index, line.speaker)
          const isHovered = hoveredLine === index
          
          return (
            <div
              key={index}
              className={`relative p-4 rounded-lg border transition-all duration-200 ${
                getEffectivenessColor(rating?.effectiveness)
              } ${isHovered ? 'shadow-md' : ''}`}
              onMouseEnter={() => setHoveredLine(index)}
              onMouseLeave={() => setHoveredLine(null)}
            >
              {/* Speaker Info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getSpeakerIcon(line.speaker)}
                  <span className="font-semibold text-white">
                    {getSpeakerLabel(line.speaker)}
                  </span>
                  {rating && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rating.effectiveness === 'excellent' ? 'bg-emerald-500/10 text-emerald-400' :
                      rating.effectiveness === 'good' || rating.effectiveness === 'average' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {getEffectivenessLabel(rating.effectiveness)}
                    </span>
                  )}
                </div>
                {line.timestamp !== undefined && (
                  <span className="text-sm text-slate-400">
                    {formatTimestamp(line.timestamp)}
                  </span>
                )}
              </div>

              {/* Line Text */}
              <p className="text-white/90 leading-relaxed">{getLineText(line)}</p>

              {/* Alternative Suggestions (on hover) */}
              {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 mr-2" />
                    <span className="text-sm font-medium text-amber-400">
                      Suggested Alternative
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rating.alternative_lines.map((alt, altIndex) => (
                      <p key={altIndex} className="text-sm text-slate-300 italic">
                        "{alt}"
                      </p>
                    ))}
                  </div>
                  {rating.improvement_notes && (
                    <p className="text-xs text-slate-400 mt-2">
                      💡 {rating.improvement_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Effectiveness Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-emerald-500/50 bg-emerald-500/10"></div>
            <span className="text-xs text-slate-400">Excellent Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-amber-500/50 bg-amber-500/10"></div>
            <span className="text-xs text-slate-400">Good/Average Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-red-500/50 bg-red-500/10"></div>
            <span className="text-xs text-slate-400">Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  )
}
