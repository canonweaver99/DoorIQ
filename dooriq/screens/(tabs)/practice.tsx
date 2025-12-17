import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sessionApi, elevenApi } from '../../lib/api/client'
import { supabase } from '../../lib/supabase/client'
import { CallInterface } from '../../components/CallInterface'
import { ElevenLabsSession } from '../../components/trainer/ElevenLabsSession'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme'
import { Agent, AudioState } from '../../lib/types'
import { getUserFriendlyError } from '../../lib/errorLogger'
import { requestAudioPermissions, configureAudioMode, getAudioErrorMessage } from '../../lib/audio'

export default function PracticeScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ agent?: string }>()
  const insets = useSafeAreaInsets()
  const userProfile = null
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    isConnected: false,
    error: null,
  })

  useEffect(() => {
    if (params.agent) {
      loadAgent(params.agent)
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
      setAudioState((prev) => ({ ...prev, isConnected: true, isRecording: true }))
      setDuration(0)

      // Deduct credit
      await sessionApi.increment()
    } catch (error: any) {
      const errorMessage = error.message?.includes('Microphone') 
        ? error.message 
        : getUserFriendlyError(error)
      setAudioState((prev) => ({ ...prev, error: errorMessage }))
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedAgent])

  const handleEnd = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setSessionActive(false)
      setAudioState((prev) => ({ ...prev, isConnected: false, isRecording: false }))

      // Update session with duration
      await sessionApi.update(sessionId, {
        duration_seconds: duration,
        end_reason: 'manual',
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

  if (loading && !selectedAgent) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading agent...</Text>
        </View>
      </View>
    )
  }

  if (!selectedAgent) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No agent selected</Text>
          <Text style={styles.emptySubtext}>
            Go to Home tab to select a persona to practice with
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Agent Info */}
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarText}>
              {selectedAgent.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.agentName}>{selectedAgent.name}</Text>
          {selectedAgent.persona && (
            <Text style={styles.agentPersona}>{selectedAgent.persona}</Text>
          )}
        </View>

        {/* Call Interface */}
        <CallInterface
          duration={duration}
          isActive={sessionActive}
          isConnected={audioState.isConnected}
          audioState={audioState}
          onStart={handleStart}
          onEnd={handleEnd}
          loading={loading}
        />
      </ScrollView>

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
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  agentInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  agentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  agentAvatarText: {
    fontSize: 40,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  agentName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  agentPersona: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
})
