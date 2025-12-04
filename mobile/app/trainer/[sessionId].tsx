import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  InteractionManager,
  Platform,
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
  const transcriptEndRef = useRef<FlatList>(null)
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
      setLoading(false)
    } catch (error: any) {
      console.error('Error initializing session:', error)
      alert(error.message || 'Failed to load agent')
      setLoading(false)
    }
  }

  const startSession = useCallback(async () => {
    if (!selectedAgent) return

    try {
      setLoading(true)

      // Get conversation token
      const tokenData = await elevenApi.getConversationToken(selectedAgent.eleven_agent_id)
      if (!tokenData.conversation_token) {
        alert('Failed to get conversation token')
        setLoading(false)
        return
      }

      setConversationToken(tokenData.conversation_token)

      // Create session record
      const sessionData = await sessionApi.create(selectedAgent.name)
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
      console.error('Error starting session:', error)
      alert(error.message || 'Failed to start session')
      setLoading(false)
    }
  }, [selectedAgent])

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

    // Use InteractionManager to defer transcript updates during interactions
    InteractionManager.runAfterInteractions(() => {
      setTranscript((prev) => [...prev, entry])
    })
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
              {sessionActive ? 'Live Session' : 'Ready'}
            </Text>
          </View>
          {sessionActive && <Text style={styles.timer}>{formatDuration(duration)}</Text>}
        </View>
      </View>

      {/* Start/End Call Buttons - Above Webcam */}
      <View style={styles.buttonContainer}>
        {!sessionActive ? (
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startSession}
            disabled={loading || !selectedAgent}
          >
            <Text style={styles.startButtonText}>
              {loading ? 'Starting...' : selectedAgent ? `Start Session with ${selectedAgent.name}` : 'Start Session'}
            </Text>
          </TouchableOpacity>
        ) : (
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
          <LiveMetricsPanel 
            metrics={metrics} 
            transcript={transcript}
            sessionId={sessionId}
            sessionActive={sessionActive}
            agentName={selectedAgent?.name}
          />
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
        transcript.length === 0 ? (
          <View style={styles.emptyTranscript}>
            <Text style={styles.emptyText}>
              {sessionActive
                ? 'Waiting for conversation to begin...'
                : `Knock on ${selectedAgent.name}'s door to start your practice session`}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={transcriptEndRef}
            data={transcript}
            keyExtractor={(item) => item.id}
            style={styles.transcriptContainer}
            contentContainerStyle={styles.transcriptContent}
            renderItem={({ item: entry }) => {
              const isUser = entry.speaker === 'user'
              return (
                <View
                  style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}
                >
                  <Text style={styles.speakerLabel}>
                    {isUser ? 'You' : selectedAgent.name}
                  </Text>
                  <Text style={styles.messageText}>{entry.text}</Text>
                </View>
              )
            }}
            onContentSizeChange={() => {
              transcriptEndRef.current?.scrollToEnd({ animated: true })
            }}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
          />
        )
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
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  timer: {
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  startButton: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    borderRadius: Platform.OS === 'ios' ? 14 : 12,
    paddingVertical: Platform.OS === 'ios' ? 16 : 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  endButton: {
    backgroundColor: Platform.OS === 'ios' ? '#FF3B30' : '#FF3B30',
    borderRadius: Platform.OS === 'ios' ? 14 : 12,
    paddingVertical: Platform.OS === 'ios' ? 16 : 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: Platform.OS === 'ios' ? '#FF3B30' : '#FF3B30',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  agentContainer: {
    height: 180,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    borderBottomWidth: Platform.OS === 'ios' ? 2 : 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '500' : '500',
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  tabTextActive: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#fff',
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
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
    padding: Platform.OS === 'ios' ? 14 : 12,
    borderRadius: Platform.OS === 'ios' ? 18 : 12,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#1f2937',
    alignSelf: 'flex-start',
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: Platform.OS === 'ios' ? 0.5 : 0,
  },
  messageText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    lineHeight: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
})

