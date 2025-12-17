import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, GRADE_COLORS, getGradeFromScore } from '../constants/theme'
import { LiveSession } from '../lib/types'

interface GradeDisplayProps {
  session: LiveSession
  onPracticeAgain: () => void
  onChooseNewPersona: () => void
}

export function GradeDisplay({ session, onPracticeAgain, onChooseNewPersona }: GradeDisplayProps) {
  const overallScore = session.overall_score || 0
  const overallGrade = getGradeFromScore(overallScore)
  const gradeColor = GRADE_COLORS[overallGrade]

  const rapportScore = session.rapport_score || session.analytics?.scores?.rapport || null
  const objectionScore = session.objection_handling_score || session.analytics?.scores?.objection_handling || null
  const closingScore = session.close_score || session.analytics?.scores?.closing || null

  const strengths = session.analytics?.feedback?.strengths || []
  const improvements = session.analytics?.feedback?.improvements || []

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overall Grade */}
      <View style={styles.overallGradeContainer}>
        <Text style={styles.overallGradeLabel}>Overall Grade</Text>
        <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
          <Text style={[styles.gradeLetter, { color: gradeColor }]}>{overallGrade}</Text>
        </View>
        <Text style={styles.overallScore}>{overallScore}%</Text>
      </View>

      {/* Score Breakdown */}
      <View style={styles.scoresContainer}>
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        
        <ScoreItem 
          label="Tone & Rapport" 
          score={rapportScore} 
          color={COLORS.info}
        />
        <ScoreItem 
          label="Objection Handling" 
          score={objectionScore} 
          color={COLORS.warning}
        />
        <ScoreItem 
          label="Closing Technique" 
          score={closingScore} 
          color={COLORS.success}
        />
      </View>

      {/* Strengths */}
      {strengths.length > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.sectionTitle}>Key Strengths</Text>
          {strengths.map((strength, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.feedbackBullet}>✓</Text>
              <Text style={styles.feedbackText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Areas for Improvement */}
      {improvements.length > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.sectionTitle}>Areas for Improvement</Text>
          {improvements.map((improvement, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.feedbackBullet}>•</Text>
              <Text style={styles.feedbackText}>{improvement}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onPracticeAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onChooseNewPersona}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Choose New Persona</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function ScoreItem({ label, score, color }: { label: string; score: number | null; color: string }) {
  if (score === null) return null

  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBar, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreValue, { color }]}>{score}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  overallGradeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  overallGradeLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  gradeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  gradeLetter: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.bold,
  },
  overallScore: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  scoresContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  scoreItem: {
    marginBottom: SPACING.lg,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  feedbackContainer: {
    marginBottom: SPACING.xl,
  },
  feedbackItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  feedbackBullet: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  feedbackText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
})
