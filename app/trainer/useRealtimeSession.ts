'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';
import { scenarioInstructions } from './scenarioInstructions';
import { getObjection, type ObjectionCategory } from './objections';

// Audio controller for barge-in prevention
let speaking = false;
let audioEl: HTMLAudioElement | null = null;

function ensureAudioEl(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audioEl) audioEl = new Audio();
  return audioEl;
}

// Enhanced TTS processing with turn limiting
function tidyForTTS(text: string): string {
  const clean = text.trim();
  const sentences = clean.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  return /[.!?]$/.test(sentences) ? sentences : sentences + '.';
}

// Play TTS with barge-in control
export function playTTS(arrayBuffer: ArrayBuffer) {
  if (typeof window === 'undefined') return;
  const el = ensureAudioEl();
  if (!el) return;
  speaking = true;
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  el.src = URL.createObjectURL(blob);
  el.play().catch(() => {});
}

// Stop TTS immediately
export function stopTTS() {
  if (typeof window === 'undefined') return;
  const el = audioEl;
  if (!speaking || !el) return;
  el.pause();
  el.currentTime = 0;
  speaking = false;
}

// Track speaking state for interruption detection
let lastSpeakTs = 0;
function markSpoke() { lastSpeakTs = Date.now(); }
function maybeYieldLine(queueSpeech: (text: string, voiceSettings: any, isApology?: boolean) => void) {
  if (Date.now() - lastSpeakTs < 1200) {
    const apologyVoiceSettings = {
      stability: 0.40,
      similarity_boost: 0.90,
      style: 0.30,
      use_speaker_boost: true
    };
    queueSpeech("Oh—sorry, you go ahead.", apologyVoiceSettings, true);
  }
}

// Speech queue system for preventing overlapping audio
interface SpeechQueueItem {
  id: string;
  text: string;
  voiceSettings: any;
  isApology?: boolean;
}

