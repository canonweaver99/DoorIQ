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
    router.push(`/trainer/new?agent=${agent.eleven_agent_id}`)
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
        <Text style={styles.headerTitle}>Select Homeowner</Text>
        <Text style={styles.headerSubtitle}>Choose who you want to practice with</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {agents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No agents available</Text>
          </View>
        ) : (
          agents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={styles.agentCard}
              onPress={() => handleSelectAgent(agent)}
            >
              <View style={styles.agentImageContainer}>
                <View style={styles.agentImagePlaceholder}>
                  <Text style={styles.agentImageText}>{agent.name.charAt(0)}</Text>
                </View>
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                {agent.persona && (
                  <Text style={styles.agentPersona}>{agent.persona}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#2a2a2a',
  },
  agentImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a855f7',
  },
  agentImageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  agentPersona: {
    fontSize: 14,
    color: '#888',
  },
})
