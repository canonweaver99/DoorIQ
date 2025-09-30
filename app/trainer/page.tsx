'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import CalculatingScore from '@/components/analytics/CalculatingScore'
import MoneyNotification from '@/components/trainer/MoneyNotification'
import { useSessionRecording } from '@/hooks/useSessionRecording'
import { useAmbientAudio } from '@/hooks/useAmbientAudio'

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
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [homeownerName, setHomeownerName] = useState<string>('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Audio recording hook
  const { isRecording, startRecording, stopRecording } = useSessionRecording(sessionId)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  
  // Ambient audio system
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
      ambience: 0.10,
      sfx: 0.30,
      voice: 1.0
    },
    scheduling: {
      enabled: true,
      assetKeys: ['dogBark1', 'dogBark2'],
      baseInterval: [20, 50]
    },
    integration: {
      enableElevenLabs: true,
      autoConnect: sessionActive
    }
  })

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
    fetchAgent()
    
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
    }
  }, [])
  
  // Manage ambient audio during session
  useEffect(() => {
    if (sessionActive && ambientState.isInitialized) {
      console.log('🎵 Starting ambient audio for session')
      
      const randomAmbience = Math.random() > 0.5 ? 'suburban' : 'suburban2'
      ambientControls.startAmbience(randomAmbience)
      ambientControls.startScheduler()
      
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

  // Handle transcript updates
  const setDelta = (text: string, speaker: 'user' | 'austin' = 'austin') => {
    setDeltaText(text || '')
  }

  const pushFinal = async (text: string, speaker: 'user' | 'austin' = 'austin') => {
    if (!text?.trim()) return

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date()
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
          setDelta(msg.text || '', msg.speaker || 'austin')
        } else if (msg?.type === 'transcript.final') {
          pushFinal(msg.text || '', msg.speaker || 'austin')
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
            pushFinal(text, 'austin')
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
      if (e?.detail) pushFinal(e.detail, 'austin')
    }

    window.addEventListener('agent:message', handleMessage)
    window.addEventListener('agent:user', handleUserEvent)
    window.addEventListener('agent:response', handleAgentEvent)
    
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

  const fetchAgent = async () => {
    try {
      const agentParam = searchParams.get('agent')
      
      if (agentParam) {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('eleven_agent_id', agentParam)
          .eq('is_active', true)
          .single()

        if (!error && data) {
          setSelectedAgent(data)
          if (!homeownerName) {
            setHomeownerName(data.name)
          }
        } else {
          const { data: austinData } = await supabase
            .from('agents')
            .select('*')
            .eq('name', 'Austin')
            .eq('is_active', true)
            .single()
          setSelectedAgent(austinData)
          if (!homeownerName) {
            setHomeownerName(austinData?.name || 'Austin')
          }
        }
      } else {
        const { data: austinData } = await supabase
          .from('agents')
          .select('*')
          .eq('name', 'Austin')
          .eq('is_active', true)
          .single()
        setSelectedAgent(austinData)
        if (!homeownerName) {
          setHomeownerName(austinData?.name || 'Austin')
        }
      }
    } catch (error) {
      console.error('Error fetching agent:', error)
    } finally {
      setLoadingAgent(false)
    }
  }

  const startSession = async () => {
    try {
      // Create session record
      const newId = await createSessionRecord()
      setSessionId(newId)
      setSessionActive(true)
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const createSessionRecord = async () => {
    try {
      const payload: any = {
        user_id: user?.id || null,
        agent_id: selectedAgent?.id || null,
        scenario_type: 'standard',
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
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }

    try {
      try { (window as any).stopConversation?.() } catch {}
      stopRecording()
      
      try {
        ambientControls.stopAmbience()
        ambientControls.stopScheduler()
      } catch {}
      
      // Persist session metadata and transcript
      if (sessionId) {
        await (supabase as any)
          .from('live_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
            full_transcript: transcript as any,
            analytics: {
              conversation_id: (window as any)?.elevenConversationId || null,
              homeowner_name: selectedAgent?.name || 'Austin',
              homeowner_profile: selectedAgent?.description || 'Standard homeowner persona',
            }
          } as any)
          .eq('id', sessionId as string)

        try {
          if (transcript.length > 0) {
            await fetch('/api/grade/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            })
          }
        } catch (e) {
          console.error('AI grading failed:', e)
        }
        
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
            <p className="text-slate-400">
              {sessionActive ? `Speaking with ${homeownerName || 'Agent'}` : 'Ready to start'}
            </p>
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
              />
              <div id="orb-status">{sessionActive ? 'Tap to stop' : 'Tap to start'}</div>
            </div>

            {/* ElevenLabs Integration Script */}
            {sessionActive && (
              <Script id="elevenlabs-conversation" type="module" strategy="afterInteractive">
                {`
                  import { Conversation } from 'https://esm.sh/@elevenlabs/client';
                  const AGENT_ID = '${selectedAgent?.eleven_agent_id || 'agent_7001k5jqfjmtejvs77jvhjf254tz'}';

                  const orb = document.getElementById('conversation-orb');
                  let convo = null;
                  let isStarting = false;
                  let state = { status: 'disconnected', mode: 'idle' };

                  function render() {
                    const { status } = state;
                    const active = status === 'connected' || status === 'connecting';
                    
                    if (active) {
                      orb.classList.add('active');
                    } else {
                      orb.classList.remove('active');
                    }
                  }

                  async function startConversation() {
                    try {
                      if (convo || isStarting || state.status === 'connected') return;
                      isStarting = true;
                      
                      if (window.startSessionRecording) {
                        window.startSessionRecording();
                      }
                      
                      state.status = 'connecting';
                      render();
                      
                      try {
                        await navigator.mediaDevices.getUserMedia({ 
                          audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                            sampleRate: 48000,
                            sampleSize: 16,
                            channelCount: 1
                          } 
                        });
                      } catch {}
                      
                      convo = await Conversation.startSession({
                        agentId: AGENT_ID,
                        connectionType: 'webrtc',
                        onStatusChange: (s) => { state.status = s; render(); },
                        onModeChange: (m) => { state.mode = m; render(); },
                        onMessage: (msg) => {
                          window.dispatchEvent(new CustomEvent('agent:message', { detail: msg }));
                          
                          try {
                            if (msg?.type === 'user_transcript') {
                              const text = msg.user_transcript || msg.text || '';
                              if (text) {
                                window.dispatchEvent(new CustomEvent('agent:user', { detail: text }));
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
                                window.dispatchEvent(new CustomEvent('agent:response', { detail: text }));
                              }
                            }
                          } catch (e) {
                            console.error('Error processing message:', e);
                          }
                        },
                        onError: (err) => { console.error('ElevenLabs error:', err); },
                      });
                      isStarting = false;
                    } catch (err) {
                      console.error(err);
                      state.status = 'disconnected';
                      state.mode = 'idle';
                      render();
                      isStarting = false;
                    }
                  }

                  async function stopConversation() {
                    try { await convo?.endSession(); } catch {}
                    convo = null;
                    isStarting = false;
                    state.status = 'disconnected';
                    state.mode = 'idle';
                    render();
                    
                    if (window.stopSessionRecording) {
                      window.stopSessionRecording();
                    }
                  }

                  window.stopConversation = stopConversation;

                  // Auto-start when script loads
                  setTimeout(() => startConversation(), 100);

                  render();
                `}
              </Script>
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
                width: 280px;
                height: 280px;
                border-radius: 9999px;
                border: 0;
                outline: none;
                cursor: pointer;
                background: radial-gradient(circle at 30% 30%, #818cf8, #6366f1, #4f46e5);
                box-shadow: 
                  0 20px 60px rgba(99, 102, 241, 0.6),
                  0 0 0 4px rgba(99, 102, 241, 0.1),
                  inset 0 1px 20px rgba(255,255,255,0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                animation: floaty 4s ease-in-out infinite;
                position: relative;
              }
              
              #conversation-orb:hover { 
                transform: scale(1.08);
                box-shadow: 
                  0 25px 70px rgba(99, 102, 241, 0.7),
                  0 0 0 6px rgba(99, 102, 241, 0.15),
                  inset 0 1px 20px rgba(255,255,255,0.3);
              }
              
              #conversation-orb:active { 
                transform: scale(0.95);
              }

              #conversation-orb:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
              
              #conversation-orb.active {
                background: radial-gradient(circle at 30% 30%, #34d399, #10b981, #059669);
                box-shadow: 
                  0 20px 60px rgba(16, 185, 129, 0.6),
                  0 0 0 8px rgba(16, 185, 129, 0.15),
                  0 0 0 16px rgba(16, 185, 129, 0.1),
                  0 0 0 24px rgba(16, 185, 129, 0.05),
                  inset 0 1px 20px rgba(255,255,255,0.2);
                animation: floaty 4s ease-in-out infinite, pulse-ring 2s ease-in-out infinite;
              }
              
              @keyframes pulse-ring {
                0%, 100% {
                  box-shadow: 
                    0 20px 60px rgba(16, 185, 129, 0.6),
                    0 0 0 8px rgba(16, 185, 129, 0.15),
                    0 0 0 16px rgba(16, 185, 129, 0.1),
                    0 0 0 24px rgba(16, 185, 129, 0.05),
                    inset 0 1px 20px rgba(255,255,255,0.2);
                }
                50% {
                  box-shadow: 
                    0 20px 60px rgba(16, 185, 129, 0.7),
                    0 0 0 12px rgba(16, 185, 129, 0.2),
                    0 0 0 24px rgba(16, 185, 129, 0.15),
                    0 0 0 36px rgba(16, 185, 129, 0.08),
                    inset 0 1px 20px rgba(255,255,255,0.3);
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
              
              @keyframes floaty { 
                0%, 100% { transform: translateY(0px); } 
                50% { transform: translateY(-12px); } 
              }
              
              /* Moved from bottom to avoid nested styled-jsx */
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
                  Live Transcript
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