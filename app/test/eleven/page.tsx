'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@elevenlabs/client'
import { useConversation } from '@elevenlabs/react'

const DEFAULT_AGENT_ID = 'agent_7001k5jqfjmtejvs77jvhjf254tz'

export default function ElevenLabsTestPage() {
  const [agentId, setAgentId] = useState<string>(DEFAULT_AGENT_ID)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [sdkVersion, setSdkVersion] = useState<string>('unknown')
  const [connectionType, setConnectionType] = useState<'websocket' | 'webrtc'>('websocket')
  const wsRef = useRef<WebSocket | null>(null)

  const appendLog = useCallback((msg: string, data?: unknown) => {
    const timestamp = new Date().toISOString()
    const line = data !== undefined ? `${timestamp} ${msg} ${safeStringify(data)}` : `${timestamp} ${msg}`
    // eslint-disable-next-line no-console
    console.log(line)
    setLogs(prev => [line, ...prev].slice(0, 500))
  }, [])

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const res = await fetch('/api/eleven/sdk-version')
        const data = await res.json().catch(() => ({}))
        if (data?.version) {
          setSdkVersion(String(data.version))
          appendLog(`@elevenlabs/client version: ${data.version}`)
        } else {
          appendLog('Failed to get @elevenlabs/client version from API', data)
        }
      } catch (e) {
        appendLog('Failed to fetch @elevenlabs/client version', e)
      }
    }
    loadVersion()
  }, [appendLog])

  const testDirectConnection = useCallback(async () => {
    appendLog('🧪 Testing direct connection without signed URL...')
    if (!Conversation) {
      appendLog('Conversation API not available. Is @elevenlabs/client installed?')
      return
    }
    try {
      setStatus('connecting')
      await ensureMicPermission(appendLog)

      const convo = await Conversation.startSession({
        agentId,
        connectionType,
        onConnect: () => {
          appendLog('✅ Direct connection successful!')
          setStatus('connected')
        },
        onMessage: (message: any) => appendLog('📨 Message received:', message),
        onError: (error: unknown) => appendLog('❌ Direct connection error:', error),
        onDisconnect: () => appendLog('🔌 Disconnected'),
      })
      appendLog('Conversation object:', convo)
    } catch (error) {
      appendLog('❌ Direct connection failed:', error)
      setStatus('error')
    }
  }, [Conversation, agentId, appendLog, connectionType])

  const testSignedUrlConnection = useCallback(async () => {
    appendLog('🧪 Testing connection via signed URL...')
    if (!Conversation) {
      appendLog('Conversation API not available. Is @elevenlabs/client installed?')
      return
    }
    try {
      setStatus('connecting')
      await ensureMicPermission(appendLog)

      const response = await fetch('/api/eleven/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      appendLog('Signed URL response status:', response.status)
      const data = await safeParseJson(response)
      appendLog('Signed URL response body:', data)

      if (!response.ok) {
        appendLog('❌ Signed URL fetch failed')
        setStatus('error')
        return
      }

      if (data?.signed_url) {
        const convo = await Conversation.startSession({
          signedUrl: data.signed_url,
          connectionType,
          onConnect: () => {
            appendLog('✅ Signed URL connection successful!')
            setStatus('connected')
          },
          onMessage: (message: any) => appendLog('📨 Message received:', message),
          onError: (error: unknown) => appendLog('❌ Signed URL connection error:', error),
        })
        appendLog('Conversation object:', convo)
      } else {
        appendLog('❌ No signed_url in response')
        setStatus('error')
      }
    } catch (e) {
      appendLog('❌ Signed URL test failed:', e)
      setStatus('error')
    }
  }, [agentId, appendLog, connectionType])

  const testWebRTCToken = useCallback(async () => {
    appendLog('🧪 Testing WebRTC connection via conversation token...')
    if (!Conversation) {
      appendLog('Conversation API not available. Is @elevenlabs/client installed?')
      return
    }
    try {
      setStatus('connecting')
      await ensureMicPermission(appendLog)

      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      appendLog('WebRTC Token response status:', response.status)
      const data = await safeParseJson(response)
      appendLog('WebRTC Token response body:', data)

      if (!response.ok) {
        appendLog('❌ WebRTC Token fetch failed')
        setStatus('error')
        return
      }

      if (data?.conversation_token) {
        const convo = await Conversation.startSession({
          conversationToken: data.conversation_token,
          connectionType: 'webrtc',
          onConnect: () => {
            appendLog('✅ WebRTC connection successful!')
            setStatus('connected')
          },
          onMessage: (message: any) => appendLog('📨 Message received:', message),
          onError: (error: unknown) => appendLog('❌ WebRTC connection error:', error),
          onDisconnect: () => appendLog('🔌 Disconnected'),
        })
        appendLog('Conversation object:', convo)
      } else {
        appendLog('❌ No conversation_token in response')
        setStatus('error')
      }
    } catch (e) {
      appendLog('❌ WebRTC Token test failed:', e)
      setStatus('error')
    }
  }, [agentId, appendLog])

  const testRawWebSocket = useCallback(async () => {
    appendLog('🧪 Testing raw WebSocket connection via signed URL...')
    try {
      const response = await fetch('/api/eleven/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      appendLog('Signed URL response status (raw ws):', response.status)
      const data = await safeParseJson(response)
      appendLog('Signed URL response body (raw ws):', data)

      if (!response.ok || !data?.signed_url) {
        appendLog('❌ Failed to obtain signed URL for raw ws test')
        setStatus('error')
        return
      }

      const signedUrl: string = data.signed_url
      appendLog('Connecting raw WebSocket to:', signedUrl)
      const ws = new WebSocket(signedUrl)
      wsRef.current = ws

      ws.onopen = () => {
        appendLog('✅ Raw WebSocket connected!')
        setStatus('connected')
        try {
          ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }))
          appendLog('➡️ Sent initiation message on raw WebSocket')
        } catch (e) {
          appendLog('Failed to send initiation message:', e)
        }
      }
      ws.onmessage = (event) => {
        appendLog('📨 Raw message:', event.data)
      }
      ws.onerror = (error) => {
        appendLog('❌ Raw WebSocket error:', error)
        setStatus('error')
      }
      ws.onclose = (event) => {
        appendLog(`🔌 Raw WebSocket closed: code=${event.code} reason=${event.reason}`)
      }
    } catch (error) {
      appendLog('Raw WebSocket test failed:', error)
      setStatus('error')
    }
  }, [agentId, appendLog])

  const stopRawWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      appendLog('Closing raw WebSocket...')
      wsRef.current.close(1000, 'Client requested close')
    }
  }, [appendLog])

  const reactHookConnection = useConversation({
    onConnect: () => appendLog('🔗 Hook onConnect'),
    onDisconnect: () => appendLog('🔌 Hook onDisconnect'),
    onMessage: (m: unknown) => appendLog('📨 Hook onMessage', m),
    onError: (e: unknown) => appendLog('❌ Hook onError', e),
  } as any)

  const testHookStart = useCallback(async () => {
    if (!reactHookConnection) {
      appendLog('useConversation hook not available')
      return
    }
    try {
      setStatus('connecting')
      await ensureMicPermission(appendLog)
      await reactHookConnection.startSession({
        agentId,
        connectionType,
      })
      appendLog('Hook startSession called')
    } catch (e) {
      appendLog('Hook startSession failed', e)
      setStatus('error')
    }
  }, [agentId, appendLog, connectionType, reactHookConnection])

  const testHookStop = useCallback(async () => {
    if (!reactHookConnection) return
    try {
      await reactHookConnection.endSession()
      appendLog('Hook endSession called')
    } catch (e) {
      appendLog('Hook endSession failed', e)
    }
  }, [appendLog, reactHookConnection])

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>ElevenLabs Connection Tests</h2>
      <div style={{ marginTop: 8, marginBottom: 8 }}>Status: {status}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Agent ID:
          <input
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
            style={{ marginLeft: 8, padding: 4, width: 420 }}
          />
        </label>
        <label style={{ marginLeft: 12 }}>
          Connection Type:
          <select
            value={connectionType}
            onChange={e => setConnectionType(e.target.value as 'websocket' | 'webrtc')}
            style={{ marginLeft: 8, padding: 4 }}
          >
            <option value="websocket">WebSocket</option>
            <option value="webrtc">WebRTC</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>SDK: {sdkVersion}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button onClick={testDirectConnection} style={btnStyle}>Test Direct Connection</button>
        <button onClick={testWebRTCToken} style={btnStyle}>Test WebRTC Token</button>
        <button onClick={testSignedUrlConnection} style={btnStyle}>Test Signed URL Connection</button>
        <button onClick={testRawWebSocket} style={btnStyle}>Test Raw WebSocket</button>
        <button onClick={stopRawWebSocket} style={btnStyle}>Stop Raw WebSocket</button>
        <button onClick={testHookStart} style={btnStyle}>Hook Start</button>
        <button onClick={testHookStop} style={btnStyle}>Hook Stop</button>
      </div>

      <details open>
        <summary>Logs</summary>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#cde2ff', padding: 12, borderRadius: 8, maxHeight: 420, overflow: 'auto' }}>
{logs.join('\n')}
        </pre>
      </details>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

function safeStringify(data: unknown): string {
  try {
    if (data instanceof Event) return `[Event type=${(data as Event).type}]`
    if (data && typeof data === 'object') return JSON.stringify(data, replacer, 2)
    return String(data)
  } catch {
    try {
      return String(data)
    } catch {
      return '[unserializable]'
    }
  }
}

function replacer(_key: string, value: unknown) {
  if (value instanceof ArrayBuffer) return `[ArrayBuffer byteLength=${value.byteLength}]`
  if (value instanceof Blob) return `[Blob size=${value.size}]`
  if (typeof value === 'function') return `[Function]`
  if (value === undefined) return '[undefined]'
  return value as any
}

async function ensureMicPermission(log: (m: string, d?: unknown) => void) {
  try {
    log('🎤 Requesting microphone permission...')
    await navigator.mediaDevices.getUserMedia({ audio: true })
    log('✅ Microphone permission granted')
  } catch (e) {
    log('❌ Microphone permission denied:', e)
    throw e
  }
}

async function safeParseJson(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    return { parse_error: true, raw: text, error: String(e) }
  }
}


