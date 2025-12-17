import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'

// Try to import BlurView, fallback to View if not available
let BlurView: typeof View
try {
  BlurView = require('expo-blur').BlurView
} catch {
  BlurView = View
}

export interface LiveSessionMetrics {
  talkTimeRatio: number
  wordsPerMinute: number
  objectionCount: number
  techniquesUsed: string[]
}

interface LiveMetricsPanelProps {
  metrics: LiveSessionMetrics
  transcript?: any[]
  sessionId?: string | null
  sessionActive?: boolean
  agentName?: string | null
}

// iOS System Colors
const colorStyles = {
  blue: {
    iconBg: Platform.OS === 'ios' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)',
    text: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    progress: Platform.OS === 'ios' ? '#007AFF' : '#007AFF',
    badgeBg: Platform.OS === 'ios' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
  },
  amber: {
    iconBg: Platform.OS === 'ios' ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.15)',
    text: Platform.OS === 'ios' ? '#FF9500' : '#FF9500',
    progress: Platform.OS === 'ios' ? '#FF9500' : '#FF9500',
    badgeBg: Platform.OS === 'ios' ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)',
  },
  emerald: {
    iconBg: Platform.OS === 'ios' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
    text: Platform.OS === 'ios' ? '#34C759' : '#34C759',
    progress: Platform.OS === 'ios' ? '#34C759' : '#34C759',
    badgeBg: Platform.OS === 'ios' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
  },
  purple: {
    iconBg: Platform.OS === 'ios' ? 'rgba(175, 82, 222, 0.2)' : 'rgba(175, 82, 222, 0.15)',
    text: Platform.OS === 'ios' ? '#AF52DE' : '#AF52DE',
    progress: Platform.OS === 'ios' ? '#AF52DE' : '#AF52DE',
    badgeBg: Platform.OS === 'ios' ? 'rgba(175, 82, 222, 0.15)' : 'rgba(175, 82, 222, 0.1)',
  },
}

const MetricCard = React.memo(({ 
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
  color: 'blue' | 'amber' | 'emerald' | 'purple'
  badge?: string
  progress?: number
}) => {
  const styles = colorStyles[color]
  const isGoodBadge = badge === 'Balanced' || badge === 'Good'
  
  return (
    <View style={localStyles.metricCard}>
      <View style={localStyles.metricHeader}>
        <View style={[localStyles.iconContainer, { backgroundColor: styles.iconBg }]}>
          <Text style={localStyles.iconText}>{icon}</Text>
        </View>
        <View style={localStyles.metricContent}>
          <Text style={localStyles.metricLabel}>{label}</Text>
          <View style={localStyles.metricValueRow}>
            <Text style={localStyles.metricValue}>{value}</Text>
            {badge && (
              <View style={[
                localStyles.badge, 
                isGoodBadge && { backgroundColor: styles.badgeBg }
              ]}>
                <Text style={[
                  localStyles.badgeText,
                  isGoodBadge && { color: styles.text }
                ]}>{badge}</Text>
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
            <Text style={localStyles.progressLabel}>Them: {progress}%</Text>
            <Text style={localStyles.progressLabel}>Ideal: 60%</Text>
            <Text style={localStyles.progressLabel}>You: {100 - progress}%</Text>
          </View>
        </View>
      )}
    </View>
  )
})

// Simplified sentiment calculation for React Native
const calculateSentimentScore = (transcript: any[] = [], sessionDurationSeconds: number = 0): number => {
  if (!transcript || transcript.length === 0) return 5
  
  // Simple sentiment calculation based on transcript length and positive keywords
  const positiveKeywords = ['yes', 'sounds good', 'interested', 'great', 'perfect', 'okay', 'sure']
  const negativeKeywords = ['no', 'not interested', 'expensive', 'can\'t afford', 'maybe later']
  
  let positiveCount = 0
  let negativeCount = 0
  
  transcript.forEach((entry: any) => {
    const text = (entry.text || '').toLowerCase()
    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword)) positiveCount++
    })
    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword)) negativeCount++
    })
  })
  
  // Base score starts at 5, increases with positive signals
  const baseScore = 5
  const positiveScore = Math.min(40, positiveCount * 5)
  const negativePenalty = Math.min(30, negativeCount * 5)
  
  // Time progression: longer sessions tend to have higher sentiment
  const timeBonus = Math.min(25, (sessionDurationSeconds / 60) * 5)
  
  const score = baseScore + positiveScore - negativePenalty + timeBonus
  return Math.max(0, Math.min(100, Math.round(score)))
}

