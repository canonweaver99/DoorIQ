'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';
import { getRandomScenario, type AmandaScenario } from './scenarios';

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
      if (!tokRes.ok) throw new Error(`token route ${tokRes.status}: ${await tokRes.text()}`);
      const tokenData = await tokRes.json();
      const EPHEMERAL = tokenData?.value || tokenData?.client_secret?.value;
      if (!EPHEMERAL) throw new Error("no client_secret.value in token response");

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
        const scenarioInstructions = `You are Amanda Rodriguez, a 34-year-old suburban homeowner. You're polite but standoffish - let the SALES REP lead the conversation. Don't ask questions unless directly relevant to what they just said.

CURRENT SCENARIO: ${scenario.name}
YOUR SITUATION: ${scenario.situation}
BACKGROUND CONTEXT: ${scenario.background}
MOOD: ${scenario.mood}

IMPORTANT: When the rep mentions pests or treatments related to your scenario, bring up your specific problem naturally:
${scenario.id === 'ant_invasion' ? '- If they mention ants or kitchen: "We actually have ants in the kitchen right now"' : ''}
${scenario.id === 'spider_problem' ? '- If they mention spiders or exterior: "Yeah, we get spider webs on our eaves constantly"' : ''}
${scenario.id === 'dog_owner' ? '- If they mention treatments or yard: "Our Goldendoodle Bailey spends all day in the yard"' : ''}
${scenario.id === 'new_homeowner' ? '- If they mention prevention: "We just moved in two months ago"' : ''}

RESPONSE STYLE:
- Keep responses SHORT (1-2 sentences max)
- Be REACTIVE, not proactive - respond to what they say
- Don't volunteer information unless asked directly
- Be ${scenario.mood} in tone
- Only ask questions if they haven't addressed your main concern

Your priorities: ${scenario.priorities.join(', ')}
Potential objections: ${scenario.objections.join(', ')}
Close difficulty: ${scenario.closeThreshold}

Let the rep do the selling. You're just a homeowner responding to their pitch.`;
        
        // Reinforce Amanda's persona with session.update
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: scenarioInstructions,
            temperature: 0.8
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
          
          // Handle assistant text streaming
          if (ev.type === 'response.output_text.delta' && typeof ev.delta === 'string') {
            assistantBuf += ev.delta;
            setIsSpeaking(true);
          }
          if ((ev.type === 'response.output_text.done' || ev.type === 'response.completed') && assistantBuf.trim().length > 0) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'homeowner', text: assistantBuf, ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
            setIsSpeaking(false);
            assistantBuf = '';
          }
          
          // Handle user transcription
          if ((ev.type === 'input_audio_transcription.completed' || ev.type === 'conversation.item.input_audio_transcription.completed') && typeof ev.transcript === 'string' && ev.transcript.trim().length > 0) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: ev.transcript, ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
          }
          
          // Auto-respond after each user turn
          if (ev.type === "conversation.item.created" && ev.item?.role === "user") {
            dc.send(JSON.stringify({
              type: "response.create",
              response: { modalities: ["audio","text"], max_output_tokens: 55 }
            }));
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


