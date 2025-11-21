import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
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

  const fetchData = async () => {
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

      setRecentSessions(sessions || [])

      // Calculate stats
      const totalSessions = sessions?.length || 0
      const scores = sessions?.map((s) => s.overall_score).filter((s) => s !== null) || []
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const sessionsThisWeek = sessions?.filter((s) => new Date(s.created_at) > weekAgo).length || 0

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
  }

  useEffect(() => {
    fetchData()
  }, [userProfile])

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshProfile()
    await fetchData()
  }

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
            recentSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/trainer/${session.id}`)}
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
            ))
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
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a855f7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionAgent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: '#a855f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 12,
    color: '#666',
  },
})

