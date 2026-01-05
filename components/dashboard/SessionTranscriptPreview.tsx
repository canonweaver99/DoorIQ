'use client'

import { TranscriptEntry } from '@/lib/trainer/types'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SessionTranscriptPreviewProps {
  transcript: TranscriptEntry[] | null
  sessionId: string | number
  agentName?: string | null
  maxMessages?: number // Number of messages to show in preview
  className?: string
  keyMoments?: Array<{ startIndex?: number; endIndex?: number; transcript?: string }> // Key moments to show instead of beginning
}

export function SessionTranscriptPreview({
  transcript,
  sessionId,
  agentName,
  maxMessages = 3,
  className,
  keyMoments
}: SessionTranscriptPreviewProps) {
  // Handle empty or null transcript
  if (!transcript || transcript.length === 0) {
    return (
      <div className={cn("text-xs text-slate-400 font-space italic", className)}>
        No transcript available
      </div>
    )
  }

  // Get messages from key moments if available, otherwise from beginning
  let previewMessages: TranscriptEntry[] = []
  let hasMore = false

  if (keyMoments && keyMoments.length > 0 && transcript.length > 0) {
    // Use key moments to get relevant transcript snippets
    const momentIndices = new Set<number>()
    
    keyMoments.slice(0, 2).forEach(moment => {
      if (moment.startIndex !== undefined) {
        const startIdx = Math.max(0, moment.startIndex)
        const endIdx = moment.endIndex !== undefined 
          ? Math.min(transcript.length - 1, moment.endIndex)
          : Math.min(transcript.length - 1, startIdx + 2)
        
        // Get a few lines before and after for context
        const contextStart = Math.max(0, startIdx - 1)
        for (let i = contextStart; i <= endIdx && i < transcript.length; i++) {
          momentIndices.add(i)
        }
      }
    })
    
    // Convert indices to array and sort, then take first maxMessages
    previewMessages = Array.from(momentIndices)
      .sort((a, b) => a - b)
      .slice(0, maxMessages)
      .map(idx => transcript[idx])
      .filter(Boolean)
    
    hasMore = momentIndices.size > maxMessages || transcript.length > Math.max(...Array.from(momentIndices))
  } else {
    // Fallback to first few messages
    previewMessages = transcript.slice(0, maxMessages)
    hasMore = transcript.length > maxMessages
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-white/80 font-space uppercase tracking-wide">
            Transcript Preview
          </span>
        </div>
        {hasMore && (
          <Link
            href={`/analytics/${sessionId}`}
            className="text-xs text-purple-400 hover:text-purple-300 font-space transition-colors"
          >
            View Full →
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-1.5">
        {previewMessages.map((entry, index) => {
          const isUser = entry.speaker === 'user'
          
          return (
            <div
              key={entry.id || index}
              className={cn(
                "text-xs rounded-md px-2 py-1.5 border",
                isUser
                  ? "bg-blue-900/20 border-blue-500/30 text-blue-100"
                  : "bg-slate-800/40 border-slate-700/30 text-slate-200"
              )}
            >
              <div className="flex items-start gap-1.5">
                <span className={cn(
                  "font-semibold font-space flex-shrink-0",
                  isUser ? "text-blue-300" : "text-slate-300"
                )}>
                  {isUser ? 'You' : agentName || 'Homeowner'}:
                </span>
                <span className="font-space leading-relaxed break-words flex-1">
                  {entry.text}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show count if more messages */}
      {hasMore && (
        <div className="text-xs text-slate-400 font-space text-center pt-1">
          +{transcript.length - maxMessages} more messages
        </div>
      )}
    </div>
  )
}

