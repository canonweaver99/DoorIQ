'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';

export function useRealtimeSession() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const tokensInRef = useRef(0);
  const tokensOutRef = useRef(0);

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

      const s = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }).then(r => r.json());
      setSessionId(s.sessionId);

      const tok = await fetch('/api/rt/token', { cache: 'no-store' }).then(r => r.json());
      const clientSecret = tok?.client_secret?.value || tok?.client_secret?.secret || tok?.client_secret?.token || tok?.client_secret?.key || tok?.client_secret?.data || tok?.client_secret?.Value || tok?.client_secret?.VALUE || tok?.client_secret?.value; // resilient
      if (!clientSecret) throw new Error('No realtime token');

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remote = new MediaStream();
      if (audioRef.current) {
        audioRef.current.srcObject = remote;
        // Safari inline
        (audioRef.current as any).playsInline = true;
      }
      pc.ontrack = (e) => remote.addTrack(e.track);

      const dc = pc.createDataChannel('oai-events');
      let assistantBuf = '';
      dc.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'response.output_text.delta' && typeof msg.delta === 'string') {
            assistantBuf += msg.delta;
            setIsSpeaking(true);
          }
          if ((msg.type === 'response.output_text.done' || msg.type === 'response.completed') && assistantBuf.trim().length > 0) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'homeowner', text: assistantBuf, ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
            setIsSpeaking(false);
            assistantBuf = '';
            if (sessionId) {
              try { await fetch('/api/turns', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, speaker: 'homeowner', text: t.text, ts: new Date(t.ts).toISOString() }) }); } catch {}
            }
          }
          if ((msg.type === 'input_audio_transcription.completed' || msg.type === 'conversation.item.input_audio_transcription.completed') && typeof msg.transcript === 'string' && msg.transcript.trim().length > 0) {
            const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: msg.transcript, ts: Date.now() };
            setTranscript(prev => [...prev.slice(-19), t]);
            if (sessionId) {
              try { await fetch('/api/turns', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, speaker: 'rep', text: t.text, ts: new Date(t.ts).toISOString() }) }); } catch {}
            }
          }
          if ((msg.type === 'conversation.session.ended' || msg.type === 'session.ended') && sessionId) {
            try { await fetch('/api/session/end', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId }) }); } catch {}
          }
        } catch {}
      };

      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      media.getTracks().forEach(t => pc.addTrack(t, media));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
          'openai-beta': 'realtime=v1'
        },
        body: offer.sdp || ''
      });
      if (!sdpRes.ok) throw new Error(await sdpRes.text());
      const answer = { type: 'answer', sdp: await sdpRes.text() } as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);

      startTimeRef.current = Date.now();
      setConnected(true);
      setStatus('listening');
    } catch (e: any) {
      setError(e?.message || 'connect_failed');
      setStatus('error');
    }
  }, [sessionId]);

  const disconnect = useCallback(async () => {
    try {
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.close();
      setConnected(false);
      setStatus('idle');
    } catch {}
  }, []);

  return {
    pcRef,
    audioRef,
    status,
    error,
    connected,
    sessionId,
    transcript,
    isSpeaking,
    elapsedSeconds,
    audioSeconds,
    tokensIn: tokensInRef.current,
    tokensOut: tokensOutRef.current,
    setAudioElement,
    connect,
    disconnect
  };
}


