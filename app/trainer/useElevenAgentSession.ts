'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';
import { playTTS, stopTTS } from './useRealtimeSession';

export function useElevenAgentSession(agentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async () => {
    try {
      setStatus('connecting'); setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
      micStreamRef.current = stream;

      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = rec;

      const url = `/api/eleven/proxy?agent_id=${encodeURIComponent(agentId || '')}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        setConnected(true); setStatus('listening'); startTimeRef.current = Date.now();
        // Start sending mic chunks
        rec.start(250);
        rec.ondataavailable = (evt) => {
          const chunk = evt.data;
          if (chunk && ws.readyState === WebSocket.OPEN) {
            ws.send(chunk);
          }
        };
      };

      ws.onmessage = async (evt) => {
        try {
          if (typeof evt.data === 'string') {
            // Assume JSON with minimal schema: { type: 'transcript' | 'text' | 'control', text?: string }
            const msg = JSON.parse(evt.data);
            if (msg.type === 'text' && msg.text) {
              // Use as assistant transcript
              const t: Turn = { id: crypto.randomUUID(), speaker: 'homeowner', text: msg.text.trim(), ts: Date.now() };
              setTranscript(prev => [...prev.slice(-19), t]);
            }
            if (msg.type === 'transcript' && msg.text) {
              const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: msg.text.trim(), ts: Date.now() };
              setTranscript(prev => [...prev.slice(-19), t]);
            }
          } else if (evt.data instanceof ArrayBuffer) {
            // Treat as audio from agent
            stopTTS();
            playTTS(evt.data);
            setIsSpeaking(true);
          }
        } catch {}
      };

      ws.onclose = () => { setConnected(false); setStatus('idle'); };
      ws.onerror = () => { setError('ws_error'); setStatus('error'); };
    } catch (e: any) {
      setError(e?.message || 'connect_failed'); setStatus('error');
    }
  }, [agentId]);

  const toggleMic = useCallback(() => {
    const stream = micStreamRef.current; if (!stream) return;
    for (const track of stream.getTracks()) { track.enabled = !track.enabled; }
    setMicEnabled(stream.getTracks()[0]?.enabled ?? true);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      mediaRecorderRef.current?.stop();
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      wsRef.current?.close();
      setConnected(false); setStatus('idle'); setMicEnabled(true);
    } catch {}
  }, []);

  return { status, connected, error, transcript, isSpeaking, elapsedSeconds, micEnabled, connect, disconnect, toggleMic };
}
