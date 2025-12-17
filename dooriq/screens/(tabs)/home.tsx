import { useEffect, useState } from 'react'
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
import { supabase } from '../../lib/supabase/client'
import { Agent } from '../../lib/types'
import { PersonaCard } from '../../components/PersonaCard'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme'
import { PERSONA_METADATA, type AllowedAgentName } from '../../lib/personas/personas'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAgents()
  }

  const handleSelectAgent = (agent: Agent) => {
    // Temporarily disable Tanya & Tom
    if (agent.name === 'Tag Team Tanya & Tom') {
      return
    }
    router.push(`/(tabs)/practice?agent=${agent.eleven_agent_id}`)
  }

  const handleRandomAgent = () => {
    const availableAgents = agents.filter(a => a.name !== 'Tag Team Tanya & Tom')
    if (availableAgents.length === 0) return
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
    router.push(`/(tabs)/practice?agent=${randomAgent.eleven_agent_id}`)
  }

  const getAgentMetadata = (agentName: string) => {
    return PERSONA_METADATA[agentName as AllowedAgentName]
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
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.headerTitle}>Choose Your Challenge</Text>
        <Text style={styles.headerSubtitle}>
          Practice with AI homeowners who react like real customers. Each has unique objections and personality traits.
        </Text>
        <TouchableOpacity 
          style={styles.randomButton}
          onPress={handleRandomAgent}
          disabled={agents.length === 0}
        >
          <Text style={styles.randomButtonText}>🎲 Pick Random</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {agents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No agents available</Text>
          </View>
        ) : (
          agents.map((agent) => {
            const isComingSoon = agent.name === 'Tag Team Tanya & Tom'
            const metadata = getAgentMetadata(agent.name)
            const difficulty = metadata?.bubble?.difficulty || metadata?.card?.challengeLabel || 'Moderate'
            const description = metadata?.bubble?.description || metadata?.card?.personality || agent.persona || ''
            const subtitle = metadata?.bubble?.subtitle || ''
            const avatar = metadata?.card?.avatar || agent.name.charAt(0)
            const bestFor = metadata?.card?.bestFor || ''
            const estimatedTime = metadata?.card?.estimatedTime || ''

            return (
              <PersonaCard
                key={agent.id}
                agent={agent}
                metadata={{
                  difficulty,
                  description,
                  subtitle,
                  avatar,
                  bestFor,
                  estimatedTime,
                }}
                onPress={() => handleSelectAgent(agent)}
                disabled={isComingSoon}
              />
            )
          })
        )}
      </ScrollView>
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
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  randomButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: SPACING.xs,
  },
  randomButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
})
