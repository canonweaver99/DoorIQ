'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { TranscriptEntry } from '@/lib/trainer/types'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveTranscriptProps {
  transcript: TranscriptEntry[]
  agentName?: string
  agentImageUrl?: string | null
  userAvatarUrl?: string | null
}

function TranscriptMessage({ 
  entry, 
  agentName, 
  agentImageUrl, 
  userAvatarUrl 
}: { 
  entry: TranscriptEntry
  agentName?: string
  agentImageUrl?: string | null
  userAvatarUrl?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const isUser = entry.speaker === 'user'

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
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // Get avatar image URL
  const avatarUrl = isUser ? userAvatarUrl : agentImageUrl
  const fallbackInitials = isUser 
    ? 'You' 
    : (agentName ? agentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AH')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all group",
        isUser 
          ? "bg-blue-900/20 border border-blue-500/30 shadow-[0_2px_8px_rgba(59,130,246,0.15)]" 
          : "bg-slate-800/70 border border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
        isUser ? "bg-slate-700" : "bg-slate-700",
        !avatarUrl && "text-[10px] sm:text-xs font-semibold",
        isUser && !avatarUrl && "text-slate-200",
        !isUser && !avatarUrl && "text-slate-300"
      )}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={isUser ? 'You' : agentName || 'Homeowner'}
            width={32}
            height={32}
            className="w-full h-full object-cover"
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
            "text-xs sm:text-sm font-medium font-space",
            isUser ? "text-slate-200" : "text-slate-200"
          )}>
            {isUser ? 'You' : agentName || 'Homeowner'}
          </span>
          <span className="text-[10px] sm:text-sm text-slate-400 font-space">{formatTime(entry.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="ml-auto opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 sm:p-1 rounded hover:bg-slate-700/70 touch-manipulation"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            )}
          </button>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed break-words font-space">
          {entry.text}
        </p>
      </div>
    </motion.div>
  )
}

export function LiveTranscript({ transcript, agentName, agentImageUrl, userAvatarUrl }: LiveTranscriptProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    <div className="h-full flex flex-col bg-slate-900/98 rounded-lg overflow-hidden border border-slate-700/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700/80 flex-shrink-0 bg-slate-900/50">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5 sm:gap-2 font-space">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-500 animate-pulse" />
          Live Transcript
        </h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-1 custom-scrollbar space-y-2 sm:space-y-2.5 min-h-0"
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full text-slate-400 text-sm font-space">
            <p className="text-center">Waiting for conversation to begin...</p>
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <TranscriptMessage 
                key={entry.id} 
                entry={entry} 
                agentName={agentName}
                agentImageUrl={agentImageUrl}
                userAvatarUrl={userAvatarUrl}
              />
            ))}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>
    </div>
  )
}
