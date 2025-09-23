'use client';
import { Suspense } from 'react';
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Trainer() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading…</div>}>
      <TrainerInner />
    </Suspense>
  );
}

function TrainerInner() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [connected, setConnected] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
      // Load homeowner avatar (from Supabase agents or scenarios)
      try {
        const agent = await fetch('/api/agent', { cache: 'no-store' }).then(r => r.json());
        setAvatarUrl(agent?.avatar_url || null);
      } catch {}

      // Create DB session for logging
      try {
        const s = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }).then(r => r.json());
        setSessionId(s.sessionId);
      } catch {}

      // 1) Get ephemeral token
      const tokRes = await fetch("/api/rt/token", { cache: 'no-store' });
      const tok = await tokRes.json();
      if (!tok?.client_secret?.value) throw new Error('No realtime token');

      // 2) WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3) Remote audio
      const remoteStream = new MediaStream();
      if (audioRef.current) audioRef.current.srcObject = remoteStream;
      pc.ontrack = (e) => remoteStream.addTrack(e.track);

      // 4) Data channel for events
      const dc = pc.createDataChannel("oai-events");
      let assistantBuffer = '';
      dc.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // assistant stream
          if (msg.type === 'response.output_text.delta' && typeof msg.delta === 'string') {
            assistantBuffer += msg.delta;
          }
          if ((msg.type === 'response.output_text.done' || msg.type === 'response.completed') && assistantBuffer.trim().length > 0) {
            if (sessionId) {
              try { await fetch('/api/turns/add', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, speaker: 'homeowner', text: assistantBuffer, ts: new Date().toISOString() }) }); } catch {}
            }
            assistantBuffer = '';
          }
          // user transcript
          if ((msg.type === 'input_audio_transcription.completed' || msg.type === 'conversation.item.input_audio_transcription.completed') && typeof msg.transcript === 'string' && msg.transcript.trim().length > 0) {
            if (sessionId) {
              try { await fetch('/api/turns/add', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, speaker: 'rep', text: msg.transcript, ts: new Date().toISOString() }) }); } catch {}
            }
          }
        } catch {}
      };

      // 5) Mic
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      media.getTracks().forEach((t) => pc.addTrack(t, media));

      // 6) Offer
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);

      // 7) Exchange SDP
      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tok.client_secret.value}`,
            "Content-Type": "application/sdp",
            "openai-beta": "realtime=v1",
          },
          body: offer.sdp || ''
        }
      );

      if (!sdpRes.ok) {
        const err = await sdpRes.text();
        throw new Error(`SDP exchange failed: ${err}`);
      }

      const answer = { type: "answer", sdp: await sdpRes.text() } as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);

      setConnected(true);
    } catch (e: any) {
      setError(e?.message || 'start_failed');
    }
  }

  async function stop() {
    try {
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    setConnected(false);
  }

  // Auto-start if ?autostart=1
  useEffect(() => {
    const a = search?.get('autostart');
    if (a === '1' && !connected) {
      start().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Large Centered Avatar Only */}
        <div className="relative w-48 h-48 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white/20 shadow-2xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Homeowner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
          )}
        </div>

        {/* Minimal controls */}
        <div className="space-x-3">
          {!connected ? (
            <button className="px-6 py-3 bg-white text-black rounded" onClick={start}>Start Conversation</button>
          ) : (
            <button className="px-6 py-3 bg-white/10 text-white rounded border border-white/20" onClick={stop}>End</button>
          )}
        </div>
        {error && <p className="text-red-400 mt-3">{error}</p>}
      </div>
      <audio ref={audioRef} autoPlay />
    </div>
  );
}


