import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native'

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
    </View>
  )
}

export const LiveFeedbackFeed = React.memo(({ feedbackItems }: LiveFeedbackFeedProps) => {
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (flatListRef.current && feedbackItems.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [feedbackItems.length])

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
          ref={flatListRef}
          data={feedbackItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={localStyles.scrollView}
          contentContainerStyle={localStyles.scrollContent}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  )
})

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  feedbackItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  feedbackContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
})

