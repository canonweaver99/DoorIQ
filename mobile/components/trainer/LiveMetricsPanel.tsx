import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export interface LiveSessionMetrics {
  talkTimeRatio: number
  objectionCount: number
  techniquesUsed: string[]
}

interface LiveMetricsPanelProps {
  metrics: LiveSessionMetrics
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  color, 
  badge, 
  progress 
}: { 
  icon: string
  label: string
  value: string | number
  color: 'blue' | 'amber' | 'emerald'
  badge?: string
  progress?: number
}) {
  const colorStyles = {
    blue: {
      iconBg: '#3b82f6',
      text: '#60a5fa',
      progress: '#3b82f6',
    },
    amber: {
      iconBg: '#f59e0b',
      text: '#fbbf24',
      progress: '#f59e0b',
    },
    emerald: {
      iconBg: '#10b981',
      text: '#34d399',
      progress: '#10b981',
    },
  }

  const styles = colorStyles[color]

  return (
    <View style={[localStyles.metricCard, { borderColor: `${styles.progress}40` }]}>
      <View style={localStyles.metricHeader}>
        <View style={[localStyles.iconContainer, { backgroundColor: `${styles.iconBg}20` }]}>
          <Text style={[localStyles.iconText, { color: styles.text }]}>{icon}</Text>
        </View>
        <View style={localStyles.metricContent}>
          <Text style={localStyles.metricLabel}>{label}</Text>
          <View style={localStyles.metricValueRow}>
            <Text style={localStyles.metricValue}>{value}</Text>
            {badge && (
              <View style={[localStyles.badge, badge === 'Balanced' && localStyles.badgeGood]}>
                <Text style={localStyles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {progress !== undefined && (
        <View style={localStyles.progressContainer}>
          <View style={localStyles.progressBar}>
            <View 
              style={[
                localStyles.progressFill, 
                { width: `${progress}%`, backgroundColor: styles.progress }
              ]} 
            />
            {progress > 0 && progress < 100 && (
              <View style={[localStyles.progressMarker, { left: '50%' }]} />
            )}
          </View>
          <View style={localStyles.progressLabels}>
            <Text style={localStyles.progressLabel}>You: {progress}%</Text>
            <Text style={localStyles.progressLabel}>Ideal: 50-60%</Text>
            <Text style={localStyles.progressLabel}>Them: {100 - progress}%</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export function LiveMetricsPanel({ metrics }: LiveMetricsPanelProps) {
  const { talkTimeRatio, objectionCount, techniquesUsed } = metrics

  const getTalkTimeStatus = () => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return { badge: 'Balanced', variant: 'good' as const }
    } else if ((talkTimeRatio >= 35 && talkTimeRatio < 40) || (talkTimeRatio > 60 && talkTimeRatio <= 70)) {
      return { badge: 'OK', variant: 'ok' as const }
    } else if (talkTimeRatio < 35) {
      return { badge: 'Listen', variant: 'warning' as const }
    } else {
      return { badge: 'Talk', variant: 'warning' as const }
    }
  }

  const talkTimeStatus = getTalkTimeStatus()

  return (
    <View style={localStyles.container}>
      <MetricCard
        icon="🎤"
        label="Talk Time Ratio"
        value={`${talkTimeRatio}%`}
        color="blue"
        badge={talkTimeStatus.badge}
        progress={talkTimeRatio}
      />
      <View style={localStyles.rightMetrics}>
        <MetricCard
          icon="⚠️"
          label="Objections"
          value={objectionCount}
          color="amber"
        />
        <MetricCard
          icon="📚"
          label="Techniques"
          value={techniquesUsed.length}
          color="emerald"
        />
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  rightMetrics: {
    flex: 1,
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGood: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressMarker: {
    position: 'absolute',
    top: -6,
    width: 2,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 9,
    color: '#64748b',
  },
})

