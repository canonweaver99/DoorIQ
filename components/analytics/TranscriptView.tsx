'use client'

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
        return 'border-green-500/30 bg-green-500/5'
      case 'good':
        return 'border-blue-500/30 bg-blue-500/5'
      case 'average':
        return 'border-amber-500/30 bg-amber-500/5'
      case 'poor':
        return 'border-red-500/30 bg-red-500/5'
      default:
        return ''
    }
  }

  const getEffectivenessLabel = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return { label: 'Excellent', color: 'text-green-500 bg-green-500/10' }
      case 'good':
        return { label: 'Good', color: 'text-blue-500 bg-blue-500/10' }
      case 'average':
        return { label: 'Average', color: 'text-amber-500 bg-amber-500/10' }
      case 'poor':
        return { label: 'Needs Work', color: 'text-red-500 bg-red-500/10' }
      default:
        return { label: '', color: '' }
    }
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'You'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Homeowner'
    return 'System'
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-white mb-8">Conversation Transcript</h2>

      {/* Transcript Messages */}
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {transcript.map((line, index) => {
          const rating = getLineEffectiveness(index, line.speaker)
          const isRep = line.speaker === 'rep' || line.speaker === 'user'
          const effectivenessStyle = rating ? getEffectivenessColor(rating.effectiveness) : ''
          const effectivenessLabel = rating ? getEffectivenessLabel(rating.effectiveness) : null

          return (
            <div key={index} className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${isRep ? 'ml-12' : 'mr-12'}`}>
                {/* Speaker and Rating */}
                <div className={`flex items-center gap-2 mb-2 ${isRep ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-sm font-medium text-gray-400">
                    {getSpeakerLabel(line.speaker)}
                  </span>
                  {effectivenessLabel && effectivenessLabel.label && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effectivenessLabel.color}`}>
                      {effectivenessLabel.label}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`
                  rounded-lg p-4 
                  ${isRep 
                    ? `bg-white text-black ${rating ? effectivenessStyle : ''}` 
                    : 'bg-[#2a2a2a] text-gray-100 border border-gray-800'
                  }
                `}>
                  <p className="leading-relaxed text-[15px]">
                    {getLineText(line)}
                  </p>
                </div>

                {/* Suggestions */}
                {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && (
                  <div className="mt-3 ml-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">Suggested Alternative</span>
                    </div>
                    {rating.alternative_lines.map((alt, altIndex) => (
                      <p key={altIndex} className="text-sm text-gray-300 italic mb-2">
                        "{alt}"
                      </p>
                    ))}
                    {rating.improvement_notes && (
                      <p className="text-xs text-gray-400 mt-2">
                        {rating.improvement_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Response Quality Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40"></div>
            <span className="text-xs text-gray-400">Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40"></div>
            <span className="text-xs text-gray-400">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></div>
            <span className="text-xs text-gray-400">Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40"></div>
            <span className="text-xs text-gray-400">Needs Work</span>
          </div>
        </div>
      </div>
    </div>
  )
}