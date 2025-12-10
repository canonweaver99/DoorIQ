'use client'

import { useState, useEffect } from 'react'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'

interface TranscriptEntry {
  speaker: 'user' | 'agent'
  text: string
  timestamp: Date
}

export default function ElevenLabsTestPage() {
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_7001k5jqfjmtejvs77jvhjf254tz')
  const [microphonePermission, setMicrophonePermission] = useState<string>('unknown')
  
  // Agent IDs
  const AUSTIN_AGENT_ID = 'agent_7001k5jqfjmtejvs77jvhjf254tz'
  const TEST_AGENT_ID = 'agent_9301kc4b2bbafq0s05pg5tmkcfwt'
  
  // Check microphone permission on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setMicrophonePermission(result.state)
        console.log('🎤 Microphone permission:', result.state)
        
        result.onchange = () => {
          setMicrophonePermission(result.state)
          console.log('🎤 Microphone permission changed:', result.state)
        }
      } catch (err) {
        console.warn('⚠️ Could not check microphone permission:', err)
        setMicrophonePermission('unavailable')
      }
    }
    
    checkMicrophonePermission()
  }, [])
  
  // Listen for connection status events, transcript events, and disconnect events
  useEffect(() => {
    const handleStatus = (e: CustomEvent) => {
      const status = e.detail as any
      console.log('📡 Connection status event:', status)
      setConnectionStatus(status)
    }
    
    const handleDisconnect = (e: CustomEvent) => {
      const details = e.detail
      console.log('🔌 Disconnect event received:', details)
    }
    
    const handleUserTranscript = (e: CustomEvent) => {
      const text = e.detail as string
      console.log('👤 User transcript:', text)
      if (text?.trim()) {
        setTranscript(prev => [...prev, { speaker: 'user', text: text.trim(), timestamp: new Date() }])
      }
    }
    
    const handleAgentTranscript = (e: CustomEvent) => {
      const text = e.detail as string
      console.log('🤖 Agent transcript:', text)
      if (text?.trim()) {
        setTranscript(prev => [...prev, { speaker: 'agent', text: text.trim(), timestamp: new Date() }])
      }
    }
    
    const handleEndCall = (e: CustomEvent) => {
      console.log('🚪 End call event:', e.detail)
    }
    
    const handleConnectionError = (e: CustomEvent) => {
      const errorDetails = e.detail as any
      console.error('❌ Connection error event:', errorDetails)
      
      // Build a user-friendly error message
      let errorMessage = 'Connection error occurred'
      if (errorDetails?.error) {
        errorMessage = errorDetails.error
      } else if (errorDetails?.name) {
        errorMessage = `Connection error: ${errorDetails.name}`
      }
      
      // Add more context if available
      if (errorDetails?.isConnectionError) {
        errorMessage += ' (WebRTC connection issue)'
      }
      
      setError(errorMessage)
      setConnectionStatus('error')
    }
    
    window.addEventListener('connection:status', handleStatus as EventListener)
    window.addEventListener('connection:error', handleConnectionError as EventListener)
    window.addEventListener('agent:disconnect', handleDisconnect as EventListener)
    window.addEventListener('agent:user', handleUserTranscript as EventListener)
    window.addEventListener('agent:response', handleAgentTranscript as EventListener)
    window.addEventListener('agent:end_call', handleEndCall as EventListener)
    
    return () => {
      window.removeEventListener('connection:status', handleStatus as EventListener)
      window.removeEventListener('connection:error', handleConnectionError as EventListener)
      window.removeEventListener('agent:disconnect', handleDisconnect as EventListener)
      window.removeEventListener('agent:user', handleUserTranscript as EventListener)
      window.removeEventListener('agent:response', handleAgentTranscript as EventListener)
      window.removeEventListener('agent:end_call', handleEndCall as EventListener)
    }
  }, [])
  
  const getToken = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus('disconnected')
    
    try {
      console.log('🎟️ Requesting conversation token for agent:', selectedAgentId)
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId: selectedAgentId,
          is_free_demo: true,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || errorData.details || 'Failed to get conversation token'
        console.error('❌ Token request failed:', errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      const token = data.conversation_token || data.token
      
      if (!token) {
        throw new Error('Token missing from response')
      }
      
      setConversationToken(token)
      console.log('✅ Got conversation token:', token.substring(0, 30) + '...')
      console.log('📋 Token details:', {
        length: token.length,
        preview: token.substring(0, 50),
      })
    } catch (err: any) {
      console.error('❌ Error getting token:', err)
      setError(err.message || 'Failed to get conversation token')
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleReset = () => {
    setConversationToken(null)
    setConnectionStatus('disconnected')
    setTranscript([])
    setError(null)
  }
  
  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log('🎤 Microphone permission check:', result.state)
      setMicrophonePermission(result.state)
      return result.state
    } catch (err) {
      console.warn('⚠️ Could not check microphone permission:', err)
      // Try to request access directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setMicrophonePermission('granted')
        return 'granted'
      } catch (e) {
        setMicrophonePermission('denied')
        return 'denied'
      }
    }
  }
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '✅ Connected - Speak now!'
      case 'connecting': return '🔄 Connecting...'
      case 'error': return '❌ Error'
      default: return '⚪ Disconnected'
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ElevenLabs WebRTC Connection Test</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Agent:</label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedAgentId(AUSTIN_AGENT_ID)
                  handleReset()
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedAgentId === AUSTIN_AGENT_ID
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Austin Rodriguez
              </button>
              <button
                onClick={() => {
                  setSelectedAgentId(TEST_AGENT_ID)
                  handleReset()
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedAgentId === TEST_AGENT_ID
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Test Agent
              </button>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p><strong>Selected Agent ID:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{selectedAgentId}</code></p>
            <p><strong>Connection Type:</strong> WebRTC</p>
            <p><strong>Microphone Permission:</strong> <span className={microphonePermission === 'granted' ? 'text-green-400' : microphonePermission === 'denied' ? 'text-red-400' : 'text-yellow-400'}>{microphonePermission}</span></p>
          </div>
          
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <button
              onClick={getToken}
              disabled={loading || !!conversationToken}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              {loading ? 'Getting Token...' : conversationToken ? 'Token Obtained ✅' : 'Start Conversation'}
            </button>
            
            {conversationToken && (
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors"
              >
                End &amp; Reset
              </button>
            )}
            
            <button
              onClick={checkMicrophonePermission}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors text-sm"
            >
              🔍 Check Mic Permission
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-300 font-semibold mb-2">Error: {error}</p>
              {error.includes('pc connection') || error.includes('peer connection') ? (
                <div className="text-sm text-red-200 space-y-1">
                  <p>💡 WebRTC Connection Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check browser console for detailed error messages</li>
                    <li>Ensure microphone permissions are granted</li>
                    <li>Try refreshing the page and starting again</li>
                    <li>Check if your network/firewall allows WebRTC connections</li>
                    <li>Verify the conversation token is valid (check Network tab)</li>
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
          {connectionStatus === 'connected' && (
            <p className="text-sm text-gray-400 mt-2">
              🎤 Microphone is active. Speak to Austin and he will respond via WebRTC.
            </p>
          )}
        </div>
        
        {/* Transcript Display */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Live Transcript</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transcript.length === 0 ? (
              <p className="text-gray-500 italic">No messages yet. Start a conversation to see the transcript.</p>
            ) : (
              transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    entry.speaker === 'user'
                      ? 'bg-blue-900/50 ml-12'
                      : 'bg-purple-900/50 mr-12'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {entry.speaker === 'user' ? '👤 You' : '🏠 Austin'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{entry.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        {conversationToken && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">🎙️ Conversation Active</h2>
            <p className="text-gray-300 mb-4">
              The WebRTC conversation component is running. Speak into your microphone and Austin will respond.
            </p>
            <p className="text-sm text-gray-500">
              Check the browser console for detailed connection and message logs.
            </p>
            
            <ElevenLabsConversation
              agentId={selectedAgentId}
              conversationToken={conversationToken}
              autostart={true}
              sessionId="test-session-123"
              sessionActive={true}
              onStatusChange={setConnectionStatus}
            />
          </div>
        )}
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>Token: {conversationToken ? conversationToken.substring(0, 50) + '...' : 'Not loaded'}</p>
            <p>Token Length: {conversationToken ? conversationToken.length : 'N/A'}</p>
            <p>Connection Status: <span className={getStatusColor()}>{connectionStatus}</span></p>
            <p>Agent ID: {selectedAgentId}</p>
            <p>Transcript Messages: {transcript.length}</p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">
                💡 Check browser console (F12) for detailed connection logs
              </p>
              <p className="text-xs text-yellow-400">
                🔍 Debugging Tips:
              </p>
              <ul className="text-xs text-gray-400 list-disc list-inside ml-2 space-y-1">
                <li>Check Network tab → Filter "WS" for WebSocket connections</li>
                <li>If Test Agent works but Austin doesn't → Check Austin's agent configuration</li>
                <li>If both fail → Network/firewall issue</li>
                <li>Try incognito mode to disable extensions</li>
                <li>Try mobile hotspot to bypass corporate firewall</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
