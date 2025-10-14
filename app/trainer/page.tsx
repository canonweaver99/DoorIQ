'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import CalculatingScore from '@/components/analytics/CalculatingScore'
import MoneyNotification from '@/components/trainer/MoneyNotification'
import { useSessionRecording } from '@/hooks/useSessionRecording'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface Agent {
  id: string
  name: string
  persona: string | null
  eleven_agent_id: string
  is_active: boolean
}

const ORB_COLORS: Record<string, {
  idle: { start: string; mid: string; end: string; shadow: string; ring: string }
  active: {
    start: string
    mid: string
    end: string
    shadow: string
    ring1: string
    ring2: string
    ring3: string
    ring4: string
    hoverShadow: string
    hoverRing1: string
    hoverRing2: string
    hoverRing3: string
  }
}> = {
  Austin: {
    idle: {
      start: '#86efac',
      mid: '#22c55e',
      end: '#15803d',
      shadow: 'rgba(34,197,94,0.6)',
      ring: 'rgba(34,197,94,0.15)',
    },
    active: {
      start: '#34d399',
      mid: '#10b981',
      end: '#059669',
      shadow: 'rgba(16,185,129,0.6)',
      ring1: 'rgba(16,185,129,0.15)',
      ring2: 'rgba(16,185,129,0.1)',
      ring3: 'rgba(16,185,129,0.05)',
      ring4: 'rgba(16,185,129,0.03)',
      hoverShadow: 'rgba(16,185,129,0.7)',
      hoverRing1: 'rgba(16,185,129,0.2)',
      hoverRing2: 'rgba(16,185,129,0.15)',
      hoverRing3: 'rgba(16,185,129,0.08)',
    },
  },
  'No Problem Nancy': {
    idle: {
      start: '#fdba74',
      mid: '#f97316',
      end: '#c2410c',
      shadow: 'rgba(249,115,22,0.6)',
      ring: 'rgba(249,115,22,0.15)',
    },
    active: {
      start: '#fb923c',
      mid: '#f97316',
      end: '#ea580c',
      shadow: 'rgba(249,115,22,0.6)',
      ring1: 'rgba(249,115,22,0.15)',
      ring2: 'rgba(249,115,22,0.1)',
      ring3: 'rgba(249,115,22,0.05)',
      ring4: 'rgba(249,115,22,0.03)',
      hoverShadow: 'rgba(249,115,22,0.7)',
      hoverRing1: 'rgba(249,115,22,0.2)',
      hoverRing2: 'rgba(249,115,22,0.15)',
      hoverRing3: 'rgba(249,115,22,0.08)',
    },
  },
  'Already Got It Alan': {
    idle: {
      start: '#fcd34d',
      mid: '#f59e0b',
      end: '#b45309',
      shadow: 'rgba(245,158,11,0.6)',
      ring: 'rgba(245,158,11,0.15)',
    },
    active: {
      start: '#fbbf24',
      mid: '#f59e0b',
      end: '#d97706',
      shadow: 'rgba(245,158,11,0.6)',
      ring1: 'rgba(245,158,11,0.15)',
      ring2: 'rgba(245,158,11,0.1)',
      ring3: 'rgba(245,158,11,0.05)',
      ring4: 'rgba(245,158,11,0.03)',
      hoverShadow: 'rgba(245,158,11,0.7)',
      hoverRing1: 'rgba(245,158,11,0.2)',
      hoverRing2: 'rgba(245,158,11,0.15)',
      hoverRing3: 'rgba(245,158,11,0.08)',
    },
  },
  'Not Interested Nick': {
    idle: {
      start: '#fca5a5',
      mid: '#ef4444',
      end: '#b91c1c',
      shadow: 'rgba(239,68,68,0.6)',
      ring: 'rgba(239,68,68,0.15)',
    },
    active: {
      start: '#f87171',
      mid: '#ef4444',
      end: '#dc2626',
      shadow: 'rgba(239,68,68,0.6)',
      ring1: 'rgba(239,68,68,0.15)',
      ring2: 'rgba(239,68,68,0.1)',
      ring3: 'rgba(239,68,68,0.05)',
      ring4: 'rgba(239,68,68,0.03)',
      hoverShadow: 'rgba(239,68,68,0.7)',
      hoverRing1: 'rgba(239,68,68,0.2)',
      hoverRing2: 'rgba(239,68,68,0.15)',
      hoverRing3: 'rgba(239,68,68,0.08)',
    },
  },
  'DIY Dave': {
    idle: {
      start: '#c4b5fd',
      mid: '#8b5cf6',
      end: '#6d28d9',
      shadow: 'rgba(139,92,246,0.6)',
      ring: 'rgba(139,92,246,0.15)',
    },
    active: {
      start: '#a78bfa',
      mid: '#8b5cf6',
      end: '#7c3aed',
      shadow: 'rgba(139,92,246,0.6)',
      ring1: 'rgba(139,92,246,0.15)',
      ring2: 'rgba(139,92,246,0.1)',
      ring3: 'rgba(139,92,246,0.05)',
      ring4: 'rgba(139,92,246,0.03)',
      hoverShadow: 'rgba(139,92,246,0.7)',
      hoverRing1: 'rgba(139,92,246,0.2)',
      hoverRing2: 'rgba(139,92,246,0.15)',
      hoverRing3: 'rgba(139,92,246,0.08)',
    },
  },
  'Too Expensive Tim': {
    idle: {
      start: '#d8b4fe',
      mid: '#a855f7',
      end: '#7e22ce',
      shadow: 'rgba(168,85,247,0.6)',
      ring: 'rgba(168,85,247,0.15)',
    },
    active: {
      start: '#c084fc',
      mid: '#a855f7',
      end: '#9333ea',
      shadow: 'rgba(168,85,247,0.6)',
      ring1: 'rgba(168,85,247,0.15)',
      ring2: 'rgba(168,85,247,0.1)',
      ring3: 'rgba(168,85,247,0.05)',
      ring4: 'rgba(168,85,247,0.03)',
      hoverShadow: 'rgba(168,85,247,0.7)',
      hoverRing1: 'rgba(168,85,247,0.2)',
      hoverRing2: 'rgba(168,85,247,0.15)',
      hoverRing3: 'rgba(168,85,247,0.08)',
    },
  },
  'Spouse Check Susan': {
    idle: {
      start: '#93c5fd',
      mid: '#3b82f6',
      end: '#1e40af',
      shadow: 'rgba(59,130,246,0.6)',
      ring: 'rgba(59,130,246,0.15)',
    },
    active: {
      start: '#60a5fa',
      mid: '#3b82f6',
      end: '#2563eb',
      shadow: 'rgba(59,130,246,0.6)',
      ring1: 'rgba(59,130,246,0.15)',
      ring2: 'rgba(59,130,246,0.1)',
      ring3: 'rgba(59,130,246,0.05)',
      ring4: 'rgba(59,130,246,0.03)',
      hoverShadow: 'rgba(59,130,246,0.7)',
      hoverRing1: 'rgba(59,130,246,0.2)',
      hoverRing2: 'rgba(59,130,246,0.15)',
      hoverRing3: 'rgba(59,130,246,0.08)',
    },
  },
  'Busy Beth': {
    idle: {
      start: '#d1d5db',
      mid: '#6b7280',
      end: '#374151',
      shadow: 'rgba(107,114,128,0.6)',
      ring: 'rgba(107,114,128,0.15)',
    },
    active: {
      start: '#9ca3af',
      mid: '#6b7280',
      end: '#4b5563',
      shadow: 'rgba(107,114,128,0.6)',
      ring1: 'rgba(107,114,128,0.15)',
      ring2: 'rgba(107,114,128,0.1)',
      ring3: 'rgba(107,114,128,0.05)',
      ring4: 'rgba(107,114,128,0.03)',
      hoverShadow: 'rgba(107,114,128,0.7)',
      hoverRing1: 'rgba(107,114,128,0.2)',
      hoverRing2: 'rgba(107,114,128,0.15)',
      hoverRing3: 'rgba(107,114,128,0.08)',
    },
  },
  'Renter Randy': {
    idle: {
      start: '#fda4af',
      mid: '#f43f5e',
      end: '#be123c',
      shadow: 'rgba(244,63,94,0.6)',
      ring: 'rgba(244,63,94,0.15)',
    },
    active: {
      start: '#fb7185',
      mid: '#f43f5e',
      end: '#e11d48',
      shadow: 'rgba(244,63,94,0.6)',
      ring1: 'rgba(244,63,94,0.15)',
      ring2: 'rgba(244,63,94,0.1)',
      ring3: 'rgba(244,63,94,0.05)',
      ring4: 'rgba(244,63,94,0.03)',
      hoverShadow: 'rgba(244,63,94,0.7)',
      hoverRing1: 'rgba(244,63,94,0.2)',
      hoverRing2: 'rgba(244,63,94,0.15)',
      hoverRing3: 'rgba(244,63,94,0.08)',
    },
  },
  'Skeptical Sam': {
    idle: {
      start: '#c4b5fd',
      mid: '#8b5cf6',
      end: '#6d28d9',
      shadow: 'rgba(139,92,246,0.6)',
      ring: 'rgba(139,92,246,0.15)',
    },
    active: {
      start: '#a78bfa',
      mid: '#8b5cf6',
      end: '#7c3aed',
      shadow: 'rgba(139,92,246,0.6)',
      ring1: 'rgba(139,92,246,0.15)',
      ring2: 'rgba(139,92,246,0.1)',
      ring3: 'rgba(139,92,246,0.05)',
      ring4: 'rgba(139,92,246,0.03)',
      hoverShadow: 'rgba(139,92,246,0.7)',
      hoverRing1: 'rgba(139,92,246,0.2)',
      hoverRing2: 'rgba(139,92,246,0.15)',
      hoverRing3: 'rgba(139,92,246,0.08)',
    },
  },
  'Just Treated Jerry': {
    idle: {
      start: '#67e8f9',
      mid: '#06b6d4',
      end: '#0e7490',
      shadow: 'rgba(6,182,212,0.6)',
      ring: 'rgba(6,182,212,0.15)',
    },
    active: {
      start: '#22d3ee',
      mid: '#06b6d4',
      end: '#0891b2',
      shadow: 'rgba(6,182,212,0.6)',
      ring1: 'rgba(6,182,212,0.15)',
      ring2: 'rgba(6,182,212,0.1)',
      ring3: 'rgba(6,182,212,0.05)',
      ring4: 'rgba(6,182,212,0.03)',
      hoverShadow: 'rgba(6,182,212,0.7)',
      hoverRing1: 'rgba(6,182,212,0.2)',
      hoverRing2: 'rgba(6,182,212,0.15)',
      hoverRing3: 'rgba(6,182,212,0.08)',
    },
  },
  'Think About It Tina': {
    idle: {
      start: '#d8b4fe',
      mid: '#a855f7',
      end: '#7e22ce',
      shadow: 'rgba(168,85,247,0.6)',
      ring: 'rgba(168,85,247,0.15)',
    },
    active: {
      start: '#c084fc',
      mid: '#a855f7',
      end: '#9333ea',
      shadow: 'rgba(168,85,247,0.6)',
      ring1: 'rgba(168,85,247,0.15)',
      ring2: 'rgba(168,85,247,0.1)',
      ring3: 'rgba(168,85,247,0.05)',
      ring4: 'rgba(168,85,247,0.03)',
      hoverShadow: 'rgba(168,85,247,0.7)',
      hoverRing1: 'rgba(168,85,247,0.2)',
      hoverRing2: 'rgba(168,85,247,0.15)',
      hoverRing3: 'rgba(168,85,247,0.08)',
    },
  },
}

