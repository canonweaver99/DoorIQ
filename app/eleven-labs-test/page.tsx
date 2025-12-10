'use client'

import { useState, useEffect } from 'react'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'

export default function ElevenLabsTestPage() {
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  
  // Austin's agent ID
  const AUSTIN_AGENT_ID = 'agent_7001k5jqfjmtejvs77jvhjf254tz'
  
  // Listen for connection status events
  useEffect(() => {
    const handleStatus = (e: CustomEvent) => {
      setConnectionStatus(e.detail as any)
    }
    
    window.addEventListener('connection:status', handleStatus as EventListener)
    
    return () => {
      window.removeEventListener('connection:status', handleStatus as EventListener)
    }
  }, [])
  
  const getToken = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId: AUSTIN_AGENT_ID,
          is_free_demo: true // Allow test without authentication
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to get conversation token')
      }
      
      const data = await response.json()
      setConversationToken(data.conversation_token)
      console.log('✅ Got conversation token:', data.conversation_token.substring(0, 30) + '...')
    } catch (err: any) {
      console.error('❌ Error getting token:', err)
      setError(err.message || 'Failed to get conversation token')
    } finally {
      setLoading(false)
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
      case 'connected': return '✅ Connected'
      case 'connecting': return '🔄 Connecting...'
      case 'error': return '❌ Error'
      default: return '⚪ Disconnected'
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ElevenLabs Connection Test</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Configuration</h2>
          <div className="space-y-2 mb-4">
            <p><strong>Agent:</strong> Average Austin</p>
            <p><strong>Agent ID:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{AUSTIN_AGENT_ID}</code></p>
            <p><strong>Connection Type:</strong> WebRTC</p>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={getToken}
              disabled={loading || !!conversationToken}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md font-medium"
            >
              {loading ? 'Getting Token...' : conversationToken ? 'Token Obtained ✅' : 'Get Conversation Token'}
            </button>
            
            {conversationToken && (
              <button
                onClick={() => {
                  setConversationToken(null)
                  setConnectionStatus('disconnected')
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium"
              >
                Reset
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            <div className="text-sm text-gray-400">
              Status: <span className="font-mono">{connectionStatus}</span>
            </div>
          </div>
        </div>
        
        {conversationToken && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">ElevenLabs Conversation</h2>
            <p className="text-gray-400 mb-4">
              The conversation component is active. Speak into your microphone and you should hear Austin respond.
            </p>
            <p className="text-sm text-gray-500">
              Check the browser console for detailed connection logs.
            </p>
            
            <ElevenLabsConversation
              agentId={AUSTIN_AGENT_ID}
              conversationToken={conversationToken}
              autostart={true}
              sessionId="test-session-123"
              sessionActive={true}
            />
          </div>
        )}
        
        <div className="bg-gray-900 rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>Token: {conversationToken ? conversationToken.substring(0, 50) + '...' : 'Not loaded'}</p>
            <p>Connection Status: {connectionStatus}</p>
            <p>Agent ID: {AUSTIN_AGENT_ID}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
