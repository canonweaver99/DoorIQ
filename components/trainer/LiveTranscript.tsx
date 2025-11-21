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
        "flex gap-3 p-3 rounded-xl transition-colors group",
        isUser ? "bg-blue-900/20" : "bg-slate-800/40"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
        isUser ? "bg-blue-600" : "bg-slate-700",
        !avatarUrl && "text-xs font-semibold",
        isUser && !avatarUrl && "text-white",
        !isUser && !avatarUrl && "text-gray-300"
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
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn(
            "text-sm font-medium font-space text-white",
            isUser ? "text-blue-300" : "text-white/90"
          )}>
            {isUser ? 'You' : agentName || 'Homeowner'}
          </span>
          <span className="text-sm text-white/70 font-space">{formatTime(entry.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700/50"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
        <p className="text-base text-white leading-relaxed break-words font-space">
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
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-space">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Live Transcript
        </h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2"
        style={{ maxHeight: '300px' }}
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60 text-sm font-space">
            <div className="text-center">
              <p>Waiting for conversation to begin...</p>
            </div>
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
