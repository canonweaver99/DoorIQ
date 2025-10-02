'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import CalculatingScore from '@/components/analytics/CalculatingScore'
import MoneyNotification from '@/components/trainer/MoneyNotification'
import { useSessionRecording } from '@/hooks/useSessionRecording'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

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
  'Tiger Tom': {
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
  'Tiger Tony': {
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
  'Sheep Shelley': {
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
  'Sheep Sam': {
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
  'Sheep Sandy': {
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
  'Bull Brad': {
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
  'Bull Barry': {
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
  'Bull Brenda': {
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
  'Owl Olivia': {
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
  'Owl Oscar': {
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

  const orbColors = getOrbColors(selectedAgent?.name)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Audio recording hook
  const { isRecording, startRecording, stopRecording } = useSessionRecording(sessionId)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  
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

  const setDelta = (text: string, speaker: 'user' | 'homeowner' = 'homeowner') => {
    setDeltaText(text || '')
  }

  const pushFinal = async (
    text: string,
    speaker: 'user' | 'homeowner' = 'homeowner',
  ) => {
    if (!text?.trim()) return

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date(),
    }
    setTranscript(prev => [...prev, entry])

    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Listen for ElevenLabs conversation events
  useEffect(() => {
    const handleMessage = (event: any) => {
      try {
        const msg = event?.detail

        if (msg?.type === 'transcript.delta') {
          setDelta(msg.text || '', 'homeowner')
        } else if (msg?.type === 'transcript.final') {
          pushFinal(msg.text || '', 'homeowner')
        } else if (msg?.type === 'user_transcript') {
          pushFinal(msg.user_transcript || msg.text || '', 'user')
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
          }
        }
      } catch (e) {
        console.error('Error processing transcript message:', e)
      }
    }

    const handleUserEvent = (e: any) => {
      if (e?.detail) pushFinal(e.detail, 'user')
    }

    const handleAgentEvent = (e: any) => {
      if (e?.detail) pushFinal(e.detail, 'homeowner')
    }

    const handleConnectionStatus = (e: any) => {
      if (e?.detail) {
        setConnectionStatus(e.detail)
        console.log('🔌 Connection status updated:', e.detail)
      }
    }

    window.addEventListener('agent:message', handleMessage)
    window.addEventListener('agent:user', handleUserEvent)
    window.addEventListener('agent:response', handleAgentEvent)
    window.addEventListener('connection:status', handleConnectionStatus)

    ;(window as any).startSessionRecording = () => {
      startRecording()
    }
    ;(window as any).stopSessionRecording = () => {
      stopRecording()
    }

    return () => {
      window.removeEventListener('agent:message', handleMessage)
      window.removeEventListener('agent:user', handleUserEvent)
      window.removeEventListener('agent:response', handleAgentEvent)
      window.removeEventListener('connection:status', handleConnectionStatus)
      delete (window as any).startSessionRecording
      delete (window as any).stopSessionRecording
    }
  }, [])

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
        const match = agents?.find((agent: Agent) => agent.eleven_agent_id === agentParam)
        setSelectedAgent(match || agents?.[0] || null)
        if (match && !homeownerName) {
          setHomeownerName(match.name)
        }
      } else {
        const defaultAgent = agents?.[0]
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

      console.log('🎬 Starting training session...')
      console.log('Selected agent:', selectedAgent.name, selectedAgent.eleven_agent_id)

      console.log('🔑 Fetching WebRTC conversation token from ElevenLabs...')
      const result = await fetchConversationToken(selectedAgent.eleven_agent_id)
      
      if (!result.canProceed) {
        throw new Error(result.error || 'Failed to initialize connection')
      }
      
      if (result.conversationToken) {
        console.log('✅ Conversation token received')
        setConversationToken(result.conversationToken)
      } else {
        throw new Error('No conversation token received')
      }
      
      console.log('📝 Creating session record...')
      const newId = await createSessionRecord()
      setSessionId(newId)
      setSessionActive(true)
      setLoading(false)

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
      const payload: any = {
        user_id: user?.id || null,
        agent_id: selectedAgent?.id || null,
        scenario_type: 'standard',
        agent_name: selectedAgent?.name || null,
        agent_persona: selectedAgent?.persona || null,
        conversation_metadata: {
          homeowner_agent_id: selectedAgent?.eleven_agent_id || null,
          homeowner_name: selectedAgent?.name || null,
        },
      }
      const { data: session, error } = await (supabase as any)
        .from('live_sessions')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return (session as any).id
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  const endSession = async () => {
    setLoading(true)
    setSessionActive(false)
    setConversationToken(null)

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }

    try {
      try { (window as any).stopConversation?.() } catch {}
      stopRecording()

      if (signedUrlAbortRef.current) {
        signedUrlAbortRef.current.abort()
        signedUrlAbortRef.current = null
      }

      if (sessionId) {
        await (supabase as any)
          .from('live_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
            full_transcript: transcript as any,
            analytics: {
              conversation_id: (window as any)?.elevenConversationId || null,
              homeowner_name: selectedAgent?.name || homeownerName,
              homeowner_profile: selectedAgent?.persona || 'Standard homeowner persona',
              homeowner_agent_id: selectedAgent?.eleven_agent_id || null,
            },
          } as any)
          .eq('id', sessionId as string)

        try {
          if (transcript.length > 0) {
            await fetch('/api/grade/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            })
          }
        } catch (e) {
          console.error('AI grading failed:', e)
        }

        await fetch('/api/notifications/session-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }).catch((e) => {
          console.error('Manager notification failed:', e)
        })
      }

      setCalculatingScore(true)
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  const handleCalculationComplete = () => {
    if (sessionId) {
      router.push(`/trainer/analytics/${encodeURIComponent(sessionId as string)}`)
    } else {
      router.push('/feedback')
    }
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

  // Show money notification when deal is closed
  if (showMoneyNotification) {
    return (
      <MoneyNotification 
        amount={earningsAmount}
        show={showMoneyNotification}
        onComplete={handleMoneyNotificationComplete}
      />
    )
  }

  // Show calculating score screen after session ends
  if (calculatingScore) {
    return (
      <CalculatingScore 
        sessionId={sessionId || 'unknown'}
        onComplete={handleCalculationComplete}
      />
    )
  }

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
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
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
                     connectionStatus === 'error' ? 'Connection Error' :
                     'Disconnected'}
                  </span>
                </div>
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-start pt-12">
          {/* Floating Bubble Container */}
          <div className="relative mb-16">
            <div id="conversation-orb-container">
              <button 
                id="conversation-orb" 
                onClick={sessionActive ? endSession : startSession}
                disabled={loading}
                aria-label={sessionActive ? "Stop conversation" : "Start conversation"}
                className="relative"
              >
                {/* Concentric animated circles */}
                <div id="orb-circle-0" className="orb-circle"></div>
                <div id="orb-circle-1" className="orb-circle"></div>
                <div id="orb-circle-2" className="orb-circle"></div>
              </button>
              <div id="orb-status">{sessionActive ? 'Tap to stop' : 'Tap to start'}</div>
            </div>

            {/* ElevenLabs SDK Component */}
            {sessionActive && conversationToken !== null && selectedAgent?.eleven_agent_id && (
              <ElevenLabsConversation agentId={selectedAgent.eleven_agent_id} conversationToken={conversationToken} autostart />
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
                box-shadow: 
                  0 0 60px ${orbColors.idle.shadow},
                  inset 0 0 40px ${orbColors.idle.start}10;
              }
              
              #orb-circle-1 {
                border-color: ${orbColors.idle.mid}50;
                animation: rotate-scale-1 5s ease-in-out infinite;
                box-shadow: inset 0 0 30px ${orbColors.idle.mid}10;
              }
              
              #orb-circle-2 {
                border-color: ${orbColors.idle.end}30;
                animation: rotate-scale-2 5s ease-in-out infinite;
                box-shadow: inset 0 0 20px ${orbColors.idle.end}10;
              }
              
              /* Inner glow effect */
              .orb-circle::before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: 9999px;
                background: radial-gradient(ellipse at center, ${orbColors.idle.start}10 0%, transparent 70%);
                mix-blend-mode: screen;
              }
              
              /* Active state - brighter, faster animation */
              #conversation-orb.active .orb-circle {
                background: linear-gradient(135deg, ${orbColors.active.start}40 0%, transparent 100%);
              }
              
              #conversation-orb.active #orb-circle-0 {
                border-color: ${orbColors.active.start}80;
                animation: rotate-scale-0-active 3s ease-in-out infinite;
                box-shadow: 
                  0 0 80px ${orbColors.active.shadow},
                  0 0 0 8px ${orbColors.active.ring1},
                  0 0 0 16px ${orbColors.active.ring2},
                  inset 0 0 60px ${orbColors.active.start}20;
              }
              
              #conversation-orb.active #orb-circle-1 {
                border-color: ${orbColors.active.mid}70;
                animation: rotate-scale-1-active 3s ease-in-out infinite;
                box-shadow: inset 0 0 40px ${orbColors.active.mid}20;
              }
              
              #conversation-orb.active #orb-circle-2 {
                border-color: ${orbColors.active.end}50;
                animation: rotate-scale-2-active 3s ease-in-out infinite;
                box-shadow: inset 0 0 30px ${orbColors.active.end}20;
              }
              
              #conversation-orb.active .orb-circle::before {
                background: radial-gradient(ellipse at center, ${orbColors.active.start}20 0%, transparent 70%);
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