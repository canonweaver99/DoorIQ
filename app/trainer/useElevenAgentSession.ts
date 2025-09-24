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

  // VAD controls
  const userSpeakingRef = useRef(false);
  const lastVoiceEventTsRef = useRef(0);
  const minStartMs = 80;       // must exceed threshold for at least this long
  const minStopMs = 300;       // silence required to consider user stopped
  const vadThreshold = 0.015;  // tweakable amplitude threshold
  let aboveCount = 0;
  let belowCount = 0;

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
      
      const infoRes = await fetch(`/api/eleven/proxy?agent_id=${encodeURIComponent(agentId || '')}`);
      if (!infoRes.ok) throw new Error('Failed to get connection info');
      const { websocket_url, api_key } = await infoRes.json();
      const authUrl = `${websocket_url}&authorization=${encodeURIComponent(api_key)}`;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
      micStreamRef.current = stream;

      const ws = new WebSocket(authUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = async () => {
        setConnected(true); setStatus('listening'); startTimeRef.current = Date.now();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(ctx.destination);
        const frameMs = (processor.bufferSize / ctx.sampleRate) * 1000;
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          // VAD: RMS
          let sum = 0;
          for (let i = 0; i < input.length; i++) { const v = input[i]; sum += v * v; }
          const rms = Math.sqrt(sum / input.length);
          const now = performance.now();

          if (rms > vadThreshold) {
            aboveCount += frameMs;
            belowCount = 0;
            if (!userSpeakingRef.current && aboveCount >= minStartMs) {
              userSpeakingRef.current = true;
              lastVoiceEventTsRef.current = now;
              stopTTS(); // cut agent immediately
            }
          } else {
            belowCount += frameMs;
            aboveCount = 0;
            if (userSpeakingRef.current && belowCount >= minStopMs) {
              userSpeakingRef.current = false;
              lastVoiceEventTsRef.current = now;
            }
          }

          // Always send audio to agent; their VAD decides when to respond
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
            // Drop agent audio while user is speaking to avoid overlap
            if (userSpeakingRef.current) return;
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
    if (stream.getTracks()[0]?.enabled) { userSpeakingRef.current = true; stopTTS(); } else { userSpeakingRef.current = false; }
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
      userSpeakingRef.current = false;
    } catch {}
  }, []);

  return { status, connected, error, transcript, isSpeaking, elapsedSeconds, micEnabled, connect, disconnect, toggleMic };
}
