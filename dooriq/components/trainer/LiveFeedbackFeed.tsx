import React, { useMemo, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, FlatList, Platform } from 'react-native'

export interface FeedbackItem {
  id: string
  timestamp: Date
  type: string
  message: string
  severity: 'good' | 'neutral' | 'needs_improvement'
}

export interface LiveSessionMetrics {
  talkTimeRatio: number
  objectionCount: number
  techniquesUsed: string[]
}

interface LiveFeedbackFeedProps {
  feedbackItems: FeedbackItem[]
}

const FeedbackItemComponent = React.memo(({ item }: { item: FeedbackItem }) => {
  const config = useMemo(() => {
    switch (item.type) {
      case 'objection_detected':
        return {
          icon: '⚠️',
          badge: 'OBJECTION',
          color: '#f59e0b',
        }
      case 'technique_used':
        return {
          icon: '✅',
          badge: 'TECHNIQUE',
          color: '#10b981',
        }
      case 'coaching_tip':
        return {
          icon: '💡',
          badge: 'TIP',
          color: '#3b82f6',
        }
      case 'warning':
        return {
          icon: '⚠️',
          badge: 'WARNING',
          color: '#ef4444',
        }
      default:
        return {
          icon: 'ℹ️',
          badge: 'INFO',
          color: '#64748b',
        }
    }
  }, [item.type])

  const formatTime = useCallback((date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }, [])

  return (
    <View style={[localStyles.feedbackItem, { borderLeftColor: config.color }]}>
      <View style={localStyles.feedbackHeader}>
        <View style={[localStyles.badge, { backgroundColor: `${config.color}20` }]}>
          <Text style={localStyles.badgeText}>{config.badge}</Text>
        </View>
        <Text style={localStyles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      <View style={localStyles.feedbackContent}>
        <Text style={localStyles.icon}>{config.icon}</Text>
        <Text style={localStyles.message}>{item.message}</Text>
      </View>
      {/* iOS-style separator */}
      {Platform.OS === 'ios' && <View style={localStyles.separator} />}
    </View>
  )
})

export const LiveFeedbackFeed: React.FC<LiveFeedbackFeedProps> = React.memo(({ feedbackItems }) => {
  const renderItem = useCallback(({ item }: { item: FeedbackItem }) => (
    <FeedbackItemComponent item={item} />
  ), [])

  const keyExtractor = useCallback((item: FeedbackItem) => item.id, [])

  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <View style={localStyles.statusIndicator} />
        <Text style={localStyles.headerText}>Live Feedback</Text>
      </View>
      {feedbackItems.length === 0 ? (
        <View style={localStyles.emptyState}>
          <Text style={localStyles.emptyIcon}>💡</Text>
          <Text style={localStyles.emptyText}>Waiting for feedback...</Text>
        </View>
      ) : (
        <FlatList
          data={feedbackItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={localStyles.scrollView}
          contentContainerStyle={localStyles.scrollContent}
        />
      )}
    </View>
  )
})

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Platform.OS === 'ios' ? '#1C1C1E' : '#0f172a',
    borderRadius: Platform.OS === 'ios' ? 0 : 12,
    overflow: 'hidden',
    marginBottom: Platform.OS === 'ios' ? 0 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 10 : 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#1e293b',
  },
  statusIndicator: {
    width: Platform.OS === 'ios' ? 8 : 8,
    height: Platform.OS === 'ios' ? 8 : 8,
    borderRadius: Platform.OS === 'ios' ? 4 : 4,
    backgroundColor: Platform.OS === 'ios' ? '#34C759' : '#10b981',
  },
  headerText: {
    fontSize: Platform.OS === 'ios' ? 15 : 13,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: Platform.OS === 'ios' ? '#FFFFFF' : '#fff',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.OS === 'ios' ? 0 : 12,
    gap: Platform.OS === 'ios' ? 0 : 8,
  },
  feedbackItem: {
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#1e293b',
    borderRadius: Platform.OS === 'ios' ? 0 : 8,
    padding: Platform.OS === 'ios' ? 16 : 10,
    paddingLeft: Platform.OS === 'ios' ? 16 : 13,
    borderLeftWidth: Platform.OS === 'ios' ? 0 : 3,
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
    minHeight: Platform.OS === 'ios' ? 44 : undefined,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: Platform.OS === 'ios' ? 16 : 0,
    marginTop: Platform.OS === 'ios' ? 16 : 0,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: Platform.OS === 'ios' ? 8 : 6,
  },
  badge: {
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 6,
    paddingVertical: Platform.OS === 'ios' ? 3 : 2,
    borderRadius: Platform.OS === 'ios' ? 6 : 4,
  },
  badgeText: {
    fontSize: Platform.OS === 'ios' ? 11 : 9,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: '#FFFFFF',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  timeText: {
    fontSize: Platform.OS === 'ios' ? 13 : 10,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  feedbackContent: {
    flexDirection: 'row',
    gap: Platform.OS === 'ios' ? 12 : 8,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
  },
  message: {
    flex: 1,
    fontSize: Platform.OS === 'ios' ? 15 : 12,
    color: Platform.OS === 'ios' ? '#FFFFFF' : '#e2e8f0',
    lineHeight: Platform.OS === 'ios' ? 22 : 18,
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 48 : 32,
    paddingHorizontal: Platform.OS === 'ios' ? 32 : 16,
  },
  emptyIcon: {
    fontSize: Platform.OS === 'ios' ? 36 : 32,
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
    opacity: Platform.OS === 'ios' ? 0.4 : 0.5,
  },
  emptyText: {
    fontSize: Platform.OS === 'ios' ? 15 : 13,
    color: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
    textAlign: 'center',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
})

