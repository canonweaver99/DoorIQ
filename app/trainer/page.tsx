'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Clock, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { MetricCard } from '@/components/trainer/MetricCard'
import { KeyMomentFlag } from '@/components/trainer/KeyMomentFlag'
import { ConversationStatus } from '@/components/trainer/ConversationStatus'
import { TranscriptEntry, SessionMetrics } from '@/lib/trainer/types'
import { ElevenLabsTranscriptManager, mapSpeaker, asDate, safeId } from '@/lib/trainer/transcriptManager'
import { analyzeConversation } from '@/lib/trainer/conversationAnalyzer'
import { AlertCircle, MessageSquare, Target, TrendingUp } from 'lucide-react'
// ElevenLabs ConvAI widget will be embedded directly in the left panel

export default function TrainerPage() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
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
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const transcriptManagerRef = useRef<ElevenLabsTranscriptManager | null>(null)
  // elevenLabsWs removed in favor of @elevenlabs/react; guard audio capture

  useEffect(() => {
    fetchUser()
    
    // Auto-start if coming from pre-session
    if (searchParams.get('autostart') === 'true') {
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

  // === COPY: DOM events wire-up ===
  useEffect(() => {
    const onUser = (e: any) => {
      try {
        const payload = e?.detail ?? '';
        if (payload) addToTranscript('user', String(payload));
      } catch {}
    };

    const onAgent = (e: any) => {
      try {
        const d = e?.detail;
        let text = '';
        if (typeof d === 'string') text = d;
        else if (d?.text) text = d.text;
        else if (d?.content) text = d.content;
        else if (Array.isArray(d?.messages)) {
          text = d.messages.map((m: any) => m?.text).filter(Boolean).join(' ');
        }
        if (text) addToTranscript('austin', String(text));
      } catch {}
    };

    window.addEventListener('austin:user', onUser as any);
    window.addEventListener('austin:agent', onAgent as any);
    return () => {
      window.removeEventListener('austin:user', onUser as any);
      window.removeEventListener('austin:agent', onAgent as any);
    };
  }, []);

  // === COPY: manager wiring ===
  useEffect(() => {
    const mgr = new ElevenLabsTranscriptManager();
    transcriptManagerRef.current = mgr;

    mgr.onTranscriptUpdate = (items, interim) => {
      // When manager finalizes a line, it already pushed it internally.
      // Append only the newest finalized item to React state.
      const last = items[items.length - 1];
      if (last?.text) addToTranscript(last.speaker, last.text);
      // Optionally: render `interim` somewhere ephemeral
    };

    mgr.onGradingUpdate = (entryId, grading) => {
      setTranscript(prev =>
        prev.map(e => e.id === entryId ? { ...e, grading } : e)
      );
    };

    // IMPORTANT: actually connect (use a server-signed WS URL; do not embed API keys)
    // Example: const wsUrl = await fetch('/api/eleven/ws-url').then(r => r.text());
    // mgr.connect(wsUrl);
    // For now, no-op to avoid leaking keys in client.

    return () => {
      transcriptManagerRef.current = null;
    };
  }, []);

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

  const playAudio = (src: string) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio(src)
      audio.autoplay = true
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }

  // Removed custom audio/WebSocket playback in favor of official embed

  // === COPY: addToTranscript fix ===
  const addToTranscript = (speaker: 'user' | 'austin', raw: string) => {
    const text = String(raw ?? '').trim();
    if (!text) return;

    setTranscript(prev => {
      // prevent immediate duplicates from same speaker
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && last.text === text) return prev;

      const entry: TranscriptEntry = {
        id: safeId(),
        speaker,
        text,
        timestamp: new Date(),          // always Date object in state
        sentiment: 'neutral',
        confidence: 0.8,
        grading: null,
      };

      // scroll after paint
      requestAnimationFrame(() => {
        setTimeout(() => {
          transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      });

      try {
        transcriptManagerRef.current?.gradeTranscriptEntry({
          id: entry.id,
          text: entry.text,
          confidence: entry.confidence
        });
      } catch {}

      return [...prev, entry];
    });
  };

  const createSessionRecord = async () => {
    try {
      if (user?.id) {
        const { data: session, error } = await (supabase as any)
          .from('training_sessions')
          .insert({
            user_id: user.id,
            scenario_type: 'standard',
          } as any)
          .select()
          .single()
        if (error) throw error
        return (session as any).id
      } else {
        return (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `${Date.now()}`
      }
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  // === COPY: endSession critical fixes ===
  const endSession = async () => {
    setLoading(true);
    if (durationInterval.current) clearInterval(durationInterval.current);

    try {
      try { (window as any).stopAustin?.(); } catch {}

      const analysis = analyzeConversation(transcript);

      // ✅ FIX: correct key for objection handling (example key)
      // If your analyzer uses a different key, align here.
      const objectionScore =
        analysis?.scores?.objectionHandling ??
        analysis?.scores?.objection_handling ??
        analysis?.scores?.listening ?? 0;

      if (user?.id && sessionId) {
        await (supabase as any)
          .from('training_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: metrics.duration,
            overall_score: analysis.overallScore,
            rapport_score: analysis.scores.rapport,
            introduction_score: analysis.scores.introduction,
            listening_score: analysis.scores.listening,
            objection_handling_score: objectionScore,             // <-- FIXED
            safety_score: analysis.keyMoments?.safetyAddressed ? 85 : 40,
            close_effectiveness_score: analysis.scores.closing,
            transcript: transcript,                               // keep in DB, not URL
            analytics: analysis,
            sentiment_data: {
              finalSentiment: metrics.sentimentScore,
              interruptionCount: metrics.interruptionCount,
              objectionCount: metrics.objectionCount
            }
          } as any)
          .eq('id', sessionId as string);

        const durationStr = formatDuration(metrics.duration);
        // ✅ Do NOT shove transcript into the URL (will blow up)
        router.push(`/feedback?session=${encodeURIComponent(sessionId as string)}&duration=${encodeURIComponent(durationStr)}`);
      } else {
        // If no session, store minimal payload somewhere (or create a new row and get id)
        const durationStr = formatDuration(metrics.duration);
        router.push(`/feedback?duration=${encodeURIComponent(durationStr)}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sales Training Session</h1>
          <p className="text-xl text-gray-600 mb-8">Practice your pitch with Austin</p>
          <button
            onClick={initializeSession}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Training Session'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Panel - ElevenLabs Agent */}
        <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col relative">
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

          <div className="flex-1 bg-gray-100 relative overflow-hidden">
            {/* Custom Floating Orb that controls ElevenLabs Conversation */}
            <button id="austin-orb" aria-label="Talk to Austin"></button>
            <div id="austin-status">tap to talk</div>

            <Script id="austin-orb-client" type="module" strategy="afterInteractive">
              {`
                import { Conversation } from 'https://esm.sh/@elevenlabs/client';
                const AGENT_ID = 'agent_7001k5jqfjmtejvs77jvhjf254tz';

                const orb = document.getElementById('austin-orb');
                const statusEl = document.getElementById('austin-status');

                let convo = null;
                let isStarting = false;
                let state = { status: 'disconnected', mode: 'idle' };

                function extractTexts(msg) {
                  // Try to extract text for both user and agent, covering several payload shapes
                  let userText = '';
                  let agentText = '';

                  try {
                    // Explicit fields
                    if (msg?.type === 'user_transcript') {
                      userText = typeof msg.user_transcript === 'string' ? msg.user_transcript : (msg.user_transcript?.text || '');
                    }
                    if (msg?.type === 'agent_response') {
                      const ar = msg.agent_response;
                      if (typeof ar === 'string') agentText = ar;
                      else if (ar?.text) agentText = ar.text;
                      else if (ar?.content) agentText = ar.content;
                      else if (Array.isArray(ar?.messages)) agentText = ar.messages.map(m => m?.text).filter(Boolean).join(' ');
                    }
                    
                    // Handle conversation_updated messages
                    if (msg?.type === 'conversation_updated') {
                      const messages = msg?.conversation?.messages || [];
                      if (messages.length > 0) {
                        const lastMsg = messages[messages.length - 1];
                        if (lastMsg?.role === 'user' && lastMsg?.content) userText = lastMsg.content;
                        else if (lastMsg?.role === 'assistant' && lastMsg?.content) agentText = lastMsg.content;
                      }
                    }

                    // Generic fields
                    if (!userText && (msg?.user || msg?.speaker === 'user')) {
                      const u = msg.user;
                      if (typeof u === 'string') userText = u;
                      else if (u?.text) userText = u.text;
                      else if (u?.transcript) userText = u.transcript;
                    }
                    if (!agentText && (msg?.agent || msg?.speaker === 'agent' || msg?.role === 'assistant')) {
                      const a = msg.agent || msg;
                      if (typeof a === 'string') agentText = a;
                      else if (a?.text) agentText = a.text;
                      else if (a?.response) agentText = a.response;
                    }

                    // Conversation update style: messages array with role/content
                    const messages = msg?.messages || msg?.conversation?.messages || [];
                    if (Array.isArray(messages) && messages.length) {
                      const uParts = messages.filter(m => (m?.role === 'user' || m?.speaker === 'user')).map(m => m?.text || m?.content || '').filter(Boolean);
                      const aParts = messages.filter(m => (m?.role === 'assistant' || m?.speaker === 'agent' || m?.role === 'agent')).map(m => m?.text || m?.content || '').filter(Boolean);
                      if (!userText && uParts.length) userText = uParts.join(' ');
                      if (!agentText && aParts.length) agentText = aParts.join(' ');
                    }

                    // Fallback single text field
                    if (!userText && !agentText && msg?.text) {
                      if (msg?.role === 'user') userText = msg.text; else agentText = msg.text;
                    }
                  } catch {}

                  return { userText, agentText };
                }

                function render() {
                  const { status, mode } = state;
                  const active = status === 'connected' || status === 'connecting';
                  if (active) orb.classList.add('active'); else orb.classList.remove('active');
                  statusEl.textContent =
                    status === 'connecting' ? 'connecting…' :
                    status === 'connected' ? (mode === 'speaking' ? 'speaking' : 'listening') :
                    'tap to talk';
                }

                async function startSession() {
                  try {
                    // Guard: ensure only one active/connecting session at a time
                    if (convo || isStarting || state.status === 'connected' || state.status === 'connecting') return;
                    isStarting = true;
                    state.status = 'connecting'; render();
                    try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
                    convo = await Conversation.startSession({
                      agentId: AGENT_ID,
                      connectionType: 'webrtc',
                      onStatusChange: (s) => { state.status = s; render(); },
                      onModeChange:   (m) => { state.mode = m; render(); },
                      onMessage: (msg) => {
                        try {
                          const { userText, agentText } = extractTexts(msg);
                          if (userText) window.dispatchEvent(new CustomEvent('austin:user', { detail: userText }));
                          if (agentText) window.dispatchEvent(new CustomEvent('austin:agent', { detail: agentText }));
                        } catch (e) { console.debug('Austin onMessage parse error', e); }
                      },
                      onError: (err) => { console.error('ElevenLabs error:', err); stopSession(true); },
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

                async function stopSession(silent = false) {
                  try { await convo?.endSession(); } catch {}
                  convo = null;
                  isStarting = false;
                  state.status = 'disconnected';
                  state.mode = 'idle';
                  render();
                }

                orb.addEventListener('click', () => {
                  const isActive = state.status === 'connected' || state.status === 'connecting';
                  if (isActive) stopSession(); else startSession();
                });

                // Expose a global stopper so the End Session button can end the call
                window.stopAustin = () => stopSession(true);

                document.addEventListener('visibilitychange', () => {
                  if (document.hidden && (state.status === 'connected' || state.status === 'connecting')) {
                    stopSession(true);
                  }
                });

                render();
              `}
            </Script>

            <style jsx global>{`
              /* Make the orb large and centered in the left column */
              #austin-orb {
                position: absolute;
                left: 50%;
                top: 34%;
                transform: translate(-50%, -50%);
                width: 220px;
                height: 220px;
                border-radius: 9999px;
                border: 0;
                outline: none;
                cursor: pointer;
                background: radial-gradient(circle at 30% 30%, #6AA8FF, #3CE2D3);
                box-shadow: 0 18px 56px rgba(20, 180, 255, 0.45);
                transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
                animation: floaty 4.6s ease-in-out infinite;
                z-index: 10;
              }
              #austin-orb:hover { transform: translate(-50%, -50%) scale(1.03); filter: saturate(1.07); }
              #austin-orb:active { transform: translate(-50%, -50%) scale(0.97); }
              #austin-orb.active {
                box-shadow: 0 18px 58px rgba(20,180,255,.55), 0 0 0 14px rgba(60,226,211,.18), 0 0 0 24px rgba(106,168,255,.12);
              }
              #austin-status {
                position: absolute;
                left: 50%;
                top: calc(34% + 150px);
                transform: translateX(-50%);
                font: 600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                color: #5f6b73;
                user-select: none;
                pointer-events: none;
                z-index: 10;
                opacity: .9;
              }
              @keyframes floaty { 0% { transform: translate(-50%, -50%) } 50% { transform: translate(-50%, calc(-50% - 7px)) } 100% { transform: translate(-50%, -50%) } }
            `}</style>

            {/* === COPY: transcript UI block === */}
            <div className="absolute left-0 right-0 bottom-0 top-[55%] overflow-y-auto p-4">
              <div className="space-y-3 max-w-md mx-auto">
                {transcript.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">Conversation will appear here...</p>
                ) : (
                  <>
                    <p className="text-center text-xs text-gray-500 mb-2">Live Transcript</p>
                    {transcript.map((entry) => {
                      const isUser = entry.speaker === 'user';
                      const timeStr = asDate(entry.timestamp).toLocaleTimeString();
                      const tint = !isUser && entry.grading
                        ? (entry.grading.score > 0.7
                            ? 'ring-2 ring-green-400/50'
                            : entry.grading.score > 0.5
                              ? 'ring-2 ring-amber-400/50'
                              : 'ring-2 ring-red-400/50')
                        : '';

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm border ${
                              isUser
                                ? 'bg-blue-500 text-white border-blue-400'
                                : 'bg-white text-gray-900 border-gray-200'
                            } ${tint}`}
                          >
                            <p className="text-sm leading-relaxed">{entry.text}</p>
                            <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                              {timeStr}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={transcriptEndRef} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Metrics */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-2xl font-mono font-semibold">{formatDuration(metrics.duration)}</span>
                </div>
              </div>
              <button
                onClick={endSession}
                disabled={loading}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Conversation Status */}
              <ConversationStatus 
                transcript={transcript} 
                duration={metrics.duration}
              />
              
              {/* Quick Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Build rapport before discussing business</li>
                  <li>• Ask about pest problems they&apos;ve experienced</li>
                  <li>• Mention safety for pets and children</li>
                  <li>• Create urgency with seasonal offers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}