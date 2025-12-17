import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase/client'
import { GradeDisplay } from '../../components/GradeDisplay'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme'
import { LiveSession } from '../../lib/types'
import { getUserFriendlyError } from '../../lib/errorLogger'

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (params.sessionId) {
      loadSession()
      // Poll for grading completion if session is still being graded
      startPolling()
    }
  }, [params.sessionId])

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', params.sessionId)
        .single()

      if (error) throw error
      const sessionData = data as unknown as LiveSession
      setSession(sessionData)
      
      // If grading is still in progress (no score yet), keep polling
      // Check both direct columns and analytics for scores
      const hasScore = sessionData?.overall_score ?? sessionData?.analytics?.scores?.overall
      if (sessionData && !hasScore) {
        setPolling(true)
      } else {
        setPolling(false)
      }
    } catch (error: any) {
      Alert.alert('Error', getUserFriendlyError(error))
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('id', params.sessionId)
          .single()

        if (error) {
          clearInterval(pollInterval)
          return
        }

        const sessionData = data as unknown as LiveSession
        setSession(sessionData)

        // Stop polling when grading is complete (score exists)
        const hasScore = sessionData?.overall_score ?? sessionData?.analytics?.scores?.overall
        if (hasScore !== null && hasScore !== undefined) {
          setPolling(false)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 60 seconds max
    setTimeout(() => {
      clearInterval(pollInterval)
      setPolling(false)
    }, 60000)
  }

  const handlePracticeAgain = async () => {
    if (session?.agent_name) {
      // Find agent by name to get eleven_agent_id
      const { data: agent } = await supabase
        .from('agents')
        .select('eleven_agent_id')
        .eq('name', session.agent_name)
        .eq('is_active', true)
        .single()
      
      const agentData = agent as unknown as { eleven_agent_id?: string }
      if (agentData?.eleven_agent_id) {
        router.replace(`/practice/call?agent=${agentData.eleven_agent_id}`)
      } else {
        router.replace('/(tabs)/home')
      }
    } else {
      router.replace('/(tabs)/home')
    }
  }

  const handleChooseNewPersona = () => {
    router.replace('/(tabs)/home')
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading results...</Text>
          </View>
        </View>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Session not found</Text>
            <Text style={styles.emptySubtext}>
              The session you're looking for doesn't exist or has been deleted.
            </Text>
          </View>
        </View>
      </>
    )
  }

  // Show loading state if still grading (no score yet)
  // Check both direct columns and analytics for scores
  const hasScore = session.overall_score ?? session.analytics?.scores?.overall
  if (polling || !hasScore) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: 'Grading...',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
          }} 
        />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>AI is analyzing your conversation...</Text>
            <Text style={styles.loadingSubtext}>
              This may take a few moments
            </Text>
          </View>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Results',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
        }} 
      />
      <GradeDisplay
        session={session}
        onPracticeAgain={handlePracticeAgain}
        onChooseNewPersona={handleChooseNewPersona}
      />
    </>
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
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
})