export function useRealtimeSession() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  // Ephemeral-only flow: no persistent sessionId
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const tokensInRef = useRef(0);
  const tokensOutRef = useRef(0);
  const [currentScenario, setCurrentScenario] = useState<{id: string, name: string, mood: string} | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);

  // Speech queue and interruption handling
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isPlayingSpeechRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const userSpeakingRef = useRef(false);
  const lastResponseStartTime = useRef<number>(0);
  
  // Conversation flow guards
  const awaitingReplyRef = useRef(false);
  const lastUtteranceRef = useRef<{ text: string; ts: number } | null>(null);
  
  // Always respond functionality - track silence and prompt user
  const lastUserActivityRef = useRef<number>(Date.now());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // timer
  useEffect(() => {
    const id = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const setAudioElement = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  // Speech queue processing function
  async function processSpeechQueue(): Promise<void> {
    if (isPlayingSpeechRef.current || speechQueueRef.current.length === 0) {
      return;
    }

    const item = speechQueueRef.current.shift()!;
    isPlayingSpeechRef.current = true;
    setIsSpeaking(true);

    try {
      console.log('Processing speech queue item:', item.text.substring(0, 50) + '...');
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          voice_settings: item.voiceSettings
        })
      });

      if (!response.ok) {
        console.error('TTS failed for queued item');
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      // Use enhanced playTTS function
      playTTS(audioBuffer);
      markSpoke(); // Track speaking time

      // Set up event listeners for our global audio element
      const handleEnded = () => {
        console.log('Audio playback completed for:', item.text.substring(0, 30));
        isPlayingSpeechRef.current = false;
        setIsSpeaking(false);
        const el = ensureAudioEl();
        el?.removeEventListener('ended', handleEnded);
        el?.removeEventListener('error', handleError);
        // Process next item in queue
        setTimeout(() => processSpeechQueue(), 100);
        // After agent stops speaking, expect user input - arm silence prompt
        resetSilenceTimeout();
      };

      const handleError = (e: any) => {
        console.error('Audio playback error:', e);
        isPlayingSpeechRef.current = false;
        setIsSpeaking(false);
        const el = ensureAudioEl();
        el?.removeEventListener('ended', handleEnded);
        el?.removeEventListener('error', handleError);
        // Process next item in queue even after error
        setTimeout(() => processSpeechQueue(), 100);
      };

      const el = ensureAudioEl();
      el?.addEventListener('ended', handleEnded);
      el?.addEventListener('error', handleError);
      console.log('Audio playback started for:', item.text.substring(0, 30));

    } catch (error) {
      console.error('Speech queue processing error:', error);
      isPlayingSpeechRef.current = false;
      setIsSpeaking(false);
      currentAudioRef.current = null;
      // Continue with next item
      setTimeout(() => processSpeechQueue(), 100);
    }
  }

  // Add speech to queue
  function queueSpeech(text: string, voiceSettings: any, isApology: boolean = false, preempt: boolean = false) {
    const cleaned = text.trim();

    // Suppress immediate duplicates (accidental double-queue)
    if (lastUtteranceRef.current && lastUtteranceRef.current.text === cleaned && Date.now() - lastUtteranceRef.current.ts < 2000) {
      console.log('Skipping duplicate utterance:', cleaned);
      return;
    }

    const item: SpeechQueueItem = {
      id: crypto.randomUUID(),
      text: cleaned,
      voiceSettings,
      isApology
    };

    console.log('Queueing speech:', cleaned.substring(0, 50) + '...', 'isApology:', isApology);
    
    // If it's an apology, prioritize it by adding to front of queue
    if (isApology) {
      // Stop current audio if playing
      stopTTS();
      
      // Clear queue and add apology to front
      speechQueueRef.current.unshift(item);
      isPlayingSpeechRef.current = false;
      setIsSpeaking(false);
    } else if (preempt) {
      // Preempt current speech with latest response
      stopTTS();
      speechQueueRef.current = [];
      speechQueueRef.current.unshift(item);
      isPlayingSpeechRef.current = false;
      setIsSpeaking(false);
    } else {
      speechQueueRef.current.push(item);
    }

    // Remember last utterance
    lastUtteranceRef.current = { text: cleaned, ts: Date.now() };

    // Add to transcript immediately
    const transcriptTurn: Turn = { 
      id: crypto.randomUUID(), 
      speaker: 'homeowner', 
      text: cleaned, 
      ts: Date.now() 
    };
    setTranscript(prev => [...prev.slice(-19), transcriptTurn]);

    // Start processing queue
    processSpeechQueue();
  }

  // Detect interruptions - simplified version
  const checkForInterruption = useCallback(() => {
    if (isPlayingSpeechRef.current) {
      console.log('User interrupted Amanda - stopping speech');
      stopTTS();
    }
  }, []);


  // Simple fallback responses in Amanda's natural style
  const getSimpleFallback = useCallback((): string => {
    const fallbacks = [
      "Sorry, what was that?",
      "Come again?",
      "I didn't catch that.",
      "What'd you say?",
      "Hm?"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }, []);

  // Handle prolonged silence by prompting the user
  const handleSilenceTimeout = useCallback(() => {
    if (!connected || isPlayingSpeechRef.current) return;
    
    console.log('Silence timeout - prompting user to continue conversation');
    
    const silencePrompts = [
      "You still there?",
      "Everything okay?",
      "Hello?",
      "Did I lose you?",
      "What do you think?"
    ];
    
    const prompt = silencePrompts[Math.floor(Math.random() * silencePrompts.length)];
    const neutralVoiceSettings = {
      stability: 0.35,
      similarity_boost: 0.90,
      style: 0.45,
      use_speaker_boost: true
    };
    
    queueSpeech(prompt, neutralVoiceSettings);
    
    // Reset the timeout for another longer period
    resetSilenceTimeout(20000); // 20 seconds for follow-up
  }, [connected]);

  // Reset silence timeout
  const resetSilenceTimeout = useCallback((delayMs: number = 8000) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    silenceTimeoutRef.current = setTimeout(handleSilenceTimeout, delayMs);
    lastUserActivityRef.current = Date.now();
  }, [handleSilenceTimeout]);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setStatus('connecting');

      // 1) Fresh ephemeral (fetch it right before SDP)
      const tokRes = await fetch("/api/rt/token", { cache: "no-store" });
      const tokText = await tokRes.text();
      console.log('Token response:', tokRes.status, tokText);
      
      if (!tokRes.ok) {
        console.error('Token fetch failed:', tokRes.status, tokText);
        throw new Error(`token route ${tokRes.status}: ${tokText}`);
      }
      
      let tokenData;
      try {
        tokenData = JSON.parse(tokText);
      } catch (e) {
        console.error('Failed to parse token response:', tokText);
        throw new Error('Invalid token response format');
      }
      
      const EPHEMERAL = tokenData?.client_secret?.value;
      if (!EPHEMERAL) {
        console.error('No token value in response:', tokenData);
        throw new Error("no client_secret.value in token response");
      }

      // 2) PeerConnection + audio sink
      const pc = new RTCPeerConnection({
        // STUN isn't strictly required but helps
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        bundlePolicy: "max-bundle",
      });
      pcRef.current = pc;

      // Add connection state logging
      pc.onconnectionstatechange = () => {
        console.log('WebRTC connection state:', pc.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log('WebRTC ICE connection state:', pc.iceConnectionState);
      };

      // We're not using OpenAI audio output anymore - ElevenLabs will handle speech
      // const remote = new MediaStream();
      // if (audioRef.current) {
      //   audioRef.current.srcObject = remote;
      //   audioRef.current.autoplay = true;
      //   (audioRef.current as any).playsInline = true;
      // }
      // pc.ontrack = (e) => remote.addTrack(e.track);

      // Data channel (for response.create etc.)
      let dc = pc.createDataChannel("oai-events");
      pc.ondatachannel = (e) => { dc = e.channel; };
      
      let userTalkingSince = 0;
      let lastUserTurnEndTime = 0;
      let currentAssistantText = '';
      
      // 3) Mic track + ensure we have an m=audio section
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      pc.addTransceiver("audio", { direction: "sendrecv" }); // makes the m=audio regardless
      const micTrack = ms.getTracks()[0];
      pc.addTrack(micTrack);
      
      // Store mic track for toggling
      micTrackRef.current = micTrack;

      // 4) Create offer, setLocalDescription, **wait for ICE complete**
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        const check = () => {
          if (pc.iceGatheringState === "complete") {
            pc.removeEventListener("icegatheringstatechange", check);
            resolve();
          }
        };
        pc.addEventListener("icegatheringstatechange", check);
        // hard timeout fallback (7s) so we don't hang forever
        setTimeout(resolve, 7000);
      });

      const finalSDP = pc.localDescription?.sdp;
      if (!finalSDP) throw new Error("No localDescription.sdp after ICE gathering");

      // 5) POST the **final** SDP to the correct endpoint with model in query
      const MODEL = "gpt-4o-realtime-preview-2024-12-17"; // Full model name for WebRTC
      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL}`,
          "Content-Type": "application/sdp",
        },
        body: finalSDP,
      });

      if (!sdpRes.ok) {
        const errText = await sdpRes.text();
        console.error("SDP exchange failed:", sdpRes.status, errText);
        throw new Error(`SDP exchange failed ${sdpRes.status}`);
      }

      const answer = { type: "answer", sdp: await sdpRes.text() } as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);

      startTimeRef.current = Date.now();
      setConnected(true);
      setStatus('listening');

      dc.addEventListener("open", () => {
        console.log('Data channel opened');
        
        // Simple scenario - Amanda with new personality
        const scenario = {
          id: 'rapport_building',
          name: 'Suburban Homeowner',
          mood: 'neutral' as const,
          situation: 'At home, unknown visitor at door'
        };
        setCurrentScenario(scenario);
        console.log('Starting conversation as natural Amanda');
        
        // Configure Amanda's new personality and session settings
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: scenarioInstructions,
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.62,
              prefix_padding_ms: 180,
              silence_duration_ms: 320
            },
            tools: [],
            tool_choice: "none",
            temperature: 0.65,
            max_response_output_tokens: 60
          }
        }));

        // Wait a moment for connection to stabilize, then have Amanda give a simple greeting
        setTimeout(() => {
          const greeting = "Hi there—can I help you?";
          
          // Queue the greeting with friendly neutral voice settings
          const greetingVoiceSettings = {
            stability: 0.30,
            similarity_boost: 0.92,
            style: 0.55,
            use_speaker_boost: true
          };
          
          queueSpeech(greeting, greetingVoiceSettings);
          markSpoke(); // Track speaking time
        }, 500);
      });

      // Handle messages and transcript
      dc.addEventListener("message", (e) => {
        try {
          const ev = JSON.parse(e.data);
          console.log('Realtime event:', ev.type, ev);
          
          // Debug: Log important events
          if (ev.type.includes('conversation') || ev.type.includes('response') || ev.type.includes('transcription')) {
            console.log('🔍 Key event details:', {
              type: ev.type,
              item: ev.item,
              transcript: ev.transcript,
              text: ev.text,
              delta: ev.delta
            });
          }
          
          // Track user speech for barge-in detection and interruptions
          if (ev.type === 'input_audio_buffer.speech_started') {
            userTalkingSince = performance.now();
            userSpeakingRef.current = true;
            console.log('User started speaking');
            
            // Stop TTS immediately and potentially yield
            stopTTS();
            maybeYieldLine(queueSpeech);
            
            // Reset silence timeout since user is active
            resetSilenceTimeout();
            
            // Check for interruption
            checkForInterruption();
          }
          
          if (ev.type === 'input_audio_buffer.speech_stopped') {
            const talkDuration = performance.now() - userTalkingSince;
            lastUserTurnEndTime = performance.now();
            userSpeakingRef.current = false;
            console.log(`User spoke for ${Math.round(talkDuration)}ms`);
            
            // Barge-in if user is rambling (>20s) or being evasive
            if (talkDuration > 20000) {
              dc.send(JSON.stringify({ type: "response.cancel" })); // Cancel any pending
              dc.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "Sorry—quickly—price and what's included?" }]
                }
              }));
              dc.send(JSON.stringify({
                type: "response.create",
                response: { modalities: ["text"], max_output_tokens: 45 }
              }));
            }
          }
          
          // Handle assistant text streaming
          if (ev.type === 'response.text.delta' && ev.delta) {
            currentAssistantText += ev.delta;
          }
          if (ev.type === 'response.text.done' && ev.text) {
            // Full text is provided in done event
            currentAssistantText = ev.text;
          }
          
          // When response is complete, enhance and queue speech
          if (ev.type === 'response.done') {
            let textToSpeak = currentAssistantText.trim();
            
            // Clear pending flag when model finishes
            awaitingReplyRef.current = false;
            
            // Always respond - if we got empty or very short text, generate fallback
            if (!textToSpeak || textToSpeak.length < 2) {
              console.log('Empty or very short response, generating fallback');
              textToSpeak = getSimpleFallback();
            }
            
            // Apply turn pacing and cleanup
            textToSpeak = tidyForTTS(textToSpeak);
            
            // Track when response started for interruption detection
            lastResponseStartTime.current = performance.now();

            // Map scenario mood to TTS style settings
            const mood = currentScenario?.mood || 'neutral';
            const styleMap: Record<string, { stability: number; similarity: number; style: number; } > = {
              neutral: { stability: 0.30, similarity: 0.92, style: 0.50 },
              interested: { stability: 0.28, similarity: 0.92, style: 0.60 },
              busy: { stability: 0.35, similarity: 0.90, style: 0.40 },
              skeptical: { stability: 0.38, similarity: 0.90, style: 0.35 },
              frustrated: { stability: 0.40, similarity: 0.88, style: 0.30 }
            };
            const s = styleMap[mood] || styleMap.neutral;

            const voiceSettings = {
              stability: s.stability,
              similarity_boost: s.similarity,
              style: s.style,
              use_speaker_boost: true
            };

            // Queue the enhanced speech, preempting if currently speaking
            queueSpeech(textToSpeak, voiceSettings, false, isPlayingSpeechRef.current);
            markSpoke(); // Track when we start speaking

            // Reset
            currentAssistantText = '';
          }
          
          // Handle user transcription
          if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: ev.transcript.trim(), ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
            
            // Trigger response after transcription (fallback if conversation.item.created doesn't fire)
            console.log('User transcription completed, triggering response...');
            setTimeout(() => {
              dc.send(JSON.stringify({
                type: "response.create",
                response: { 
                  modalities: ["text"],
                  max_output_tokens: 60
                }
              }));
            }, 200);
          }
          
          // Auto-respond after each user turn with natural variation
          if (ev.type === "conversation.item.created" && ev.item?.role === "user") {
            // Prevent duplicate response.create while one is pending
            if (awaitingReplyRef.current) return;
            awaitingReplyRef.current = true;
            
            // Add slight delay variation for more natural feel
            const responseDelay = Math.random() * 300 + 100; // 100-400ms
            setTimeout(() => {              
              dc.send(JSON.stringify({
                type: "response.create",
                response: { 
                  modalities: ["text"], // TEXT ONLY - no audio
                  max_output_tokens: 60
                }
              }));
            }, responseDelay);
          }
        } catch (err) {
          console.error('Data channel message error:', err);
        }
      });

    } catch (e: any) {
      console.error('Connection failed:', e);
      setError(e?.message || 'connect_failed');
      setStatus('error');
    }
  }, [checkForInterruption, resetSilenceTimeout, getSimpleFallback, currentScenario?.mood]);

  const toggleMic = useCallback(() => {
    if (micTrackRef.current) {
      const track = micTrackRef.current;
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
      console.log('Mic toggled:', track.enabled ? 'ON' : 'OFF');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      micTrackRef.current?.stop();
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.close();
      setConnected(false);
      setStatus('idle');
      setMicEnabled(true); // Reset for next connection
      micTrackRef.current = null;
    } catch {}
  }, []);

  return {
    pcRef,
    audioRef,
    status,
    error,
    connected,
    transcript,
    isSpeaking,
    elapsedSeconds,
    audioSeconds,
    tokensIn: tokensInRef.current,
    tokensOut: tokensOutRef.current,
    currentScenario,
    micEnabled,
    setAudioElement,
    connect,
    disconnect,
    toggleMic,
    playObjection: (category?: ObjectionCategory) => {
      const { text } = getObjection(category);
      const mood = currentScenario?.mood || 'neutral';
      const styleMap: Record<string, { stability: number; similarity: number; style: number; } > = {
        neutral: { stability: 0.30, similarity: 0.92, style: 0.50 },
        interested: { stability: 0.28, similarity: 0.92, style: 0.60 },
        busy: { stability: 0.35, similarity: 0.90, style: 0.40 },
        skeptical: { stability: 0.38, similarity: 0.90, style: 0.35 },
        frustrated: { stability: 0.40, similarity: 0.88, style: 0.30 }
      };
      const s = styleMap[mood] || styleMap.neutral;
      const voiceSettings = {
        stability: s.stability,
        similarity_boost: s.similarity,
        style: s.style,
        use_speaker_boost: true
      };
      const line = tidyForTTS(text);
      queueSpeech(line, voiceSettings, false, true);
      markSpoke();
    }
  };
}


