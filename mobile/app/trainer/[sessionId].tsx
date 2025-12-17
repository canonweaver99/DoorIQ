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
  Modal,
  Animated,
  Dimensions,
  DeviceEventEmitter,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { sessionApi, elevenApi } from '../../lib/api/client'
import { formatDuration } from '../../lib/utils'
import { TranscriptEntry, Agent } from '../../lib/types'
import { supabase } from '../../lib/supabase/client'
import { ElevenLabsSession } from '../../components/trainer/ElevenLabsSession'
import { LiveFeedbackFeed } from '../../components/trainer/LiveFeedbackFeed'
import { useLiveSessionAnalysis } from '../../hooks/useLiveSessionAnalysis'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function TrainingSessionScreen() {
  const params = useLocalSearchParams<{ sessionId: string; agent?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
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
  const [sheetVisible, setSheetVisible] = useState(false)
  const [hasShownSheet, setHasShownSheet] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  // Live session analysis
  const { feedbackItems, metrics } = useLiveSessionAnalysis(transcript)

  // iOS Sheet Modal Animation
  const showSheet = useCallback(() => {
    setSheetVisible(true)
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [sheetTranslateY])

  const hideSheet = useCallback(() => {
    Animated.spring(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setSheetVisible(false)
    })
  }, [sheetTranslateY])

  // Show sheet automatically once when content first appears
  useEffect(() => {
    if (sessionActive && (transcript.length > 0 || feedbackItems.length > 0) && !hasShownSheet && !sheetVisible) {
      setHasShownSheet(true)
      showSheet()
    }
  }, [sessionActive, transcript.length, feedbackItems.length, hasShownSheet, sheetVisible, showSheet])
  
  // Reset hasShownSheet when session ends
  useEffect(() => {
    if (!sessionActive) {
      setHasShownSheet(false)
      hideSheet()
    }
  }, [sessionActive, hideSheet])

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
        Alert.alert('Error', 'Agent not found')
        router.back()
        return
      }

      setSelectedAgent(agent)
      setLoading(false)
    } catch (error: any) {
      console.error('Error initializing session:', error)
      Alert.alert('Error', error.message || 'Failed to load agent')
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
        Alert.alert('Error', 'Failed to get conversation token')
        setLoading(false)
        return
      }

      setConversationToken(tokenData.conversation_token)

      // Create session record
      const sessionData = await sessionApi.create(selectedAgent.name)
      if (!sessionData.id) {
        Alert.alert('Error', 'Failed to create session')
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
      Alert.alert('Error', error.message || 'Failed to start session')
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

    // Using DeviceEventEmitter from react-native for mobile
    DeviceEventEmitter.addListener('agent:user', handleUserEvent)
    DeviceEventEmitter.addListener('agent:response', handleAgentEvent)

    return () => {
      // @ts-ignore - removeListener exists but TypeScript types may be incomplete
      DeviceEventEmitter.removeListener?.('agent:user', handleUserEvent)
      // @ts-ignore
      DeviceEventEmitter.removeListener?.('agent:response', handleAgentEvent)
    }
  }, [pushTranscript])

  // Set navigation options dynamically
  useEffect(() => {
    // Navigation options are set via Stack.Screen in _layout.tsx
    // We can use router.setOptions for dynamic updates if needed
  }, [selectedAgent, sessionActive, duration])

  if (loading || !selectedAgent) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Starting session...</Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedAgent?.name || 'Training Session',
          headerLargeTitle: true,
          headerStyle: {
            backgroundColor: Platform.OS === 'ios' ? '#000000' : '#0a0a0a',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 34,
          },
          headerLargeTitleStyle: {
            fontWeight: '700',
          },
          headerRight: () => (
            <View style={styles.headerRight}>
              {sessionActive && (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                      // Restart session logic
                      Alert.alert('Info', 'Restart functionality coming soon')
                    }}
                  >
                    <Text style={styles.headerButtonText}>Restart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.headerButton, styles.headerButtonDanger]}
                    onPress={endSession}
                  >
                    <Text style={[styles.headerButtonText, styles.headerButtonDangerText]}>End</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Indicator */}
        {sessionActive && (
          <View style={[styles.statusBar, { paddingTop: 8, paddingBottom: 8 }]}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>Live Session</Text>
              <Text style={styles.timer}>{formatDuration(duration)}</Text>
            </View>
          </View>
        )}

        {/* Start Session Button */}
        {!sessionActive && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={startSession}
              disabled={loading || !selectedAgent}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                {loading ? 'Starting...' : selectedAgent ? `Start Session with ${selectedAgent.name}` : 'Start Session'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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

      {/* Button to show transcript/feedback sheet */}
      {sessionActive && (transcript.length > 0 || feedbackItems.length > 0) && (
        <View style={styles.metricsContainer}>
          <TouchableOpacity
            style={styles.showSheetButton}
            onPress={showSheet}
            activeOpacity={0.7}
          >
            <Text style={styles.showSheetButtonText}>
              {activeTab === 'transcript' ? 'View Transcript' : 'View Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* iOS Bottom Sheet Modal for Transcript/Feedback */}
      <Modal
        visible={sheetVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideSheet}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={hideSheet}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY: sheetTranslateY }],
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />
            
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'transcript' && styles.tabActive]}
                onPress={() => setActiveTab('transcript')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'transcript' && styles.tabTextActive]}>
                  Transcript
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'feedback' && styles.tabActive]}
                onPress={() => setActiveTab('feedback')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>
                  Feedback {feedbackItems.length > 0 && `(${feedbackItems.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Area */}
            {activeTab === 'transcript' ? (
              transcript.length === 0 ? (
                <View style={styles.emptyTranscript}>
                  <Text style={styles.emptyText}>
                    Waiting for conversation to begin...
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
                          {isUser ? 'You' : selectedAgent?.name}
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
                />
              )
            ) : (
              <View style={styles.feedbackContainer}>
                <LiveFeedbackFeed feedbackItems={feedbackItems} />
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ElevenLabs Session Component */}
      {sessionActive && conversationToken && selectedAgent && (
        <ElevenLabsSession
          agentId={selectedAgent.eleven_agent_id}
          conversationToken={conversationToken}
          sessionId={sessionId}
        />
      )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#000000' : '#0a0a0a',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    marginTop: 16,
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
  },
  headerButtonDanger: {},
  headerButtonDangerText: {
    color: Platform.OS === 'ios' ? '#FF3B30' : '#ef4444',
  },
  statusBar: {
    paddingHorizontal: 16,
    backgroundColor: Platform.OS === 'ios' ? '#000000' : '#0a0a0a',
    width: '100%',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  statusDotActive: {
    backgroundColor: Platform.OS === 'ios' ? '#FF3B30' : '#ef4444',
  },
  statusText: {
    color: Platform.OS === 'ios' ? '#FFFFFF' : '#fff',
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
    flex: 1,
  },
  timer: {
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    width: '100%',
  },
  startButton: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    borderRadius: Platform.OS === 'ios' ? 14 : 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 16,
    paddingHorizontal: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  agentContainer: {
    height: 200,
    backgroundColor: Platform.OS === 'ios' ? '#1C1C1E' : '#1a1a1a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 8,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  metricsContainer: {
    paddingTop: 0,
    paddingBottom: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  showSheetButton: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 16,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#1e293b',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  showSheetButtonText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: Platform.OS === 'ios' ? '#1C1C1E' : '#1a1a1a',
    borderTopLeftRadius: Platform.OS === 'ios' ? 20 : 16,
    borderTopRightRadius: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -4 : -2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 12 : 8,
    elevation: Platform.OS === 'android' ? 16 : 0,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.3)' : '#64748b',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    borderBottomWidth: Platform.OS === 'ios' ? 2 : 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
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
    paddingBottom: 16,
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
    backgroundColor: Platform.OS === 'ios' ? '#1C1C1E' : '#1a1a1a',
  },
  cameraPlaceholderText: {
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    fontSize: 15,
    marginBottom: 12,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
  },
  permissionButton: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
  },
  agentImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Platform.OS === 'ios' ? '#6366F3' : '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentImageText: {
    fontSize: 48,
    fontWeight: Platform.OS === 'ios' ? '700' : '700',
    color: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.3 : 0,
  },
  transcriptContainer: {
    flex: 1,
  },
  transcriptContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyTranscript: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.5)' : '#666',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    lineHeight: Platform.OS === 'ios' ? 22 : 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Platform.OS === 'ios' ? 12 : 12,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 14,
    borderRadius: Platform.OS === 'ios' ? 18 : 12,
    marginBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  userBubble: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#6366f1',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.12)' : '#1f2937',
    alignSelf: 'flex-start',
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
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
    color: '#FFFFFF',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    lineHeight: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
})

