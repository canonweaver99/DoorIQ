'use client';
import { useEffect, useRef, useState } from "react";

export default function Trainer() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
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
      dc.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // TODO: log to Supabase turns if desired
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

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 text-white">
      <h1 className="text-xl font-semibold">DoorIQ Trainer (WebRTC)</h1>
      <div className="flex gap-2">
        {!connected ? (
          <button className="px-4 py-2 bg-blue-600 rounded" onClick={start}>Start</button>
        ) : (
          <button className="px-4 py-2 bg-gray-600 rounded" onClick={stop}>End</button>
        )}
      </div>
      {error && <p className="text-red-400">{error}</p>}
      <audio ref={audioRef} autoPlay />
    </div>
  );
}


