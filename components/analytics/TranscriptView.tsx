'use client'

import { useState } from 'react'
import { User, Bot, Lightbulb } from 'lucide-react'

interface TranscriptLine {
  speaker: 'rep' | 'homeowner' | 'system' | 'user' | 'agent'
  text: string
  timestamp?: number
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

  const getEffectivenessColor = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'border-green-500 bg-green-500/10'
      case 'good':
      case 'average':
        return 'border-yellow-500 bg-yellow-500/10'
      case 'poor':
        return 'border-red-500 bg-red-500/10'
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
    if (speaker === 'homeowner' || speaker === 'agent') return 'Homeowner'
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
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Full Transcript</h2>
      
      <div className="space-y-4">
        {transcript.map((line, index) => {
          const rating = getLineEffectiveness(index, line.speaker)
          const isHovered = hoveredLine === index
          
          return (
            <div
              key={index}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                getEffectivenessColor(rating?.effectiveness)
              } ${isHovered ? 'shadow-lg' : ''}`}
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rating.effectiveness === 'excellent' ? 'bg-green-500/20 text-green-400' :
                      rating.effectiveness === 'good' || rating.effectiveness === 'average' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
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
              <p className="text-white/90 leading-relaxed">{line.text}</p>

              {/* Alternative Suggestions (on hover) */}
              {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && isHovered && (
                <div className="absolute left-0 right-0 top-full mt-2 z-10 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-sm font-semibold text-yellow-400">
                      Alternative Approaches
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rating.alternative_lines.map((alt, altIndex) => (
                      <p key={altIndex} className="text-sm text-white/80 italic">
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

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
        <h3 className="text-sm font-semibold text-white mb-3">Effectiveness Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-500/10"></div>
            <span className="text-sm text-slate-300">Excellent Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-500/10"></div>
            <span className="text-sm text-slate-300">Good/Average Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-500/10"></div>
            <span className="text-sm text-slate-300">Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  )
}
