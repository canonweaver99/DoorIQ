import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase/client'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, GRADE_COLORS, getGradeFromScore, BORDER_RADIUS } from '../../constants/theme'
import { LiveSession } from '../../lib/types'

export default function SessionsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userProfile } = useAuth()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (userProfile?.id) {
      loadSessions()
    }
  }, [userProfile?.id])

  const loadSessions = useCallback(async () => {
    if (!userProfile?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userProfile?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadSessions()
  }, [loadSessions])

  if (loading) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: 'Sessions',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
          }} 
        />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Sessions',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
        }} 
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sessions yet</Text>
              <Text style={styles.emptySubtext}>
                Start practicing to see your session history here
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push('/(tabs)/home')}
              >
                <Text style={styles.startButtonText}>Start Practicing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{sessions.length} Session{sessions.length !== 1 ? 's' : ''}</Text>
              </View>
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </>
  )
}

function SessionCard({ session }: { session: LiveSession }) {
  const router = useRouter()
  const overallScore = session.overall_score ?? session.analytics?.scores?.overall ?? null
  const grade = overallScore !== null ? getGradeFromScore(overallScore) : null
  const gradeColor = grade ? GRADE_COLORS[grade] : COLORS.textSecondary

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/results/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionAgent}>{session.agent_name || 'Unknown Agent'}</Text>
          <Text style={styles.sessionDate}>{formatDate(session.created_at)}</Text>
        </View>
        {grade && (
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '20', borderColor: gradeColor }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.sessionDetails}>
        {overallScore !== null && (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Score:</Text>
            <Text style={[styles.scoreValue, { color: gradeColor }]}>{overallScore}%</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{formatDuration(session.duration_seconds)}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
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
    marginBottom: SPACING.xl,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  sessionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionAgent: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sessionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  gradeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  sessionDetails: {
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
})


