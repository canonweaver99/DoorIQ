'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TranscriptEntry } from '@/lib/trainer/types'
import { Copy, Check } from 'lucide-react'

interface LiveTranscriptProps {
  transcript: TranscriptEntry[]
  agentName?: string
}

function TranscriptMessage({ entry, agentName }: { entry: TranscriptEntry; agentName?: string }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700/80 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold opacity-80">
              {isUser ? 'Rep' : agentName || 'Homeowner'}:
            </span>
            <span className="text-xs opacity-60">{formatTime(entry.timestamp)}</span>
          </div>
          <button
            onClick={handleCopy}
            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
        <p className="text-sm leading-relaxed break-words">{entry.text}</p>
      </div>
    </motion.div>
  )
}

export function LiveTranscript({ transcript, agentName }: LiveTranscriptProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [transcript])

  return (
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Live Transcript
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <div className="text-center">
              <p>Waiting for conversation to begin...</p>
            </div>
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <TranscriptMessage key={entry.id} entry={entry} agentName={agentName} />
            ))}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>
    </div>
  )
}

