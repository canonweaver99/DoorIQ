'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Turn, Status } from './types';
import { playTTS, stopTTS } from './useRealtimeSession';

export function useElevenAgentSession(agentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);

  // Downsample Float32 to 16k Int16 PCM
  function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, targetRate = 16000): Int16Array {
    if (targetRate === inputSampleRate) {
      const out = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) out[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
      return out;
    }
    const ratio = inputSampleRate / targetRate;
    const newLen = Math.round(buffer.length / ratio);
    const out = new Int16Array(newLen);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < newLen) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      out[offsetResult] = Math.max(-1, Math.min(1, accum / count)) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return out;
  }

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
      
      // Get connection info from our secure endpoint
      const infoRes = await fetch(`/api/eleven/proxy?agent_id=${encodeURIComponent(agentId || '')}`);
      if (!infoRes.ok) throw new Error('Failed to get connection info');
      const { websocket_url, api_key } = await infoRes.json();
      // Browser WS cannot set headers; append token for now
      const authUrl = `${websocket_url}&authorization=${encodeURIComponent(api_key)}`;

      // Mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
      micStreamRef.current = stream;

      // WebSocket to ElevenLabs
      const ws = new WebSocket(authUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = async () => {
        setConnected(true); setStatus('listening'); startTimeRef.current = Date.now();
        // WebAudio pipeline for PCM16 @16k
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(ctx.destination); // keep node alive
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = downsampleBuffer(input, ctx.sampleRate, 16000);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(pcm16);
          }
        };
      };

      ws.onmessage = (evt) => {
        try {
          if (typeof evt.data === 'string') {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'text' && msg.text) {
              const t: Turn = { id: crypto.randomUUID(), speaker: 'homeowner', text: String(msg.text).trim(), ts: Date.now() };
              setTranscript(prev => [...prev.slice(-19), t]);
            }
            if (msg.type === 'transcript' && msg.text) {
              const t: Turn = { id: crypto.randomUUID(), speaker: 'rep', text: String(msg.text).trim(), ts: Date.now() };
              setTranscript(prev => [...prev.slice(-19), t]);
            }
          } else if (evt.data instanceof ArrayBuffer) {
            // Audio from agent
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
    // On user start, stop TTS to avoid overlap
    if (stream.getTracks()[0]?.enabled) stopTTS();
  }, []);

  const disconnect = useCallback(async () => {
    try {
      mediaRecorderRef.current?.stop();
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioCtxRef.current?.close();
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      wsRef.current?.close();
      setConnected(false); setStatus('idle'); setMicEnabled(true);
    } catch {}
  }, []);

  return { status, connected, error, transcript, isSpeaking, elapsedSeconds, micEnabled, connect, disconnect, toggleMic };
}
