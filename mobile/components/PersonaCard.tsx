import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET, FONT_SIZES, FONT_WEIGHTS, getDifficultyColor } from '../constants/theme'
import { Agent } from '../lib/types'

interface PersonaCardProps {
  agent: Agent
  metadata?: {
    difficulty?: string
    description?: string
    subtitle?: string
    avatar?: string
    bestFor?: string
    estimatedTime?: string
  }
  onPress: () => void
  disabled?: boolean
}

export function PersonaCard({ agent, metadata, onPress, disabled = false }: PersonaCardProps) {
  const difficulty = metadata?.difficulty || 'Moderate'
  const description = metadata?.description || agent.persona || ''
  const subtitle = metadata?.subtitle || ''
  const avatar = metadata?.avatar || agent.name.charAt(0)
  const difficultyColor = getDifficultyColor(difficulty)

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{agent.name}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20', borderColor: difficultyColor }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {difficulty}
            </Text>
          </View>
        </View>

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        <View style={styles.metaContainer}>
          {metadata?.bestFor && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Best for:</Text>
              <Text style={styles.metaValue}>{metadata.bestFor}</Text>
            </View>
          )}
          {metadata?.estimatedTime && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Time:</Text>
              <Text style={styles.metaValue}>{metadata.estimatedTime}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: MIN_TOUCH_TARGET * 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  content: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  nameContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  metaValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
})

