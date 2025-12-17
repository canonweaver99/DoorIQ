import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase/client'
import { formatDate } from '../lib/utils'
import { TrainingSession } from '../lib/types'
import { MobileNavMenu } from '../components/navigation/MobileNavMenu'

export default function DashboardScreen() {
  const { userProfile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    sessionsThisWeek: 0,
  })
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([])

  const fetchData = useCallback(async () => {
    try {
      if (!userProfile?.id) return

      // Fetch recent sessions
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setRecentSessions((sessions || []) as TrainingSession[])

      // Calculate stats
      const totalSessions = sessions?.length || 0
      const scores = sessions?.map((s: TrainingSession) => s.overall_score).filter((s) => s !== null) as number[] || []
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const sessionsThisWeek = sessions?.filter((s: TrainingSession) => new Date(s.created_at) > weekAgo).length || 0

      setStats({
        totalSessions,
        avgScore: Math.round(avgScore),
        sessionsThisWeek,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userProfile?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshProfile()
    await fetchData()
  }, [refreshProfile, fetchData])

  const handleSessionPress = useCallback((sessionId: string) => {
    router.push(`/trainer/${sessionId}`)
  }, [router])

  const renderSessionCard = useCallback(({ item: session }: { item: TrainingSession }) => {
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(session.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionAgent}>{session.agent_name || 'Unknown Agent'}</Text>
          {session.overall_score !== null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{session.overall_score}</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionDate}>{formatDate(session.created_at)}</Text>
        {session.duration_seconds && (
          <Text style={styles.sessionDuration}>
            Duration: {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
          </Text>
        )}
      </TouchableOpacity>
    )
  }, [handleSessionPress])

  const keyExtractor = useCallback((item: TrainingSession) => item.id, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {userProfile?.full_name || 'User'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgScore}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.sessionsThisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/trainer/select-homeowner')}
        >
          <Text style={styles.primaryButtonText}>Start Practice Session</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start your first practice session to see your progress here
              </Text>
            </View>
          ) : (
            <FlatList
              data={recentSessions}
              renderItem={renderSessionCard}
              keyExtractor={keyExtractor}
              scrollEnabled={false}
              removeClippedSubviews={true}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={5}
            />
          )}
        </View>
      </ScrollView>
      <MobileNavMenu />
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
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: Platform.OS === 'ios' ? '700' : '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: Platform.OS === 'ios' ? -0.8 : 0,
  },
  headerSubtitle: {
    fontSize: 17,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  statValue: {
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: Platform.OS === 'ios' ? '#007AFF' : '#a855f7',
    marginBottom: 6,
    letterSpacing: Platform.OS === 'ios' ? -0.5 : 0,
  },
  statLabel: {
    fontSize: 13,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  primaryButton: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#a855f7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Platform.OS === 'ios' ? '#007AFF' : '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: Platform.OS === 'ios' ? -0.4 : 0,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 2 : 1,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionAgent: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: '#fff',
    flex: 1,
    letterSpacing: Platform.OS === 'ios' ? -0.3 : 0,
  },
  scoreBadge: {
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(0, 122, 255, 0.2)' 
      : '#a855f7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
  },
  scoreText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#fff',
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  sessionDate: {
    fontSize: 15,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#888',
    marginBottom: 6,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  sessionDuration: {
    fontSize: 13,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.5)' : '#666',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
})