const SentimentCard = React.memo(({ 
  score 
}: { 
  score: number 
}) => {
  const getSentimentColor = () => {
    if (score < 30) {
      return {
        iconBg: 'rgba(255, 149, 0, 0.15)',
        text: '#FF9500',
        progress: '#FF9500',
        badgeBg: 'rgba(255, 149, 0, 0.1)',
      }
    } else if (score >= 30 && score < 60) {
      return {
        iconBg: 'rgba(255, 204, 0, 0.15)',
        text: '#FFCC00',
        progress: '#FFCC00',
        badgeBg: 'rgba(255, 204, 0, 0.1)',
      }
    } else {
      return {
        iconBg: 'rgba(52, 199, 89, 0.15)',
        text: '#34C759',
        progress: '#34C759',
        badgeBg: 'rgba(52, 199, 89, 0.1)',
      }
    }
  }
  
  const colors = getSentimentColor()
  const level = score < 30 ? 'Low' : score >= 30 && score < 60 ? 'Building' : 'Positive'
  
  const CardWrapper = Platform.OS === 'ios' ? BlurView : View
  const cardProps = Platform.OS === 'ios' 
    ? { intensity: 20, tint: 'dark' as const }
    : {}
  
  return (
    <CardWrapper {...cardProps} style={localStyles.metricCard}>
      <View style={localStyles.metricHeader}>
        <View style={[localStyles.iconContainer, { backgroundColor: colors.iconBg }]}>
          <Text style={localStyles.iconText}>📈</Text>
        </View>
        <View style={localStyles.metricContent}>
          <Text style={localStyles.metricLabel}>Sale Sentiment</Text>
          <View style={localStyles.metricValueRow}>
            <Text style={localStyles.metricValue}>{score}%</Text>
            <View style={[
              localStyles.badge, 
              { backgroundColor: colors.badgeBg }
            ]}>
              <Text style={[
                localStyles.badgeText,
                { color: colors.text }
              ]}>{level}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={localStyles.progressContainer}>
        <View style={localStyles.progressBar}>
          <View 
            style={[
              localStyles.progressFill, 
              { width: `${score}%`, backgroundColor: colors.progress }
            ]} 
          />
        </View>
        <View style={localStyles.progressLabels}>
          <Text style={localStyles.progressLabel}>Low</Text>
          <Text style={localStyles.progressLabel}>Building</Text>
          <Text style={localStyles.progressLabel}>Positive</Text>
        </View>
      </View>
    </CardWrapper>
  )
})

export const LiveMetricsPanel = React.memo(({ metrics, transcript = [], sessionId, sessionActive = false, agentName }: LiveMetricsPanelProps) => {
  const { talkTimeRatio } = metrics

  const talkTimeStatus = useMemo(() => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return { badge: 'Balanced', variant: 'good' as const }
    } else if ((talkTimeRatio >= 35 && talkTimeRatio < 40) || (talkTimeRatio > 60 && talkTimeRatio <= 70)) {
      return { badge: 'OK', variant: 'ok' as const }
    } else if (talkTimeRatio < 35) {
      return { badge: 'Listen', variant: 'warning' as const }
    } else {
      return { badge: 'Talk', variant: 'warning' as const }
    }
  }, [talkTimeRatio])

  // Calculate sentiment score
  const sessionDurationSeconds = useMemo(() => {
    if (!transcript || transcript.length === 0) return 0
    try {
      const firstTime = transcript[0]?.timestamp instanceof Date 
        ? transcript[0].timestamp.getTime()
        : typeof transcript[0]?.timestamp === 'string'
          ? new Date(transcript[0].timestamp).getTime()
          : Date.now()
      const currentTime = Date.now()
      return (currentTime - firstTime) / 1000
    } catch {
      return 0
    }
  }, [transcript])
  
  const sentimentScore = useMemo(() => {
    if (!sessionActive || !transcript || transcript.length === 0) return 5
    return calculateSentimentScore(transcript, sessionDurationSeconds)
  }, [transcript, sessionDurationSeconds, sessionActive])

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
      <SentimentCard score={sentimentScore} />
    </View>
  )
})

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: Platform.OS === 'ios' ? 16 : 12,
    width: '100%',
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 16,
  },
  metricCard: {
    width: '100%',
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(28, 28, 30, 0.8)' 
      : '#1e293b',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: Platform.OS === 'ios' ? 16 : 14,
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : '#334155',
    overflow: 'hidden',
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
  },
  iconContainer: {
    width: Platform.OS === 'ios' ? 40 : 36,
    height: Platform.OS === 'ios' ? 40 : 36,
    borderRadius: Platform.OS === 'ios' ? 12 : 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: Platform.OS === 'ios' ? 13 : 13,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : '#94a3b8',
    marginBottom: Platform.OS === 'ios' ? 6 : 4,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 10 : 8,
    flexWrap: 'wrap',
  },
  metricValue: {
    fontSize: Platform.OS === 'ios' ? 28 : 24,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: '#FFFFFF',
    letterSpacing: Platform.OS === 'ios' ? -0.5 : 0,
  },
  badge: {
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.15)' 
      : '#475569',
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 8,
    paddingVertical: Platform.OS === 'ios' ? 5 : 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
  },
  badgeText: {
    fontSize: Platform.OS === 'ios' ? 12 : 11,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.9)' : '#fff',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 12 : 10,
  },
  progressBar: {
    height: Platform.OS === 'ios' ? 4 : 3,
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.15)' 
      : '#334155',
    borderRadius: Platform.OS === 'ios' ? 2 : 1.5,
    position: 'relative',
    marginBottom: Platform.OS === 'ios' ? 10 : 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressMarker: {
    position: 'absolute',
    top: -5,
    width: 2,
    height: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: Platform.OS === 'ios' ? 11 : 10,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
})

