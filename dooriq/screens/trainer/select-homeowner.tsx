import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase/client'
import { Agent } from '../../lib/types'
import { MobileNavMenu } from '../../components/navigation/MobileNavMenu'
import { PERSONA_METADATA, type AllowedAgentName } from '../../lib/personas/personas'

export default function SelectHomeownerScreen() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

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
    }
  }

  const handleSelectAgent = (agent: Agent) => {
    // Temporarily disable Tanya & Tom
    if (agent.name === 'Tag Team Tanya & Tom') {
      return // Prevent selection
    }
    router.push(`/trainer/new?agent=${agent.eleven_agent_id}`)
  }

  const handleRandomAgent = () => {
    const availableAgents = agents.filter(a => a.name !== 'Tag Team Tanya & Tom')
    if (availableAgents.length === 0) return
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
    handleSelectAgent(randomAgent)
  }

  const getAgentMetadata = (agentName: string) => {
    return PERSONA_METADATA[agentName as AllowedAgentName]
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return '#22c55e'
      case 'moderate':
        return '#3b82f6'
      case 'hard':
        return '#f59e0b'
      case 'expert':
        return '#ef4444'
      default:
        return '#888'
    }
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
            const description = metadata?.bubble?.description || metadata?.card?.personality || ''
            const subtitle = metadata?.bubble?.subtitle || ''
            const bestFor = metadata?.card?.bestFor || ''
            const estimatedTime = metadata?.card?.estimatedTime || ''
            const traits = metadata?.card?.traits || []
            const isRecommended = metadata?.card?.recommended || false
            const isMostChallenging = metadata?.card?.mostChallenging || false
            const avatar = metadata?.card?.avatar || agent.name.charAt(0)
            
            return (
              <TouchableOpacity
                key={agent.id}
                style={[styles.agentCard, isComingSoon && styles.comingSoonCard]}
                onPress={() => handleSelectAgent(agent)}
                disabled={isComingSoon}
                activeOpacity={0.7}
              >
                <View style={styles.agentImageContainer}>
                  <View style={[styles.agentImagePlaceholder, isComingSoon && styles.comingSoonImage]}>
                    <Text style={styles.agentImageText}>{avatar}</Text>
                  </View>
                </View>
                <View style={styles.agentInfo}>
                  <View style={styles.agentHeader}>
                    <View style={styles.agentNameContainer}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      {subtitle && (
                        <Text style={styles.agentSubtitle}>{subtitle}</Text>
                      )}
                    </View>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) + '20', borderColor: getDifficultyColor(difficulty) }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                        {difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  {description && (
                    <Text style={styles.agentDescription}>{description}</Text>
                  )}
                  
                  {traits.length > 0 && (
                    <View style={styles.traitsContainer}>
                      {traits.slice(0, 2).map((trait, index) => (
                        <View key={index} style={styles.traitTag}>
                          <Text style={styles.traitText}>• {trait}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.metaContainer}>
                    {bestFor && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Best for:</Text>
                        <Text style={styles.metaValue}>{bestFor}</Text>
                      </View>
                    )}
                    {estimatedTime && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Time:</Text>
                        <Text style={styles.metaValue}>{estimatedTime}</Text>
                      </View>
                    )}
                  </View>
                  
                  {isComingSoon && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>🚧 Coming Soon</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })
        )}
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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 38,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  randomButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignSelf: 'center',
    marginTop: 4,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  randomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
  },
  agentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 28,
    marginBottom: 28,
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  agentImageContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    position: 'relative',
    alignSelf: 'center',
  },
  agentImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 90,
  },
  agentImageText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#fff',
  },
  agentInfo: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 0,
  },
  agentHeader: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentNameContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 30,
    textAlign: 'center',
  },
  agentSubtitle: {
    fontSize: 15,
    color: '#a855f7',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    alignSelf: 'center',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agentDescription: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  traitsContainer: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  traitTag: {
    marginBottom: 6,
  },
  traitText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    textAlign: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    justifyContent: 'center',
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '600',
  },
  comingSoonCard: {
    opacity: 0.6,
  },
  comingSoonImage: {
    opacity: 0.5,
  },
  comingSoonBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
  },
})
