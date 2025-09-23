'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';
import { getRandomScenario, type AmandaScenario } from './scenarios';
import { getRandomSoundForScenario, playAmbientSound } from './ambientSounds';

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
  const [currentScenario, setCurrentScenario] = useState<AmandaScenario | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);

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
      
      const EPHEMERAL = tokenData?.value || tokenData?.client_secret?.value;
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

      const remote = new MediaStream();
      if (audioRef.current) {
        audioRef.current.srcObject = remote;
        audioRef.current.autoplay = true;
        (audioRef.current as any).playsInline = true;
      }
      pc.ontrack = (e) => remote.addTrack(e.track);

      // Data channel (for response.create etc.)
      let dc = pc.createDataChannel("oai-events");
      pc.ondatachannel = (e) => { dc = e.channel; };
      
      let assistantBuf = '';
      let userTalkingSince = 0;
      let lastUserTurnEndTime = 0;
      
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

      // 5) POST the **final** SDP to the correct endpoint
      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
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
        
        // Select random scenario for this conversation
        const scenario = getRandomScenario();
        setCurrentScenario(scenario);
        console.log('Selected scenario:', scenario.name, scenario.mood);
        
        // Build dynamic instructions based on scenario
        const scenarioInstructions = `You are Amanda Rodriguez, real suburban mom at her door. Natural, human responses only.

CURRENT SCENARIO: ${scenario.name}
YOUR SITUATION: ${scenario.situation}
BACKGROUND: ${scenario.background}
MOOD: ${scenario.mood}

SPEAKING RULES:
- 1-2 short sentences (≤6 seconds). Vary length naturally.
- Light disfluency when ${scenario.mood === 'busy' ? 'rushed: "uh, yeah..."' : scenario.mood === 'skeptical' ? 'doubtful: "I don\'t know..."' : 'thinking: "hmm, okay"'}
- Back-channels when rep explains well: "okay", "uh-huh", "got it"
- Natural pauses with commas, em dashes—like this
- NEVER narrate actions or read stage directions

SCENARIO-SPECIFIC REACTIONS:
${scenario.id === 'ant_invasion' ? '- If ants/kitchen mentioned: "Yeah, we\'ve actually got them in the pantry right now"' : ''}
${scenario.id === 'spider_problem' ? '- If spiders/exterior: "Oh god, yeah—the eaves are covered"' : ''}
${scenario.id === 'dog_owner' ? '- If treatments/yard: "Bailey\'s out there all day, so..."' : ''}
${scenario.id === 'new_homeowner' ? '- If prevention: "We literally just moved in last month"' : ''}
${scenario.id === 'chemical_sensitivity' ? '- If products mentioned: "Wait—are those EPA registered?"' : ''}
${scenario.id === 'nap_time' ? '- If timing discussed: "Lucas just went down, so..."' : ''}

CONVERSATION FLOW:
- Line 1: React to what they just said
- Line 2 (if needed): One specific question about ${scenario.priorities[0]}
- Be ${scenario.mood}: ${scenario.mood === 'busy' ? 'rushed, checking time' : scenario.mood === 'skeptical' ? 'doubtful, need proof' : scenario.mood === 'interested' ? 'engaged but cautious' : scenario.mood === 'frustrated' ? 'fed up, want solutions' : 'neutral, evaluating'}

Priorities: ${scenario.priorities.slice(0, 2).join(', ')}
Main objection: ${scenario.objections[0]}

Natural interruption if rambling: "Sorry—what's the price?"`;
        
        // Reinforce Amanda's persona with session.update
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: scenarioInstructions,
            temperature: 0.8,
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }));
        
        // Wait a moment for connection to stabilize, then have Amanda speak her opening
        setTimeout(() => {
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: scenario.opening }]
            }
          }));
          
          // Trigger her to speak immediately
          dc.send(JSON.stringify({
            type: "response.create",
            response: { modalities: ["audio","text"], max_output_tokens: 55 }
          }));
        }, 500);
      });

      // Handle messages and transcript
      dc.addEventListener("message", (e) => {
        try {
          const ev = JSON.parse(e.data);
          console.log('Realtime event:', ev.type, ev);
          
          // Track user speech for barge-in detection
          if (ev.type === 'input_audio_buffer.speech_started') {
            userTalkingSince = performance.now();
            console.log('User started speaking');
          }
          
          if (ev.type === 'input_audio_buffer.speech_stopped') {
            const talkDuration = performance.now() - userTalkingSince;
            lastUserTurnEndTime = performance.now();
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
                response: { modalities: ["audio","text"], max_output_tokens: 45 }
              }));
            }
          }
          
          // Handle assistant text streaming
          if (ev.type === 'response.text.delta' && ev.delta) {
            assistantBuf += ev.delta;
            setIsSpeaking(true);
          }
          if (ev.type === 'response.text.done' && ev.text) {
            // Full text is provided in done event
            assistantBuf = ev.text;
          }
          if ((ev.type === 'response.done' || ev.type === 'response.text.done') && assistantBuf.trim().length > 0) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'homeowner', text: assistantBuf.trim(), ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
            setIsSpeaking(false);
            assistantBuf = '';
          }
          
          // Handle user transcription
          if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: ev.transcript.trim(), ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
          }
          
          // Auto-respond after each user turn with natural variation
          if (ev.type === "conversation.item.created" && ev.item?.role === "user") {
            // Add slight delay variation for more natural feel
            const responseDelay = Math.random() * 300 + 100; // 100-400ms
            setTimeout(() => {
              // Maybe play ambient sound based on scenario
              if (currentScenario) {
                const sound = getRandomSoundForScenario(currentScenario.id);
                if (sound) {
                  playAmbientSound(sound);
                }
              }
              
              dc.send(JSON.stringify({
                type: "response.create",
                response: { 
                  modalities: ["audio","text"], 
                  max_output_tokens: 55,
                  temperature: 0.8
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
  }, []);

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
    toggleMic
  };
}