const getOrbColors = (name?: string) => {
  if (!name) return ORB_COLORS.Austin
  return ORB_COLORS[name] ?? ORB_COLORS.Austin
}

function TrainerPageContent() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [deltaText, setDeltaText] = useState<string>('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [calculatingScore, setCalculatingScore] = useState(false)
  const [showMoneyNotification, setShowMoneyNotification] = useState(false)
  const [earningsAmount, setEarningsAmount] = useState(0)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [homeownerName, setHomeownerName] = useState<string>('')
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [showSilenceWarning, setShowSilenceWarning] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const lastAgentActivityRef = useRef<number>(Date.now())
  const lastUserActivityRef = useRef<number>(Date.now())
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tokenRenewalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const silenceCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

  const orbColors = getOrbColors(selectedAgent?.name)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const removeShareModalArtifacts = () => {
      const nodes = document.querySelectorAll(
        'script[src*="share-modal"], link[href*="share-modal"], div[id*="share-modal"], button[data-testid*="share"], button[class*="share"]'
      )
      nodes.forEach((node) => {
        node.parentElement?.removeChild(node)
      })
    }

    removeShareModalArtifacts()

    const observer = new MutationObserver(() => {
      removeShareModalArtifacts()
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  // Audio recording is now handled inside ElevenLabsConversation component
  // Removed duplicate hook to prevent conflicts
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  
  const isUuid = (value: string | null | undefined): boolean => {
    if (!value) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  }
  
  // Request mic permission early
  useEffect(() => {
    if (micPermissionGranted) return
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStream.current = stream
        setMicPermissionGranted(true)
      } catch (_) {
        // Permission denied or not available
      }
    })()
  }, [micPermissionGranted])

  useEffect(() => {
    fetchUser()
    fetchAgents()

    const nameParam = searchParams.get('name')
    if (nameParam) {
      setHomeownerName(nameParam)
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
      }
      if (tokenRenewalTimerRef.current) {
        clearInterval(tokenRenewalTimerRef.current)
      }
      if (silenceCheckTimerRef.current) {
        clearInterval(silenceCheckTimerRef.current)
      }
      signedUrlAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const handleAgentSelection = (event: CustomEvent<{ agentId: string; agentName: string }>) => {
      if (!event?.detail?.agentId) return
      const match = availableAgents.find(agent => agent.eleven_agent_id === event.detail.agentId)
      if (match) {
        setSelectedAgent(match)
        setHomeownerName(match.name)
      }
    }

    window.addEventListener('trainer:select-agent', handleAgentSelection as EventListener)
    return () => {
      window.removeEventListener('trainer:select-agent', handleAgentSelection as EventListener)
    }
  }, [availableAgents])

  // Handle transcript updates
  const activeAgentLabel = selectedAgent?.name || 'Homeowner'

  const setDelta = useCallback((text: string, speaker: 'user' | 'homeowner' = 'homeowner') => {
    setDeltaText(text || '')
  }, [])

  const pushFinal = useCallback(async (
    text: string | null | undefined,
    speaker: 'user' | 'homeowner' = 'homeowner',
  ) => {
    console.log('📝 pushFinal called with:', { text: text?.substring(0, 50), speaker })
    if (!text || typeof text !== 'string' || !text.trim()) {
      console.warn('⚠️ pushFinal called with empty or invalid text, skipping', { text, type: typeof text })
      return
    }

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date(),
    }
    console.log('📝 Adding transcript entry:', entry)
    setTranscript(prev => {
      console.log('📝 Current transcript length:', prev.length, '→ New length:', prev.length + 1)
      return [...prev, entry]
    })
    if (speaker === 'homeowner') {
      console.log('📝 Clearing delta text')
      setDeltaText('')
    }

    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }, 100)
  }, [])

  // Listen for ElevenLabs conversation events
  useEffect(() => {
    const handleMessage = (event: any) => {
      try {
        const msg = event?.detail

        if (msg?.type === 'transcript.delta') {
          setDelta(msg.text || '', 'homeowner')
        } else if (msg?.type === 'transcript.final') {
          if (msg.text) {
            pushFinal(msg.text, 'homeowner')
            lastAgentActivityRef.current = Date.now()
          }
        } else if (msg?.type === 'user_transcript') {
          const userText = msg.user_transcript || msg.text
          if (userText) {
            pushFinal(userText, 'user')
            lastUserActivityRef.current = Date.now()
          }
        } else if (msg?.type === 'agent_response') {
          const response = msg.agent_response
          let text = ''
          if (typeof response === 'string') {
            text = response
          } else if (response?.text) {
            text = response.text
          } else if (response?.content) {
            text = response.content
          }
          if (text) {
            pushFinal(text, 'homeowner')
            lastAgentActivityRef.current = Date.now()
          }
        }
      } catch (e) {
        console.error('Error processing transcript message:', e)
      }
    }

    const handleUserEvent = (e: any) => {
      console.log('🎯 EVENT FIRED: agent:user', e?.detail)
      if (e?.detail && typeof e.detail === 'string' && e.detail.trim()) {
        console.log('🎯 Calling pushFinal with USER text:', e.detail)
        pushFinal(e.detail, 'user')
        lastUserActivityRef.current = Date.now()
      } else {
        console.warn('⚠️ agent:user event received with invalid detail:', e?.detail)
      }
    }

    const handleAgentEvent = (e: any) => {
      console.log('🎯 EVENT FIRED: agent:response', e?.detail)
      if (e?.detail && typeof e.detail === 'string' && e.detail.trim()) {
        console.log('🎯 Calling pushFinal with AGENT text:', e.detail)
        pushFinal(e.detail, 'homeowner')
        lastAgentActivityRef.current = Date.now()
      } else {
        console.warn('⚠️ agent:response event received with invalid detail:', e?.detail)
      }
    }

    const handleDeltaEvent = (e: any) => {
      console.log('🎯 EVENT FIRED: agent:delta', e?.detail)
      // Handle interim/delta transcripts (live preview as agent speaks)
      if (e?.detail && typeof e.detail === 'string') {
        console.log('🎯 Setting delta text:', e.detail)
        setDeltaText(e.detail)
        lastAgentActivityRef.current = Date.now()
      } else {
        console.warn('⚠️ agent:delta event received with invalid detail:', e?.detail)
      }
    }

    const handleConnectionStatus = (e: any) => {
      if (e?.detail) {
        setConnectionStatus(e.detail)
        console.log('🔌 Connection status updated:', e.detail)
        
        // Update activity on successful connection
        if (e.detail === 'connected') {
          lastAgentActivityRef.current = Date.now()
        }
        
        // Fail-safe: end session on error only (not idle)
        if ((e.detail === 'error') && sessionActive) {
          console.log('🛑 Connection error — auto-ending session...')
          window.dispatchEvent(new CustomEvent('trainer:end-session-requested'))
        }
      }
    }

    const handleEndCall = (e: any) => {
      console.log('🛑 EVENT FIRED: agent:end_call', e?.detail)
      console.log('🛑 Austin called end_call tool! Reason:', e?.detail?.reason)
      console.log('🛑 Automatically ending session and starting grading...')
      // Trigger the end session via a custom event that will be handled elsewhere
      // This avoids dependency issues with endSession in useEffect
      window.dispatchEvent(new CustomEvent('trainer:end-session-requested'))
    }

    window.addEventListener('agent:message', handleMessage)
    window.addEventListener('agent:user', handleUserEvent)
    window.addEventListener('agent:response', handleAgentEvent)
    window.addEventListener('agent:delta', handleDeltaEvent)
    window.addEventListener('connection:status', handleConnectionStatus)
    window.addEventListener('agent:end_call', handleEndCall as EventListener)

    // Audio recording is managed by ElevenLabsConversation component

    return () => {
      window.removeEventListener('agent:message', handleMessage)
      window.removeEventListener('agent:user', handleUserEvent)
      window.removeEventListener('agent:response', handleAgentEvent)
      window.removeEventListener('agent:delta', handleDeltaEvent)
      window.removeEventListener('connection:status', handleConnectionStatus)
      window.removeEventListener('agent:end_call', handleEndCall as EventListener)
    }
  }, [pushFinal, setDelta, sessionActive])

  // Inactivity watchdog: end after 180s of no agent AND no user activity, and no active delta text
  useEffect(() => {
    if (!sessionActive) {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      return
    }

    lastAgentActivityRef.current = Date.now()
    lastUserActivityRef.current = Date.now()
    inactivityTimerRef.current = setInterval(() => {
      const now = Date.now()
      const agentIdleMs = now - lastAgentActivityRef.current
      const userIdleMs = now - lastUserActivityRef.current
      const INACTIVITY_LIMIT_MS = 180_000 // Increased from 120s to 180s (3 minutes)
      const noActiveDelta = !deltaText
      
      // Only auto-end if BOTH are inactive AND no delta text AND transcript has content
      if (agentIdleMs >= INACTIVITY_LIMIT_MS && userIdleMs >= INACTIVITY_LIMIT_MS && noActiveDelta && transcript.length > 0) {
        console.log(`🛑 Agent and user inactive for ${Math.round(INACTIVITY_LIMIT_MS/1000)}s — auto-ending session`)
        console.log(`📊 Last agent activity: ${Math.round(agentIdleMs/1000)}s ago, Last user activity: ${Math.round(userIdleMs/1000)}s ago`)
        window.dispatchEvent(new CustomEvent('trainer:end-session-requested'))
      }
    }, 5_000) // Check every 5s instead of 3s

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }
  }, [sessionActive, deltaText, transcript.length])

  // Token renewal: Refresh conversation token every 9 minutes (before 10-minute expiry)
  useEffect(() => {
    if (!sessionActive || !selectedAgent) {
      if (tokenRenewalTimerRef.current) {
        clearInterval(tokenRenewalTimerRef.current)
        tokenRenewalTimerRef.current = null
      }
      return
    }

    // Renew token every 9 minutes (540 seconds)
    tokenRenewalTimerRef.current = setInterval(async () => {
      console.log('🔄 Renewing conversation token...')
      try {
        const result = await fetchConversationToken(selectedAgent.eleven_agent_id)
        if (result.canProceed && result.conversationToken) {
          setConversationToken(result.conversationToken)
          console.log('✅ Conversation token renewed successfully')
          
          // Dispatch event to update the conversation with new token
          window.dispatchEvent(new CustomEvent('trainer:token-renewed', {
            detail: { conversationToken: result.conversationToken }
          }))
        } else {
          console.error('❌ Token renewal failed:', result.error)
        }
      } catch (error) {
        console.error('❌ Error renewing token:', error)
      }
    }, 540_000) // 9 minutes

    return () => {
      if (tokenRenewalTimerRef.current) {
        clearInterval(tokenRenewalTimerRef.current)
        tokenRenewalTimerRef.current = null
      }
    }
  }, [sessionActive, selectedAgent])

  // Silence detection: Show warning if agent hasn't responded in 30 seconds
  useEffect(() => {
    if (!sessionActive) {
      if (silenceCheckTimerRef.current) {
        clearInterval(silenceCheckTimerRef.current)
        silenceCheckTimerRef.current = null
      }
      setShowSilenceWarning(false)
      return
    }

    silenceCheckTimerRef.current = setInterval(() => {
      const now = Date.now()
      const agentIdleMs = now - lastAgentActivityRef.current
      const SILENCE_WARNING_MS = 30_000 // Show warning after 30s of silence
      
      if (agentIdleMs >= SILENCE_WARNING_MS && !showSilenceWarning) {
        console.warn('⚠️ Agent silent for 30+ seconds, showing warning')
        setShowSilenceWarning(true)
      } else if (agentIdleMs < SILENCE_WARNING_MS && showSilenceWarning) {
        console.log('✅ Agent responded, hiding warning')
        setShowSilenceWarning(false)
      }
    }, 3_000) // Check every 3s

    return () => {
      if (silenceCheckTimerRef.current) {
        clearInterval(silenceCheckTimerRef.current)
        silenceCheckTimerRef.current = null
      }
    }
  }, [sessionActive, showSilenceWarning])

  const handleReconnect = async () => {
    if (!selectedAgent || !sessionActive) return
    
    setIsReconnecting(true)
    setShowSilenceWarning(false)
    
    try {
      console.log('🔄 Attempting to reconnect...')
      const result = await fetchConversationToken(selectedAgent.eleven_agent_id)
      
      if (result.canProceed && result.conversationToken) {
        setConversationToken(result.conversationToken)
        console.log('✅ Reconnected successfully')
        
        // Reset activity timers
        lastAgentActivityRef.current = Date.now()
        
        // Dispatch reconnection event
        window.dispatchEvent(new CustomEvent('trainer:reconnect', {
          detail: { conversationToken: result.conversationToken }
        }))
        
        setIsReconnecting(false)
      } else {
        throw new Error(result.error || 'Reconnection failed')
      }
    } catch (error) {
      console.error('❌ Reconnection error:', error)
      setIsReconnecting(false)
      setShowSilenceWarning(true) // Keep warning visible
    }
  }

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser(profile)
    }
  }

  const fetchAgents = async () => {
    try {
      const agentParam = searchParams.get('agent')

      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      setAvailableAgents(Array.isArray(agents) ? agents : [])

      if (agentParam) {
        const match = (agents as any[])?.find((agent: Agent) => (agent as any).eleven_agent_id === agentParam) as Agent | undefined
        setSelectedAgent(match || agents?.[0] || null)
        if (match && !homeownerName) {
          setHomeownerName(match.name)
        }
      } else {
        const defaultAgent = (agents && (agents as any[])[0]) as Agent | undefined
        setSelectedAgent(defaultAgent || null)
        if (defaultAgent && !homeownerName) {
          setHomeownerName(defaultAgent.name || 'Homeowner')
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAvailableAgents([])
      if (!selectedAgent) setSelectedAgent(null)
    } finally {
      setLoadingAgent(false)
    }
  }

  // Retry microphone permission when the connection pill is clicked
  const retryMicrophoneAccess = useCallback(async () => {
    try {
      console.log('🎤 Retrying microphone permission request...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      setMicPermissionGranted(true)
      console.log('✅ Microphone permission granted on retry')
      alert('Microphone access granted. You can start the conversation now.')
    } catch (err: any) {
      console.warn('❌ Microphone permission still denied:', err?.name || err)
      try {
        // Use Permissions API if available to provide targeted guidance
        const permission: any = await (navigator as any)?.permissions?.query?.({ name: 'microphone' as any })
        if (permission?.state === 'denied') {
          alert('Microphone access is blocked in your browser. Click the camera icon in the address bar and set Microphone to "Allow", then reload this page.')
          return
        }
      } catch {}
      alert('Unable to access the microphone. Please allow mic access in your browser settings and try again.')
    }
  }, [])

  const fetchConversationToken = async (agentId: string): Promise<{ conversationToken: string | null; canProceed: boolean; error?: string }> => {
    signedUrlAbortRef.current?.abort()
    const controller = new AbortController()
    signedUrlAbortRef.current = controller

    console.log('🔐 Requesting WebRTC conversation token for agent:', agentId)

    try {
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
        signal: controller.signal,
      })

      console.log('📡 Conversation token API response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to get conversation token' }))
        console.error('❌ Conversation token API error:', error)
        return { conversationToken: null, canProceed: false, error: error?.error || error?.details || 'Failed to get conversation token' }
      }

      const payload = await response.json()
      console.log('✅ Conversation token payload received:', { 
        hasToken: !!payload?.conversation_token,
        expires_at: payload?.expires_at 
      })
      
      if (!payload?.conversation_token) {
        return { conversationToken: null, canProceed: false, error: 'Conversation token missing from response' }
      }
      
      return { conversationToken: payload.conversation_token, canProceed: true }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Conversation token request aborted')
        return { conversationToken: null, canProceed: false, error: 'Request cancelled' }
      }
      console.error('❌ Error fetching conversation token:', error)
      return { conversationToken: null, canProceed: false, error: error?.message || 'Network error' }
    }
  }

  const startSession = async () => {
    if (!selectedAgent?.eleven_agent_id) {
      console.error('❌ No agent selected - cannot start session')
      alert('Please select an agent first')
      return
    }

    try {
      setLoading(true)
      setDeltaText('')
      setTranscript([])
      setDuration(0)

      // Require auth before starting a session. If not signed in, redirect to login.
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.warn('🔒 Not authenticated. Redirecting to login...')
          router.push('/auth/login?next=/trainer')
          setLoading(false)
          return
        }
      } catch {}

      console.log('🎬 Starting training session...')
      console.log('Selected agent:', selectedAgent.name, selectedAgent.eleven_agent_id)

      // Start fetching conversation token IMMEDIATELY (in parallel with sounds)
      console.log('🔑 Fetching WebRTC conversation token from ElevenLabs (in parallel)...')
      const tokenPromise = fetchConversationToken(selectedAgent.eleven_agent_id)

      // 🚪 PLAY DOOR KNOCK SOUND WHILE TOKEN FETCHES
      console.log('🚪 Playing door knock sound...')
      try {
        const knockAudio = new Audio('/sounds/knock.mp3')
        knockAudio.volume = 0.5
        await knockAudio.play()
      } catch (e) {
        console.log('⚠️ Could not play knock sound:', e)
      }

      // Wait for knock to finish
      await new Promise(resolve => setTimeout(resolve, 800))

      // 🚪 PLAY DOOR OPEN SOUND
      console.log('🚪 Playing door open sound...')
      try {
        const doorOpenAudio = new Audio('/sounds/door_open.mp3')
        doorOpenAudio.volume = 0.4
        await doorOpenAudio.play()
      } catch (e) {
        console.log('⚠️ Could not play door open sound:', e)
      }

      // Brief delay before agent speaks
      await new Promise(resolve => setTimeout(resolve, 500))

      // By now, token should be ready (or almost ready)
      console.log('⏳ Waiting for conversation token...')
      const result = await tokenPromise
      
      if (!result.canProceed) {
        throw new Error(result.error || 'Failed to initialize connection')
      }
      
      if (result.conversationToken) {
        console.log('✅ Conversation token received')
        setConversationToken(result.conversationToken)
      } else {
        throw new Error('No conversation token received')
      }
      
      const newId = await createSessionRecord()
      if (!newId) {
        throw new Error('Failed to create session')
      }
      
      console.log('Session ID:', newId)
      setSessionId(newId)
      setSessionActive(true)
      setLoading(false)
      
      // Start recording after session is active
      // Audio recording is now started automatically by ElevenLabsConversation onConnect
      if (newId) {
        console.log('✅ Session created with ID:', newId)
      } else {
        console.warn('⚠️ No session ID returned')
      }

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      window.dispatchEvent(new CustomEvent('trainer:start-conversation', {
        detail: {
          agentId: selectedAgent.eleven_agent_id,
          conversationToken: result.conversationToken,
        },
      }))
      
      console.log('✅ Session started successfully')
    } catch (error: any) {
      console.error('❌ Error starting session:', error)
      console.error('Error details:', {
        message: error?.message,
        agent: selectedAgent?.name,
        agentId: selectedAgent?.eleven_agent_id,
      })
      alert(`Failed to start session: ${error?.message || 'Unknown error'}. Please check console for details.`)
      setLoading(false)
      setConversationToken(null)
      setSessionActive(false)
    }
  }

  const createSessionRecord = async () => {
    try {
      const resp = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: selectedAgent?.name,
        }),
      })
      
      if (!resp.ok) {
        throw new Error('Failed to create session')
      }
      
      const json = await resp.json()
      console.log('✅ Session created:', json.id)
      return json.id
    } catch (error: any) {
      console.error('❌ Error creating session:', error)
      return null
    }
  }

  const endSession = useCallback(async () => {
    console.log('🛑 endSession() called')
    setLoading(true)
    setSessionActive(false)
    setConversationToken(null)

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }

    try {
      // Audio recording is now stopped automatically by ElevenLabsConversation onDisconnect
      // No need to manually stop here

      if (signedUrlAbortRef.current) {
        signedUrlAbortRef.current.abort()
        signedUrlAbortRef.current = null
      }

      if (sessionId) {
        console.log('🛑 Ending session:', sessionId)
        console.log('📊 Transcript to save:', transcript.length, 'lines')
        console.log('📊 Transcript content:', transcript)
        
        // Save session with transcript
        try {
          const response = await fetch('/api/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: sessionId,
              transcript: transcript,
              duration_seconds: duration
            }),
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Session PATCH succeeded:', result)
          } else {
            const error = await response.text()
            console.error('❌ Session PATCH failed:', response.status, error)
          }
        } catch (error) {
          console.error('❌ PATCH request error:', error)
        }
        
        console.log('🔄 Redirecting to analytics page...')
        
        // Redirect to the loading screen which will handle grading polling
        // Keep loading=true to prevent UI flash during navigation
        router.push(`/trainer/loading/${sessionId}`)
      } else {
        console.warn('⚠️ No session ID')
        router.push('/trainer')
        setLoading(false)
      }
    } catch (e) {
      console.error('❌ Error in endSession:', e)
      setLoading(false)
    }
  }, [sessionId, duration, transcript, selectedAgent, homeownerName, stopRecording])

  // Separate effect to handle end-session requests (MUST be after endSession declaration)
  useEffect(() => {
    const handleEndSessionRequest = () => {
      console.log('🛑 trainer:end-session-requested event received!')
      console.log('🛑 sessionActive:', sessionActive)
      console.log('🛑 sessionId:', sessionId)
      console.log('🛑 transcript length:', transcript.length)
      
      if (sessionActive) {
        console.log('✅ Conditions met, calling endSession()...')
        endSession()
      } else {
        console.warn('⚠️ Session not active, skipping endSession()')
      }
    }

    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    return () => {
      window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
    }
  }, [sessionActive, sessionId, transcript, endSession])

  const handleCalculationComplete = () => {
    // Not used anymore - direct redirect in endSession
  }

  const handleMoneyNotificationComplete = () => {
    setShowMoneyNotification(false)
    setCalculatingScore(true)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Removed intermediate screens - direct to results

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Training Session</h1>
            <div className="flex items-center gap-3">
              <p className="text-slate-400">
                {sessionActive ? `Speaking with ${homeownerName || 'Agent'}` : 'Ready to start'}
              </p>
              {sessionActive && (
                <button
                  onClick={() => {
                    if (connectionStatus === 'error' || !micPermissionGranted) {
                      retryMicrophoneAccess()
                    }
                  }}
                  title={!micPermissionGranted ? 'Microphone not allowed. Click to re-request permission.' : connectionStatus === 'error' ? 'Connection error. Click to retry microphone permission.' : 'Connection status'}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                >
                  <span className={`relative flex h-2 w-2 ${
                    connectionStatus === 'connected' ? 'animate-none' : 
                    connectionStatus === 'connecting' ? 'animate-pulse' : ''
                  }`}>
                    <span className={`absolute inline-flex h-full w-full rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-400 opacity-75 animate-ping' :
                      connectionStatus === 'connecting' ? 'bg-yellow-400 opacity-75' :
                      connectionStatus === 'error' ? 'bg-red-400 opacity-75' :
                      'bg-gray-400 opacity-75'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500' :
                      connectionStatus === 'error' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     connectionStatus === 'error' ? (!micPermissionGranted ? 'Mic Blocked — Click to Fix' : 'Connection Error — Click to Retry') :
                     'Disconnected'}
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Timer */}
            {sessionActive && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl px-6 py-3 border border-slate-700/50">
                <div className="text-sm text-slate-400 mb-1">Duration</div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums">{formatDuration(duration)}</div>
              </div>
            )}
            {/* End Session Button */}
            {sessionActive && (
              <button
                onClick={endSession}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? 'Ending...' : 'End Session'}
              </button>
            )}
          </div>
        </div>

        {/* Silence Warning Banner */}
        {showSilenceWarning && sessionActive && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-full">
                  <AlertCircle className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Austin seems quiet</h3>
                  <p className="text-slate-300 text-sm">No response for 30+ seconds. Try reconnecting or end the session.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isReconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reconnect
                    </>
                  )}
                </button>
                <button
                  onClick={endSession}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium rounded-lg transition-all"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-start pt-6">
          {/* Start Button - neutral, hidden once starting */}
          {!sessionActive && !loading && (
            <div className="mb-4">
              <button
                onClick={startSession}
                disabled={loading || !selectedAgent}
                className={`
                  inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold
                  transition-all duration-150 shadow-lg border
                  ${!selectedAgent
                    ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                    : 'bg-white/10 text-white border-white/15 backdrop-blur-sm hover:bg-white/15'
                  }
                `}
              >
                {selectedAgent ? `Knock on ${selectedAgent.name}'s Door` : 'Select a Homeowner First'}
              </button>
            </div>
          )}

          {/* Floating Bubble Container */}
          <div className="relative mb-16">
            <div id="conversation-orb-container">
              <button 
                id="conversation-orb" 
                onClick={sessionActive ? endSession : startSession}
                disabled={loading}
                aria-label={sessionActive ? "Stop conversation" : "Start conversation"}
                className={`relative ${sessionActive ? 'active' : ''}`}
              >
                {/* Concentric animated circles */}
                <div id="orb-circle-0" className="orb-circle"></div>
                <div id="orb-circle-1" className="orb-circle"></div>
                <div id="orb-circle-2" className="orb-circle"></div>
              </button>
              {/* Removed non-functional status button/text */}
            </div>

            {/* ElevenLabs SDK Component */}
            {sessionActive && conversationToken !== null && selectedAgent?.eleven_agent_id && (
              <ElevenLabsConversation 
                agentId={selectedAgent.eleven_agent_id} 
                conversationToken={conversationToken} 
                sessionId={sessionId}
                autostart 
              />
            )}

            <style jsx global>{`
              #conversation-orb-container {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              
              #conversation-orb {
                width: 320px;
                height: 320px;
                border: 0;
                outline: none;
                cursor: pointer;
                background: transparent;
                position: relative;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              
              #conversation-orb:hover { 
                transform: scale(1.05);
              }
              
              #conversation-orb:active { 
                transform: scale(0.97);
              }

              #conversation-orb:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
              
              /* Concentric circle layers */
              .orb-circle {
                position: absolute;
                inset: 0;
                border-radius: 9999px;
                border: 2px solid;
                background: linear-gradient(135deg, ${orbColors.idle.start}30 0%, transparent 100%);
                pointer-events: none;
              }
              
              #orb-circle-0 {
                border-color: ${orbColors.idle.start}60;
                animation: rotate-scale-0 5s ease-in-out infinite;
              }
              
              #orb-circle-1 {
                border-color: ${orbColors.idle.mid}50;
                animation: rotate-scale-1 5s ease-in-out infinite;
              }
              
              #orb-circle-2 {
                border-color: ${orbColors.idle.end}30;
                animation: rotate-scale-2 5s ease-in-out infinite;
              }
              
              /* Active state - brighter, faster animation */
              #conversation-orb.active .orb-circle {
                background: linear-gradient(135deg, ${orbColors.active.start}40 0%, transparent 100%);
              }
              
              #conversation-orb.active #orb-circle-0 {
                border-color: ${orbColors.active.start}80;
                animation: rotate-scale-0-active 3s ease-in-out infinite;
              }
              
              #conversation-orb.active #orb-circle-1 {
                border-color: ${orbColors.active.mid}70;
                animation: rotate-scale-1-active 3s ease-in-out infinite;
              }
              
              #conversation-orb.active #orb-circle-2 {
                border-color: ${orbColors.active.end}50;
                animation: rotate-scale-2-active 3s ease-in-out infinite;
              }
              
              /* Rotation and scale animations - idle state */
              @keyframes rotate-scale-0 {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: rotate(360deg) scale(1.05);
                  opacity: 1;
                }
              }
              
              @keyframes rotate-scale-1 {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: rotate(360deg) scale(1.1);
                  opacity: 1;
                }
              }
              
              @keyframes rotate-scale-2 {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: rotate(360deg) scale(1.15);
                  opacity: 1;
                }
              }
              
              /* Rotation and scale animations - active state (faster) */
              @keyframes rotate-scale-0-active {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.9;
                }
                50% {
                  transform: rotate(360deg) scale(1.08);
                  opacity: 1;
                }
              }
              
              @keyframes rotate-scale-1-active {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.9;
                }
                50% {
                  transform: rotate(360deg) scale(1.13);
                  opacity: 1;
                }
              }
              
              @keyframes rotate-scale-2-active {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 0.9;
                }
                50% {
                  transform: rotate(360deg) scale(1.18);
                  opacity: 1;
                }
              }
              
              #orb-status {
                font: 600 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                color: #cbd5e1;
                user-select: none;
                text-align: center;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(8px);
                padding: 12px 28px;
                border-radius: 12px;
                border: 1px solid rgba(148, 163, 184, 0.2);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              }
              
              /* Fade in animation for transcript */
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fadeIn {
                animation: fadeIn 0.3s ease-out;
              }
            `}</style>
          </div>

          {/* Live Transcript */}
          <div className="w-full max-w-4xl">
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-700/50 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Live Transcript — {selectedAgent?.name || 'Homeowner'}
                </h2>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {transcript.length === 0 && !deltaText ? (
                    <div className="text-center py-12">
                      <div className="text-slate-500 mb-2 text-4xl">💬</div>
                      <p className="text-slate-400">Start the conversation to see the transcript...</p>
                    </div>
                  ) : (
                    <>
                      {/* Finalized Lines */}
                      {transcript.map((entry) => {
                        const isUser = entry.speaker === 'user'
                        
                        return (
                          <div
                            key={entry.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                          >
                            <div
                              className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-lg transition-all duration-200 ${
                                isUser
                                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                                  : 'bg-slate-700/50 text-slate-100 border border-slate-600/50 backdrop-blur-sm'
                              }`}
                            >
                              {!isUser && (
                                <div className="text-xs font-semibold text-indigo-300 mb-1.5">
                                  {homeownerName || 'Agent'}
                                </div>
                              )}
                              {isUser && (
                                <div className="text-xs font-semibold text-indigo-200 mb-1.5">
                                  You
                                </div>
                              )}
                              <div className="text-sm leading-relaxed">{entry.text}</div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Delta (Interim) Text */}
                      {deltaText && (
                        <div className="flex justify-start animate-pulse">
                          <div className="max-w-[80%] px-5 py-3 rounded-2xl shadow-lg bg-slate-700/30 text-slate-300 border border-slate-600/30 backdrop-blur-sm">
                            <div className="text-xs font-semibold text-indigo-300 mb-1.5">
                              {homeownerName || 'Agent'}
                            </div>
                            <span className="text-sm italic opacity-75">{deltaText}...</span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={transcriptEndRef} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrainerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading session...</p>
        </div>
      </div>
    }>
      <TrainerPageContent />
    </Suspense>
  )
}