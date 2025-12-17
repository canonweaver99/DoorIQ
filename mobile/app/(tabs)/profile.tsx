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
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase/client'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, GRADE_COLORS, getGradeFromScore } from '../../constants/theme'
import { LiveSession } from '../../lib/types'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEY_PROFILE = 'dooriq_profile_cache'
const CACHE_KEY_SESSIONS = 'dooriq_sessions_cache'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

interface ProfileStats {
  totalSessions: number
  averageScore: number
  averageGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  mostPracticedPersona: string | null
  sessionsThisWeek: number
  sessionsThisMonth: number
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userProfile, signOut, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<ProfileStats>({
    totalSessions: 0,
    averageScore: 0,
    averageGrade: 'F',
    mostPracticedPersona: null,
    sessionsThisWeek: 0,
    sessionsThisMonth: 0,
  })
  const [recentSessions, setRecentSessions] = useState<LiveSession[]>([])
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    loadProfileData()
    checkOnlineStatus()
  }, [userProfile?.id])

  const checkOnlineStatus = async () => {
    try {
      // Simple connectivity check
      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' })
      setIsOffline(false)
    } catch {
      setIsOffline(true)
    }
  }

  const loadProfileData = useCallback(async () => {
    if (!userProfile?.id) return

    try {
      setLoading(true)

      // Try to load from cache first
      const cachedData = await loadFromCache()
      if (cachedData && !isOffline) {
        setStats(cachedData.stats)
        setRecentSessions(cachedData.sessions)
        setLoading(false)
      }

      // Always try to fetch fresh data if online
      if (!isOffline) {
        await fetchProfileData()
      } else if (!cachedData) {
        // If offline and no cache, show empty state
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
      // Try to load from cache as fallback
      const cachedData = await loadFromCache()
      if (cachedData) {
        setStats(cachedData.stats)
        setRecentSessions(cachedData.sessions)
      }
      setLoading(false)
    }
  }, [userProfile?.id, isOffline])

  const loadFromCache = async () => {
    try {
      const cachedStats = await AsyncStorage.getItem(CACHE_KEY_PROFILE)
      const cachedSessions = await AsyncStorage.getItem(CACHE_KEY_SESSIONS)
      
      if (cachedStats && cachedSessions) {
        const statsData = JSON.parse(cachedStats)
        const sessionsData = JSON.parse(cachedSessions)
        
        // Check if cache is still valid
        if (Date.now() - statsData.timestamp < CACHE_EXPIRY) {
          return {
            stats: statsData.data,
            sessions: sessionsData.data,
          }
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error)
    }
    return null
  }

  const saveToCache = async (statsData: ProfileStats, sessionsData: LiveSession[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify({
        data: statsData,
        timestamp: Date.now(),
      }))
      await AsyncStorage.setItem(CACHE_KEY_SESSIONS, JSON.stringify({
        data: sessionsData,
        timestamp: Date.now(),
      }))
    } catch (error) {
      console.error('Error saving cache:', error)
    }
  }

  const fetchProfileData = async () => {
    if (!userProfile?.id) return

    try {
      // Fetch recent sessions
      const { data: sessions, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setRecentSessions(sessions || [])

      // Calculate stats
      const totalSessions = sessions?.length || 0
      const scores = sessions
        ?.map((s: LiveSession) => s.overall_score)
        .filter((s) => s !== null && s !== undefined) as number[] || []
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

      // Find most practiced persona
      const personaCounts: Record<string, number> = {}
      sessions?.forEach((s: LiveSession) => {
        if (s.agent_name) {
          personaCounts[s.agent_name] = (personaCounts[s.agent_name] || 0) + 1
        }
      })
      const mostPracticedPersona = Object.keys(personaCounts).length > 0
        ? Object.keys(personaCounts).reduce((a, b) =>
            personaCounts[a] > personaCounts[b] ? a : b
          )
        : null

      // Calculate weekly/monthly sessions
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const sessionsThisWeek = sessions?.filter(
        (s: LiveSession) => new Date(s.created_at) > weekAgo
      ).length || 0

      const sessionsThisMonth = sessions?.filter(
        (s: LiveSession) => new Date(s.created_at) > monthAgo
      ).length || 0

      const newStats: ProfileStats = {
        totalSessions,
        averageScore,
        averageGrade: getGradeFromScore(averageScore),
        mostPracticedPersona,
        sessionsThisWeek,
        sessionsThisMonth,
      }

      setStats(newStats)

      // Save to cache
      await saveToCache(newStats, sessions || [])
    } catch (error) {
      console.error('Error fetching profile data:', error)
      throw error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkOnlineStatus()
    await refreshProfile()
    await fetchProfileData()
  }, [refreshProfile])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile?.full_name || 'User'}
          </Text>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Total Sessions"
            value={stats.totalSessions.toString()}
            color={COLORS.primary}
          />
          <StatCard
            label="Average Grade"
            value={stats.averageGrade}
            color={GRADE_COLORS[stats.averageGrade]}
          />
          <StatCard
            label="This Week"
            value={stats.sessionsThisWeek.toString()}
            color={COLORS.info}
          />
        </View>

        {/* Most Practiced Persona */}
        {stats.mostPracticedPersona && (
          <View style={styles.personaCard}>
            <Text style={styles.personaLabel}>Most Practiced Persona</Text>
            <Text style={styles.personaValue}>{stats.mostPracticedPersona}</Text>
          </View>
        )}

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {recentSessions.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/sessions')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sessions yet</Text>
              <Text style={styles.emptySubtext}>
                Start practicing to see your progress here
              </Text>
            </View>
          ) : (
            recentSessions.slice(0, 5).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function SessionCard({ session }: { session: LiveSession }) {
  const router = useRouter()
  const grade = getGradeFromScore(session.overall_score)
  const gradeColor = GRADE_COLORS[grade]

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/results/${session.id}`)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionAgent}>{session.agent_name || 'Unknown'}</Text>
        {session.overall_score !== null && (
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '20', borderColor: gradeColor }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
          </View>
        )}
      </View>
      <Text style={styles.sessionDate}>
        {new Date(session.created_at).toLocaleDateString()}
      </Text>
      {session.duration_seconds && (
        <Text style={styles.sessionDuration}>
          {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
        </Text>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  offlineBadge: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  offlineText: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  personaCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  personaLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  personaValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  viewAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sessionAgent: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    flex: 1,
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
  sessionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sessionDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  signOutButton: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  signOutText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
})
