'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { Clock, Volume2, VolumeX } from 'lucide-react'
import { ConversationStatus } from '@/components/trainer/ConversationStatus'
import { SessionMetrics, TranscriptEntry } from '@/lib/trainer/types'
import { analyzeConversation } from '@/lib/trainer/conversationAnalyzer'
import CalculatingScore from '@/components/analytics/CalculatingScore'
import MoneyNotification from '@/components/trainer/MoneyNotification'
import { useSessionRecording } from '@/hooks/useSessionRecording'
import { useAmbientAudio } from '@/hooks/useAmbientAudio'

const BASE_TIPS = [
  'Smile before you knock - it comes through in your voice!',
  'Build rapport before discussing business',
  "Ask about pest problems they've experienced",
  'Mention safety for pets and children',
  'Create urgency with seasonal offers',
  'Listen for buying signals disguised as objections',
  'Use assumptive closing techniques',
  'Address safety concerns early in the conversation',
  'Find common ground with the homeowner',
  'Ask follow-up questions to understand their needs',
  'Explain why DIY solutions have limitations',
  'Mention local pest patterns in their area',
  'Create value before discussing price',
  'Handle objections with empathy and expertise',
]

export default function TrainerPage() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [deltaText, setDeltaText] = useState<string>('')
  const [finalizedLines, setFinalizedLines] = useState<string[]>([])
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [metrics, setMetrics] = useState<SessionMetrics>({
    duration: 0,
    sentimentScore: 50,
    interruptionCount: 0,
    objectionCount: 0,
    keyMomentFlags: {
      priceDiscussed: false,
      safetyAddressed: false,
      closeAttempted: false,
    }
  })
  const [loading, setLoading] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [preparingSession, setPreparingSession] = useState(true)
  const [calculatingScore, setCalculatingScore] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [showMoneyNotification, setShowMoneyNotification] = useState(false)
  const [earningsAmount, setEarningsAmount] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Audio recording hook
  const { isRecording, startRecording, stopRecording } = useSessionRecording(sessionId)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  
  // Ambient audio system - adds realistic background sounds
  const [ambientState, ambientControls] = useAmbientAudio({
    assets: {
      ambience: {
        suburban: '/sounds/kids-background.mp3',
        suburban2: '/sounds/kids-background-2.mp3'
      },
      sfx: {
        doorKnock: '/sounds/knock.mp3',
        doorOpen: '/sounds/door_open.mp3',
        doorOpen2: '/sounds/door-open-2.mp3',
        dogBark1: '/sounds/dog-bark-distant-1.mp3',
        dogBark2: '/sounds/dog-bark-2.mp3',
        doorClose: '/sounds/door_close.mp3',
        doorSlam: '/sounds/door_slam.mp3'
      }
    },
    levels: {
      ambience: 0.10,  // Very subtle background
      sfx: 0.30,        // Moderate sound effects
      voice: 1.0        // Full voice volume
    },
    scheduling: {
      enabled: true,
      assetKeys: ['dogBark1', 'dogBark2'], // Randomly play dog barks during conversation
      baseInterval: [20, 50] // Random dog bark every 20-50 seconds
    },
    integration: {
      enableElevenLabs: true,
      autoConnect: sessionActive // Connect when session starts
    }
  })

  // Shuffle tips once per load
  const shuffledTips = useMemo(() => {
    const arr = [...BASE_TIPS]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  // Request mic permission while the Preparing screen is visible
  useEffect(() => {
    if (!preparingSession || micPermissionGranted) return
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStream.current = stream
        setMicPermissionGranted(true)
      } catch (_) {
        // leave as not granted; user can accept later
      }
    })()
  }, [preparingSession, micPermissionGranted])

  // Auto-rotate tips during preparation phase
  useEffect(() => {
    if (!preparingSession) return

    const tipRotationInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % shuffledTips.length)
    }, 3000) // Rotate every 3 seconds

    // Auto-start session after 12 seconds (4 tips shown)
    const autoStartTimer = setTimeout(() => {
      setPreparingSession(false)
      setTimeout(() => initializeSession(), 500)
    }, 12000)

    return () => {
      clearInterval(tipRotationInterval)
      clearTimeout(autoStartTimer)
    }
  }, [preparingSession, shuffledTips.length])

  useEffect(() => {
    fetchUser()
    
    // Auto-start if coming from pre-session - skip preparation phase
    if (searchParams.get('autostart') === 'true') {
      setPreparingSession(false)
      setTimeout(() => initializeSession(), 500)
    }
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // Manage ambient audio during session
  useEffect(() => {
    if (sessionActive && ambientState.isInitialized) {
      console.log('🎵 Starting ambient audio for session')
      
      // Start background ambience
      const randomAmbience = Math.random() > 0.5 ? 'suburban' : 'suburban2'
      ambientControls.startAmbience(randomAmbience)
      
      // Start random SFX scheduler (dog barks)
      ambientControls.startScheduler()
      
      // Play door knock and open sounds at start
      setTimeout(async () => {
        await ambientControls.playSfx('doorKnock', 0.4)
        setTimeout(async () => {
          await ambientControls.playSfx('doorOpen', 0.3)
        }, 1200)
      }, 500)
      
    } else if (!sessionActive && ambientState.isInitialized) {
      console.log('🔇 Stopping ambient audio')
      ambientControls.stopAmbience()
      ambientControls.stopScheduler()
    }
  }, [sessionActive, ambientState.isInitialized, ambientControls])

  // Handle delta (interim) transcript updates
  const setDelta = (text: string, speaker: 'user' | 'austin' = 'austin') => {
    setDeltaText(text || '')
    console.log(`🔄 Delta (${speaker}):`, text)
  }

  // Push finalized transcript line (with optional typing for Austin)
  const pushFinal = async (text: string, speaker: 'user' | 'austin' = 'austin') => {
    if (!text?.trim()) return

    // If Austin is speaking, simulate a simple typing animation in the delta line
    if (speaker === 'austin') {
      try {
        const full = text.trim()
        let i = 0
        const perCharMs = 18
        await new Promise<void>((resolve) => {
          const iv = setInterval(() => {
            i++
            setDelta(full.slice(0, i), 'austin')
            if (i >= full.length) {
              clearInterval(iv)
              resolve()
            }
          }, perCharMs)
        })
        // Clear delta once typed out
        setDeltaText('')
      } catch {}
    }

    const finalText = `${speaker === 'user' ? 'You' : 'Austin'}: ${text.trim()}`
    setFinalizedLines(prev => {
      const newLines = [...prev, finalText]
      return newLines.length > 100 ? newLines.slice(-100) : newLines
    })

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date()
    }
    setTranscript(prev => [...prev, entry])

    console.log(`✅ Final (${speaker}):`, text)
    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Listen for ElevenLabs conversation events
  useEffect(() => {
    console.log('🔌 Setting up transcript event listeners')
    
    const handleMessage = (event: any) => {
      try {
        const msg = event?.detail
        console.log('📨 Processing message for transcript:', msg)
        
        // Handle different message types
        if (msg?.type === 'transcript.delta') {
          console.log('🔄 Setting delta text:', msg.text)
          setDelta(msg.text || '', msg.speaker || 'austin')
        } else if (msg?.type === 'transcript.final') {
          console.log('✅ Finalizing text:', msg.text)
          pushFinal(msg.text || '', msg.speaker || 'austin')
        } else if (msg?.type === 'user_transcript') {
          console.log('👤 User transcript:', msg.user_transcript || msg.text)
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
            console.log('🤖 Agent response:', text)
            pushFinal(text, 'austin')
          }
        } else if (msg?.type === 'conversation_updated') {
          // Handle conversation updates
          const messages = msg?.conversation?.messages || []
          console.log('💬 Conversation updated, messages:', messages)
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1]
            if (lastMsg?.role === 'user' && lastMsg?.content) {
              console.log('👤 User from conversation_updated:', lastMsg.content)
              pushFinal(lastMsg.content, 'user')
            } else if (lastMsg?.role === 'assistant' && lastMsg?.content) {
              console.log('🤖 Austin from conversation_updated:', lastMsg.content)
              pushFinal(lastMsg.content, 'austin')
            }
          }
        } else if (typeof msg?.message === 'string') {
          // Fallback shape seen in console: { source: 'user'|'a', message: '...' }
          const speaker = msg?.source === 'user' ? 'user' : 'austin'
          console.log('🧩 Fallback message shape → final:', { speaker, text: msg.message })
          pushFinal(msg.message, speaker)
        } else {
          console.log('❓ Unknown message type:', msg?.type)
        }
      } catch (e) {
        console.error('Error processing transcript message:', e)
      }
    }

    const handleUserEvent = (e: any) => {
      console.log('👤 Direct user event:', e?.detail)
      if (e?.detail) pushFinal(e.detail, 'user')
    }

    const handleAgentEvent = (e: any) => {
      console.log('🤖 Direct agent event:', e?.detail)
      if (e?.detail) pushFinal(e.detail, 'austin')
    }

    // Listen for custom events from ElevenLabs script
    window.addEventListener('austin:message', handleMessage)
    window.addEventListener('austin:user', handleUserEvent)
    window.addEventListener('austin:agent', handleAgentEvent)
    
    // Expose recording functions to window for Austin integration
    ;(window as any).startSessionRecording = () => {
      console.log('🎙️ Starting recording from Austin')
      startRecording()
    }
    ;(window as any).stopSessionRecording = () => {
      console.log('🛑 Stopping recording from Austin')
      stopRecording()
    }

    return () => {
      console.log('🔌 Removing transcript event listeners')
      window.removeEventListener('austin:message', handleMessage)
      window.removeEventListener('austin:user', handleUserEvent)
      window.removeEventListener('austin:agent', handleAgentEvent)
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

  const initializeSession = async () => {
    try {
      // Request microphone permission early for smoother widget experience
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStream.current = stream
        setMicPermissionGranted(true)
      } catch {}

      // Create session record and show conversation UI (metrics timer)
      const newId = await createSessionRecord()
      setSessionId(newId)
      setSessionActive(true)
      durationInterval.current = setInterval(() => {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  }

  const createSessionRecord = async () => {
    try {
      // Always create a session record, even if user is not logged in
      const payload: any = {
        user_id: user?.id || null,
        scenario_type: 'standard',
      }
      const { data: session, error } = await (supabase as any)
        .from('training_sessions')
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
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }

    try {
      // Stop Austin conversation if running
      try { (window as any).stopAustin?.() } catch {}
      
      // Stop recording
      stopRecording()
      
      // Analyze the conversation with transcript
      const analysis = transcript.length > 0 ? analyzeConversation(transcript) : {
        overallScore: 75,
        scores: {
          rapport: 70,
          introduction: 80,
          listening: 75,
          salesTechnique: 70,
          closing: 75
        },
        keyMoments: {
          priceDiscussed: false,
          safetyAddressed: true,
          closeAttempted: true,
          objectionHandled: false,
          dealClosed: false
        },
        feedback: {
          strengths: [],
          improvements: [],
          specificTips: []
        },
        transcriptSections: {
          introduction: { startIdx: 0, endIdx: -1 },
          discovery: { startIdx: -1, endIdx: -1 },
          presentation: { startIdx: -1, endIdx: -1 },
          closing: { startIdx: -1, endIdx: -1 }
        },
        virtualEarnings: 0
      }

      // Check if deal was closed and show money notification first
      const hasEarnings = analysis.virtualEarnings && analysis.virtualEarnings > 0
      if (hasEarnings) {
        setEarningsAmount(analysis.virtualEarnings)
        setShowMoneyNotification(true)
        setLoading(false) // Remove loading state
        // Don't show calculating screen yet - wait for money notification to complete
      } else {
        // Show calculating screen immediately if no earnings
        setCalculatingScore(true)
        setLoading(false) // Remove loading state so calculating screen shows
      }

      if (sessionId) {
        await (supabase as any)
          .from('training_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: metrics.duration,
            overall_score: analysis.overallScore,
            rapport_score: analysis.scores.rapport,
            introduction_score: analysis.scores.introduction,
            listening_score: analysis.scores.listening,
            objection_handling_score: analysis.keyMoments?.objectionHandled ? 85 : 40,
            safety_score: analysis.keyMoments?.safetyAddressed ? 85 : 40,
            close_effectiveness_score: analysis.scores.closing,
            transcript: transcript,
            analytics: analysis,
            sentiment_data: {
              finalSentiment: metrics.sentimentScore,
              interruptionCount: metrics.interruptionCount,
              objectionCount: metrics.objectionCount
            },
            virtual_earnings: analysis.virtualEarnings || 0
          } as any)
          .eq('id', sessionId as string)

        // Trigger AI grading in background while calculating screen shows
        try {
          if (transcript.length > 0) {
            await fetch('/api/grade/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            })
          }
        } catch (e) {
          console.error('AI grading after session failed (will still redirect):', e)
        }
        
        // Send notifications to managers
        try {
          await fetch('/api/notifications/session-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          })
        } catch (e) {
          console.error('Manager notification failed:', e)
        }
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  const handleCalculationComplete = () => {
    if (sessionId) {
      router.push(`/trainer/analytics/${encodeURIComponent(sessionId as string)}`)
    } else {
      const durationStr = formatDuration(metrics.duration)
      router.push(`/feedback?duration=${encodeURIComponent(durationStr)}`)
    }
  }

  const handleMoneyNotificationComplete = () => {
    setShowMoneyNotification(false)
    setCalculatingScore(true) // Now show the calculating screen
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show preparation phase with rotating tips
  if (preparingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-100 mb-4">
                Ready to Practice?
              </h1>
              <p className="text-xl text-slate-300">
                You&apos;ll be speaking with Austin, a skeptical suburban homeowner who needs pest control services.
              </p>
            </div>

            <div className="bg-gradient-to-r from-slate-700/50 to-slate-700/30 rounded-lg p-8 mb-8 min-h-[200px] flex items-center justify-center border border-slate-600/50">
              <div className="text-center max-w-2xl">
                <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                  💡 Coaching Tip
                </h2>
                <div className="bg-slate-700 rounded-lg p-6 shadow-lg border border-slate-600">
                  <p className="text-lg text-slate-200 leading-relaxed">
                    {shuffledTips[currentTipIndex]}
                  </p>
                </div>
                <div className="flex justify-center mt-6 space-x-2">
                  {shuffledTips.slice(0, 4).map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        index === currentTipIndex % 4 ? 'bg-blue-500' : 'bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Preparing your session...
              </div>
              <p className="text-sm text-slate-400 mt-4">
                Starting automatically in a few seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show money notification when deal is closed
  if (showMoneyNotification) {
    return (
      <>
        <MoneyNotification 
          amount={earningsAmount}
          show={showMoneyNotification}
          onComplete={handleMoneyNotificationComplete}
        />
        {/* Keep the main interface in background */}
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Session Complete</h1>
              <p className="text-slate-400">Processing your results...</p>
            </div>
          </div>
        </div>
      </>
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

  // When not preparing and session is not yet active, immediately initialize
  if (!preparingSession && !sessionActive) {
    initializeSession()
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex h-screen">
        {/* Left Panel - ElevenLabs Agent */}
        <div className="w-2/5 bg-slate-800 border-r border-slate-700 flex flex-col relative">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Austin Rodriguez</h2>
                <p className="text-sm opacity-90">Suburban Homeowner</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 relative overflow-hidden">
            {/* Austin's Door Interface */}
            <div id="austin-door-container">
              <div id="austin-door" aria-label="Knock on Austin's door">
                <div id="door-frame"></div>
                <div id="door-panel"></div>
                <div id="door-handle"></div>
                <div id="door-knocker">🚪</div>
              </div>
              <button id="austin-orb" aria-label="Talk to Austin"></button>
            </div>
            <div id="austin-status">knock on door</div>

            <Script id="austin-orb-client" type="module" strategy="afterInteractive">
              {`
                import { Conversation } from 'https://esm.sh/@elevenlabs/client';
                const AGENT_ID = 'agent_7001k5jqfjmtejvs77jvhjf254tz';

                const orb = document.getElementById('austin-orb');
                const door = document.getElementById('austin-door');
                const doorContainer = document.getElementById('austin-door-container');
                const statusEl = document.getElementById('austin-status');

                let convo = null;
                let isStarting = false;
                let state = { status: 'disconnected', mode: 'idle', doorOpen: false };

                function render() {
                  const { status, mode, doorOpen } = state;
                  const active = status === 'connected' || status === 'connecting';
                  
                  // Door state management
                  if (doorOpen) {
                    door.classList.add('open');
                    orb.style.display = 'block';
                    setTimeout(() => {
                      orb.classList.add('visible');
                    }, 100);
                  } else {
                    door.classList.remove('open');
                    orb.classList.remove('visible');
                    setTimeout(() => {
                      if (!state.doorOpen) orb.style.display = 'none';
                    }, 400);
                  }
                  
                  // Orb active state
                  if (active) orb.classList.add('active'); else orb.classList.remove('active');
                  
                  // Status text
                  statusEl.textContent = doorOpen ?
                    (status === 'connecting' ? 'connecting to Austin…' :
                     status === 'connected' ? (mode === 'speaking' ? 'Austin is speaking' : 'Austin is listening') :
                     'tap orb to end conversation') :
                    'knock on door to start';
                }

                async function startSession() {
                  try {
                    if (convo || isStarting || state.status === 'connected' || state.status === 'connecting') return;
                    isStarting = true;
                    
                    // Start recording if available
                    if (window.startSessionRecording) {
                      window.startSessionRecording();
                    }
                    
                    // Open door with animation
                    state.doorOpen = true;
                    state.status = 'connecting'; 
                    render();
                    
                    try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
                    convo = await Conversation.startSession({
                      agentId: AGENT_ID,
                      connectionType: 'webrtc',
                      onStatusChange: (s) => { state.status = s; render(); },
                      onModeChange:   (m) => { state.mode = m; render(); },
                      onMessage: (msg) => {
                        console.log('ElevenLabs raw message:', msg);
                        
                        // Check for conversation end signals
                        if (msg?.type === 'agent_response') {
                          const response = msg.agent_response;
                          let text = '';
                          if (typeof response === 'string') {
                            text = response;
                          } else if (response?.text) {
                            text = response.text;
                          } else if (response?.content) {
                            text = response.content;
                          }
                          
                          // Close door on rejection or successful close
                          if (text && (
                            text.toLowerCase().includes('not interested') ||
                            text.toLowerCase().includes('no thank you') ||
                            text.toLowerCase().includes('not right now') ||
                            text.toLowerCase().includes('schedule') ||
                            text.toLowerCase().includes('appointment') ||
                            text.toLowerCase().includes('see you then')
                          )) {
                            setTimeout(() => {
                              // Animate door closing
                              orb.classList.remove('visible');
                              door.style.display = 'block';
                              door.classList.add('closing');
                              setTimeout(() => {
                                state.doorOpen = false;
                                door.classList.remove('closing');
                                render();
                                setTimeout(() => stopSession(true), 500);
                              }, 800);
                            }, 2000);
                          }
                        }
                        
                        // Dispatch the raw message for transcript handling
                        window.dispatchEvent(new CustomEvent('austin:message', { detail: msg }));
                        
                        // Also handle legacy events for backward compatibility
                        try {
                          if (msg?.type === 'user_transcript') {
                            const text = msg.user_transcript || msg.text || '';
                            if (text) {
                              window.dispatchEvent(new CustomEvent('austin:user', { detail: text }));
                            }
                          } else if (msg?.type === 'agent_response') {
                            const response = msg.agent_response;
                            let text = '';
                            if (typeof response === 'string') {
                              text = response;
                            } else if (response?.text) {
                              text = response.text;
                            } else if (response?.content) {
                              text = response.content;
                            }
                            if (text) {
                              window.dispatchEvent(new CustomEvent('austin:agent', { detail: text }));
                            }
                          } else if (msg?.type === 'conversation_updated') {
                            const messages = msg?.conversation?.messages || [];
                            if (messages.length > 0) {
                              const lastMsg = messages[messages.length - 1];
                              if (lastMsg?.role === 'user' && lastMsg?.content) {
                                window.dispatchEvent(new CustomEvent('austin:user', { detail: lastMsg.content }));
                              } else if (lastMsg?.role === 'assistant' && lastMsg?.content) {
                                window.dispatchEvent(new CustomEvent('austin:agent', { detail: lastMsg.content }));
                              }
                            }
                          }
                        } catch (e) {
                          console.error('Error processing ElevenLabs message:', e);
                        }
                      },
                      onError: (err) => { console.error('ElevenLabs error:', err); stopSession(true); },
                    });
                    isStarting = false;
                  } catch (err) {
                    console.error(err);
                    state.status = 'disconnected';
                    state.mode = 'idle';
                    state.doorOpen = false;
                    render();
                    isStarting = false;
                  }
                }

                async function stopSession(silent = false) {
                  try { await convo?.endSession(); } catch {}
                  convo = null;
                  isStarting = false;
                  state.status = 'disconnected';
                  state.mode = 'idle';
                  state.doorOpen = false;
                  render();
                  
                  // Stop recording if available
                  if (window.stopSessionRecording) {
                    window.stopSessionRecording();
                  }
                }

                // Door click handler (starts conversation)
                door.addEventListener('click', () => {
                  if (!state.doorOpen) {
                    // Play knock sound
                    try {
                      const knockSound = new Audio('/sounds/knock.mp3');
                      knockSound.volume = 0.3;
                      knockSound.play();
                    } catch (e) {
                      console.log('Could not play knock sound:', e);
                    }
                    
                    // Brief delay then open door with sound
                    setTimeout(() => {
                      try {
                        const doorSound = new Audio('/sounds/door_open.mp3');
                        doorSound.volume = 0.2;
                        doorSound.play();
                      } catch (e) {
                        console.log('Could not play door sound:', e);
                      }
                      startSession();
                    }, 800);
                  }
                });

                // Orb click handler (stops conversation)
                orb.addEventListener('click', () => {
                  const isActive = state.status === 'connected' || state.status === 'connecting';
                  if (isActive) {
                    // Animate door closing
                    orb.classList.remove('visible');
                    door.style.display = 'block';
                    door.classList.add('closing');
                    setTimeout(() => {
                      state.doorOpen = false;
                      door.classList.remove('closing');
                      render();
                      setTimeout(() => stopSession(), 200);
                    }, 800);
                  }
                });

                window.stopAustin = () => {
                  if (state.doorOpen) {
                    orb.classList.remove('visible');
                    door.style.display = 'block';
                    door.classList.add('closing');
                    setTimeout(() => {
                      state.doorOpen = false;
                      door.classList.remove('closing');
                      render();
                      setTimeout(() => stopSession(true), 200);
                    }, 800);
                  } else {
                    stopSession(true);
                  }
                };

                document.addEventListener('visibilitychange', () => {
                  if (document.hidden && (state.status === 'connected' || state.status === 'connecting')) {
                    state.doorOpen = false;
                    render();
                    setTimeout(() => stopSession(true), 500);
                  }
                });

                render();
              `}
            </Script>

            <style jsx global>{`
              #austin-door-container {
                position: absolute;
                left: 50%;
                top: 35%;
                transform: translate(-50%, -50%);
                width: 240px;
                height: 320px;
                z-index: 10;
              }
              
              #austin-door {
                width: 100%;
                height: 100%;
                position: relative;
                cursor: pointer;
                transition: transform 0.3s ease;
                display: block;
              }
              
              #austin-door:hover {
                transform: scale(1.02);
              }
              
              #door-frame {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 280px;
                background: linear-gradient(145deg, #8B4513, #A0522D);
                border-radius: 12px;
                border: 4px solid #654321;
                box-shadow: 
                  0 10px 30px rgba(0,0,0,0.3),
                  inset 0 2px 8px rgba(139,69,19,0.8),
                  inset 0 -2px 8px rgba(101,67,33,0.8);
              }
              
              #door-panel {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 160px;
                height: 240px;
                background: linear-gradient(145deg, #A0522D, #CD853F);
                border-radius: 8px;
                border: 2px solid #8B4513;
                box-shadow: inset 0 2px 4px rgba(160,82,45,0.8);
              }
              
              #door-handle {
                position: absolute;
                top: 50%;
                right: 30px;
                transform: translateY(-50%);
                width: 12px;
                height: 12px;
                background: radial-gradient(circle, #FFD700, #DAA520);
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              
              #door-knocker {
                position: absolute;
                top: 35%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 32px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                animation: knock-hint 4s ease-in-out infinite;
                pointer-events: none;
              }
              
              @keyframes knock-hint {
                0%, 90%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                92%, 94% { transform: translate(-50%, -50%) scale(1.1) rotate(-5deg); }
                96% { transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
              }
              
              #austin-orb {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 200px;
                height: 200px;
                border-radius: 9999px;
                border: 0;
                outline: none;
                cursor: pointer;
                background: radial-gradient(circle at 30% 30%, #6AA8FF, #3CE2D3);
                box-shadow: 0 18px 56px rgba(20, 180, 255, 0.45);
                transition: transform .18s ease, box-shadow .18s ease, filter .18s ease, opacity .3s ease;
                animation: floaty 4.6s ease-in-out infinite;
                z-index: 15;
                display: none;
              }
              
              #austin-orb:hover { 
                transform: translate(-50%, -50%) scale(1.03); 
                filter: saturate(1.07); 
              }
              
              #austin-orb:active { 
                transform: translate(-50%, -50%) scale(0.97); 
              }
              
              #austin-orb.active {
                box-shadow: 0 18px 58px rgba(20,180,255,.55), 0 0 0 14px rgba(60,226,211,.18), 0 0 0 24px rgba(106,168,255,.12);
              }
              
              #austin-status {
                position: absolute;
                left: 50%;
                top: calc(35% + 180px);
                transform: translateX(-50%);
                font: 600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                color: #94a3b8;
                user-select: none;
                pointer-events: none;
                z-index: 10;
                opacity: .9;
                text-align: center;
              }
              
              @keyframes floaty { 
                0% { transform: translate(-50%, -50%) } 
                50% { transform: translate(-50%, calc(-50% - 7px)) } 
                100% { transform: translate(-50%, -50%) } 
              }
              
              /* Door opening animation */
              #austin-door.open {
                opacity: 0;
                transform: scale(0.8) rotateY(20deg);
                transition: opacity 0.6s ease, transform 0.6s ease;
              }
              
              /* Door panel opening effect */
              #austin-door.open #door-panel {
                transform: translateX(-50%) rotateY(-60deg);
                transition: transform 0.6s ease;
                transform-origin: left center;
              }
              
              /* Enhanced door interaction */
              #austin-door:active {
                transform: scale(0.98);
              }
              
              /* Reset orb initial state */
              #austin-orb {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
                display: none;
              }
              
              /* Orb entrance animation */
              #austin-orb.visible {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
                transition: opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s;
                animation: floaty 4.6s ease-in-out infinite 0.7s;
              }
              
              /* Door closing animation when conversation ends */
              #austin-door.closing {
                animation: door-close 0.8s ease-in-out forwards;
              }
              
              @keyframes door-close {
                0% { opacity: 1; transform: scale(0.8) rotateY(20deg); }
                100% { opacity: 1; transform: scale(1) rotateY(0deg); }
              }
            `}</style>

            {/* Live Transcript - Delta + Final */}
            <div className="absolute left-0 right-0 bottom-0 top-[60%] overflow-y-auto p-4">
              <div className="space-y-2 max-w-sm mx-auto">
                {finalizedLines.length === 0 && !deltaText ? (
                  <p className="text-slate-400 text-center text-sm">Conversation will appear here...</p>
                ) : (
                  <>
                    {/* Finalized Lines */}
                    {finalizedLines.map((line, idx) => {
                      const isUser = line.startsWith('You:')
                      const text = line.replace(/^(You|Austin): /, '')
                      
                      return (
                        <div
                          key={idx}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}
                        >
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm text-sm ${
                              isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-100 border border-slate-600'
                            }`}
                          >
                            {text}
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Delta (Interim) Text */}
                    {deltaText && (
                      <div className="flex justify-start mb-1">
                        <div className="max-w-[85%] px-3 py-2 rounded-lg shadow-sm text-sm bg-slate-700/50 text-slate-300 border border-slate-600 opacity-75">
                          <span className="italic">{deltaText}...</span>
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

        {/* Right Panel - Metrics */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-2xl font-mono font-semibold text-slate-100">{formatDuration(metrics.duration)}</span>
                </div>
              </div>
              <button
                onClick={endSession}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Conversation Status */}
              <ConversationStatus 
                transcript={transcript} 
                duration={metrics.duration}
              />
              
              {/* Quick Tips */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Quick Tips</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  {shuffledTips.slice(0, 3).map((t, idx) => (
                    <li key={idx}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}