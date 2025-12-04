'use client'

import { useEffect, useRef, useState, memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { TranscriptEntry } from '@/lib/trainer/types'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile, useReducedMotion } from '@/hooks/useIsMobile'

interface LiveTranscriptProps {
  transcript: TranscriptEntry[]
  agentName?: string
  agentImageUrl?: string | null
  userAvatarUrl?: string | null
  sessionActive?: boolean
}

// Helper function to format Tag Team Tanya & Tom transcript
function formatTagTeamTranscript(text: string): string {
  // Replace <Tanya>text</Tanya> with Tanya: text
  text = text.replace(/<Tanya>(.*?)<\/Tanya>/gi, 'Tanya: $1')
  // Replace <Tom>text</Tom> with Tom: text
  text = text.replace(/<Tom>(.*?)<\/Tom>/gi, 'Tom: $1')
  return text
}

function TranscriptMessage({ 
  entry, 
  agentName, 
  agentImageUrl, 
  userAvatarUrl,
  sessionStartTime
}: { 
  entry: TranscriptEntry
  agentName?: string
  agentImageUrl?: string | null
  userAvatarUrl?: string | null
  sessionStartTime: Date | null
}) {
  const isMobile = useIsMobile(768)
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = !isMobile && !prefersReducedMotion
  const [copied, setCopied] = useState(false)
  const isUser = entry.speaker === 'user'
  
  // Format text for Tag Team Tanya & Tom
  const displayText = agentName === 'Tag Team Tanya & Tom' && !isUser
    ? formatTagTeamTranscript(entry.text)
    : entry.text

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatTime = (date: Date) => {
    if (!sessionStartTime) return '0:00'
    const diff = date.getTime() - sessionStartTime.getTime()
    const totalSeconds = Math.floor(diff / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  // Get avatar image URL
  const avatarUrl = isUser ? userAvatarUrl : agentImageUrl
  const fallbackInitials = isUser 
    ? 'You' 
    : (agentName ? agentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AH')

  const MessageComponent = shouldAnimate ? motion.div : 'div'
  const messageProps = shouldAnimate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15 }
  } : {}

  return (
    <MessageComponent
      {...messageProps}
      className={cn(
        "flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all group",
        isUser 
          ? "bg-blue-900/30 border-[2px] border-blue-500/60 shadow-[0_4px_12px_rgba(59,130,246,0.3)]" 
          : "bg-slate-800 border-[2px] border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
        isUser ? "bg-slate-700" : "bg-slate-700",
        !avatarUrl && "text-xs sm:text-sm font-semibold",
        isUser && !avatarUrl && "text-slate-200",
        !isUser && !avatarUrl && "text-slate-300"
      )}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={isUser ? 'You' : agentName || 'Homeowner'}
            width={36}
            height={36}
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="36px"
            unoptimized={avatarUrl?.startsWith('http')}
          />
        ) : (
          fallbackInitials
        )}
      </div>
      
      {/* Message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
          <span className={cn(
            "text-xs sm:text-sm font-semibold font-space",
            isUser ? "text-white" : "text-white"
          )}>
            {isUser ? 'You' : agentName || 'Homeowner'}
          </span>
          <span className="text-[10px] sm:text-xs lg:text-sm text-slate-300 font-space font-medium whitespace-nowrap">{formatTime(entry.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 sm:p-1 rounded active:bg-slate-700/70 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 sm:w-4 sm:h-4 text-slate-300" />
            ) : (
              <Copy className="w-4 h-4 sm:w-4 sm:h-4 text-slate-400" />
            )}
          </button>
        </div>
        <p className="text-sm sm:text-base text-white leading-relaxed break-words font-space font-medium">
          {displayText}
        </p>
      </div>
    </MessageComponent>
  )
}

export const LiveTranscript = memo(function LiveTranscript({ transcript, agentName, agentImageUrl, userAvatarUrl, sessionActive = false }: LiveTranscriptProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Get session start time from first transcript entry - memoized
  const sessionStartTime = useMemo(() => transcript.length > 0 ? transcript[0].timestamp : null, [transcript])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && transcriptEndRef.current) {
      const container = scrollContainerRef.current
      // Always scroll to bottom when new transcript entries are added
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }, [transcript.length])

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border-[2px] border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700 flex-shrink-0 bg-slate-900">
        <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-1.5 sm:gap-2 font-space">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${sessionActive ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-400'}`} />
          Live Transcript
        </h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2.5 sm:px-3 lg:px-4 pt-2.5 sm:pt-3 lg:pt-4 pb-1 custom-scrollbar space-y-2 sm:space-y-2.5 min-h-0 will-change-scroll"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)'
        }}
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full text-slate-300 text-xs sm:text-sm font-space font-medium px-2">
            <p className="text-center">Waiting for conversation to begin...</p>
          </div>
        ) : (
          <>
            {transcript.map((entry, index) => {
              // Limit rendered items on mobile for better performance
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
              const shouldRender = !isMobile || index >= transcript.length - 50
              
              return (
                <div 
                  key={entry.id}
                  style={shouldRender ? {} : { contentVisibility: 'auto', containIntrinsicSize: '0 100px' }}
                >
                  {shouldRender && (
                    <TranscriptMessage 
                      entry={entry} 
                      agentName={agentName}
                      agentImageUrl={agentImageUrl}
                      userAvatarUrl={userAvatarUrl}
                      sessionStartTime={sessionStartTime}
                    />
                  )}
                </div>
              )
            })}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>
    </div>
  )
})
