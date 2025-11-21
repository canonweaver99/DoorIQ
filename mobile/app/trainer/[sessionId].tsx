import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { sessionApi, elevenApi } from '../../lib/api/client'
import { formatDuration } from '../../lib/utils'
import { TranscriptEntry, Agent } from '../../lib/types'
import { supabase } from '../../lib/supabase/client'
import { ElevenLabsSession } from '../../components/trainer/ElevenLabsSession'
import { LiveMetricsPanel } from '../../components/trainer/LiveMetricsPanel'
import { LiveFeedbackFeed } from '../../components/trainer/LiveFeedbackFeed'
import { useLiveSessionAnalysis } from '../../hooks/useLiveSessionAnalysis'

export default function TrainingSessionScreen() {
  const params = useLocalSearchParams<{ sessionId: string; agent?: string }>()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId === 'new' ? null : params.sessionId)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<ScrollView>(null)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [activeTab, setActiveTab] = useState<'transcript' | 'feedback'>('transcript')

  // Live session analysis
  const { feedbackItems, metrics } = useLiveSessionAnalysis(transcript)

  useEffect(() => {
    if (params.sessionId === 'new' && params.agent) {
      initializeNewSession(params.agent)
    } else if (sessionId) {
      loadExistingSession()
    }
  }, [params.sessionId, params.agent])

  const initializeNewSession = async (agentId: string) => {
    try {
      setLoading(true)
      
      // Fetch agent details
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('eleven_agent_id', agentId)
        .eq('is_active', true)
        .single()

      if (!agent) {
        alert('Agent not found')
        router.back()
        return
      }

      setSelectedAgent(agent)

      // Get conversation token
      const tokenData = await elevenApi.getConversationToken(agentId)
      if (!tokenData.conversation_token) {
        alert('Failed to get conversation token')
        setLoading(false)
        return
      }

      setConversationToken(tokenData.conversation_token)

      // Create session record
      const sessionData = await sessionApi.create(agent.name)
      if (!sessionData.id) {
        alert('Failed to create session')
        setLoading(false)
        return
      }

      setSessionId(sessionData.id)
      setSessionActive(true)
      setLoading(false)

      // Start timer
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      // Deduct credit
      await sessionApi.increment()
    } catch (error: any) {
      console.error('Error initializing session:', error)
      alert(error.message || 'Failed to start session')
      setLoading(false)
    }
  }

  const loadExistingSession = async () => {
    // For viewing past sessions - implement later
    router.back()
  }

  const pushTranscript = useCallback((text: string, speaker: 'user' | 'homeowner') => {
    if (!text || typeof text !== 'string' || !text.trim()) return

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date(),
    }

    setTranscript((prev) => [...prev, entry])
  }, [])

  const endSession = useCallback(async () => {
    if (!sessionId) return

    setSessionActive(false)
    setConversationToken(null)

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }

    try {
      await sessionApi.update(sessionId, {
        transcript,
        duration_seconds: duration,
        end_reason: 'manual',
      })

      router.replace('/dashboard')
    } catch (error) {
      console.error('Error ending session:', error)
      router.replace('/dashboard')
    }
  }, [sessionId, transcript, duration, router])

  useEffect(() => {
    // Listen for transcript events from ElevenLabsSession
    const handleUserEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        pushTranscript(e.detail, 'user')
      }
    }

    const handleAgentEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        pushTranscript(e.detail, 'homeowner')
      }
    }

    // Using a custom event system for mobile
    const EventEmitter = require('react-native').DeviceEventEmitter || require('EventEmitter')
    if (EventEmitter) {
      EventEmitter.addListener('agent:user', handleUserEvent)
      EventEmitter.addListener('agent:response', handleAgentEvent)
    }

    return () => {
      if (EventEmitter) {
        EventEmitter.removeListener('agent:user', handleUserEvent)
        EventEmitter.removeListener('agent:response', handleAgentEvent)
      }
    }
  }, [pushTranscript])

  if (loading || !selectedAgent) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Starting session...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, sessionActive && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {sessionActive ? 'Live Session' : 'Session Ended'}
            </Text>
          </View>
          <Text style={styles.timer}>{formatDuration(duration)}</Text>
        </View>
        {sessionActive && (
          <TouchableOpacity style={styles.endButton} onPress={endSession}>
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Webcam Container - Shows camera when active, placeholder when inactive */}
      <View style={styles.agentContainer}>
        {sessionActive && cameraPermission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="front"
          />
        ) : sessionActive && !cameraPermission?.granted ? (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>Camera permission needed</Text>
            <TouchableOpacity 
              style={styles.permissionButton} 
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.agentImagePlaceholder}>
              <Text style={styles.agentImageText}>{selectedAgent.name.charAt(0)}</Text>
            </View>
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>{selectedAgent.name}</Text>
            </View>
          </>
        )}
      </View>

      {/* Live Metrics Panel */}
      {sessionActive && transcript.length > 0 && (
        <View style={styles.metricsContainer}>
          <LiveMetricsPanel metrics={metrics} />
        </View>
      )}

      {/* Tab Selector */}
      {sessionActive && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transcript' && styles.tabActive]}
            onPress={() => setActiveTab('transcript')}
          >
            <Text style={[styles.tabText, activeTab === 'transcript' && styles.tabTextActive]}>
              Transcript
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feedback' && styles.tabActive]}
            onPress={() => setActiveTab('feedback')}
          >
            <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>
              Feedback {feedbackItems.length > 0 && `(${feedbackItems.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Area - Transcript or Feedback */}
      {activeTab === 'transcript' ? (
        <ScrollView
          ref={transcriptEndRef}
          style={styles.transcriptContainer}
          contentContainerStyle={styles.transcriptContent}
          onContentSizeChange={() => {
            transcriptEndRef.current?.scrollToEnd({ animated: true })
          }}
        >
          {transcript.length === 0 ? (
            <View style={styles.emptyTranscript}>
              <Text style={styles.emptyText}>
                {sessionActive
                  ? 'Waiting for conversation to begin...'
                  : `Knock on ${selectedAgent.name}'s door to start your practice session`}
              </Text>
            </View>
          ) : (
            transcript.map((entry) => {
              const isUser = entry.speaker === 'user'
              return (
                <View
                  key={entry.id}
                  style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}
                >
                  <Text style={styles.speakerLabel}>
                    {isUser ? 'You' : selectedAgent.name}
                  </Text>
                  <Text style={styles.messageText}>{entry.text}</Text>
                </View>
              )
            })
          )}
        </ScrollView>
      ) : (
        <View style={styles.feedbackContainer}>
          <LiveFeedbackFeed feedbackItems={feedbackItems} />
        </View>
      )}

      {/* ElevenLabs Session Component */}
      {sessionActive && conversationToken && selectedAgent && (
        <ElevenLabsSession
          agentId={selectedAgent.eleven_agent_id}
          conversationToken={conversationToken}
          sessionId={sessionId}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timer: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  endButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  agentContainer: {
    height: 180,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  feedbackContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraPlaceholderText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  agentImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentImageText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  transcriptContainer: {
    flex: 1,
  },
  transcriptContent: {
    padding: 16,
  },
  emptyTranscript: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: '#1f2937',
    alignSelf: 'flex-start',
  },
  speakerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
})

