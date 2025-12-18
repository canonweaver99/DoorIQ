import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { sessionApi, elevenApi } from '../../lib/api/client'
import { supabase } from '../../lib/supabase/client'
import { ElevenLabsSession } from '../../components/trainer/ElevenLabsSession'
import { SpeakingIndicator } from '../../components/SpeakingIndicator'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme'
import { Agent, AudioState } from '../../lib/types'
import { getUserFriendlyError } from '../../lib/errorLogger'
import { requestAudioPermissions, configureAudioMode } from '../../lib/audio'
import { PERSONA_METADATA, type AllowedAgentName } from '../../lib/personas/personas'

export default function PracticeCallScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ agent?: string; objection?: string }>()
  const insets = useSafeAreaInsets()
  const { userProfile } = useAuth()
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [pulseAnim] = useState(new Animated.Value(1))
  
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    isConnected: false,
    error: null,
  })

  useEffect(() => {
    if (params.agent) {
      loadAgent(params.agent)
    } else {
      Alert.alert('Error', 'No agent selected')
      router.back()
    }
  }, [params.agent])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (sessionActive) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionActive])

  // Pulse animation for connecting state
  useEffect(() => {
    if (connecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [connecting, pulseAnim])

  const loadAgent = async (agentId: string) => {
    try {
      setLoading(true)
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('eleven_agent_id', agentId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      if (!agent) {
        Alert.alert('Error', 'Agent not found')
        router.back()
        return
      }

      setSelectedAgent(agent)
    } catch (error: any) {
      Alert.alert('Error', getUserFriendlyError(error))
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleStart = useCallback(async () => {
    if (!selectedAgent) return

    try {
      setLoading(true)
      setConnecting(true)
      setAudioState((prev) => ({ ...prev, error: null }))

      // Request and configure audio permissions
      const permissions = await requestAudioPermissions()
      if (!permissions.granted) {
        throw new Error('Microphone permission is required. Please enable it in settings.')
      }

      await configureAudioMode()

      // Get conversation token
      const tokenData = await elevenApi.getConversationToken(selectedAgent.eleven_agent_id)
      if (!tokenData.conversation_token) {
        throw new Error('Failed to get conversation token')
      }

      setConversationToken(tokenData.conversation_token)

      // Create session record
      const sessionData = await sessionApi.create(selectedAgent.name)
      if (!sessionData.id) {
        throw new Error('Failed to create session')
      }

      setSessionId(sessionData.id)
      setSessionActive(true)
      setConnecting(false)
      setAudioState((prev) => ({ ...prev, isConnected: true, isRecording: true }))
      setDuration(0)

      // Deduct credit
      await sessionApi.increment()
    } catch (error: any) {
      let errorMessage = error.message || 'Unknown error occurred'
      
      // Handle specific error types
      if (error.message?.includes('Microphone')) {
        errorMessage = error.message
      } else if (error.message?.includes('Cannot connect') || error.message?.includes('Network error')) {
        errorMessage = error.message + '\n\nTip: Make sure your backend API is running and accessible.'
      } else {
        errorMessage = getUserFriendlyError(error)
      }
      
      setAudioState((prev) => ({ ...prev, error: errorMessage }))
      setConnecting(false)
      Alert.alert('Connection Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedAgent])

  // Generate mock scores for practice session
  const generateMockScores = () => {
    // Generate realistic scores with some variance
    // Base scores around 70-85 for a good practice session
    const baseScore = 70 + Math.floor(Math.random() * 15)
    
    const toneScore = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10))
    const objectionScore = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10))
    const closingScore = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10))
    
    // Overall score is average of the three
    const overallScore = Math.round((toneScore + objectionScore + closingScore) / 3)
    
    return {
      overall_score: overallScore,
      rapport_score: toneScore,
      objection_handling_score: objectionScore,
      close_score: closingScore,
    }
  }

  const handleEnd = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setSessionActive(false)
      setConnecting(false)
      setAudioState((prev) => ({ ...prev, isConnected: false, isRecording: false }))

      // Generate mock scores
      const mockScores = generateMockScores()

      // Update session with duration and mock scores
      await sessionApi.update(sessionId, {
        duration_seconds: duration,
        end_reason: 'manual',
        ...mockScores,
      })

      // Navigate to results screen
      router.replace(`/results/${sessionId}`)
    } catch (error: any) {
      Alert.alert('Error', getUserFriendlyError(error))
      // Still navigate to results even if update fails
      router.replace(`/results/${sessionId}`)
    } finally {
      setLoading(false)
    }
  }, [sessionId, duration, router])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAgentMetadata = (agentName: string) => {
    return PERSONA_METADATA[agentName as AllowedAgentName]
  }

  if (loading && !selectedAgent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading agent...</Text>
        </View>
      </View>
    )
  }

  if (!selectedAgent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No agent selected</Text>
        </View>
      </View>
    )
  }

  const metadata = getAgentMetadata(selectedAgent.name)
  const objectionInfo = metadata?.bubble?.subtitle || metadata?.card?.challengeLabel || selectedAgent.persona || 'General Practice'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Agent Info Section */}
        <View style={styles.agentSection}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>
            {selectedAgent.name.charAt(0)}
          </Text>
        </View>
        <Text style={styles.agentName}>{selectedAgent.name}</Text>
        {objectionInfo && (
          <View style={styles.objectionBadge}>
            <Text style={styles.objectionText}>{objectionInfo}</Text>
          </View>
        )}
        {metadata?.card?.personality && (
          <Text style={styles.agentDescription}>{metadata.card.personality}</Text>
        )}
      </View>

      {/* Timer Section - Only show when active */}
      {sessionActive && (
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.statusDot, audioState.isConnected && styles.statusDotActive]} />
            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            <Text style={styles.statusText}>
              {connecting ? 'Connecting...' : audioState.isConnected ? 'Live' : 'Disconnected'}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Audio Indicator */}
      {sessionActive && audioState.isRecording && (
        <View style={styles.audioIndicator}>
          {audioState.isPlaying ? (
            <>
              <SpeakingIndicator isSpeaking={true} />
              <Text style={styles.audioText}>AI is speaking...</Text>
            </>
          ) : (
            <>
              <View style={styles.audioDot} />
              <Text style={styles.audioText}>Listening...</Text>
            </>
          )}
        </View>
      )}

        {/* Error Display */}
        {audioState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{audioState.error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Main Action Button - Fixed at bottom */}
      <View style={styles.actionSection}>
        {!sessionActive ? (
          <TouchableOpacity
            style={[styles.startButton, (loading || connecting) && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={loading || connecting}
            activeOpacity={0.8}
          >
            {connecting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={COLORS.text} style={styles.buttonSpinner} />
                <Text style={styles.startButtonText}>Connecting...</Text>
              </View>
            ) : (
              <Text style={styles.startButtonText}>Start Practice</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.endButton, loading && styles.buttonDisabled]}
            onPress={handleEnd}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.endButtonText}>End Call</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ElevenLabs Session Component */}
      {sessionActive && conversationToken && selectedAgent && sessionId && (
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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  agentSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  agentAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  agentAvatarText: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  agentName: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  objectionBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  objectionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  agentDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textTertiary,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  timerText: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  audioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  audioText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  actionSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  endButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  buttonSpinner: {
    marginRight: SPACING.sm,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
})


