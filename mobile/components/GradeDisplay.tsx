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
  // Get scores with fallbacks - prioritize direct columns, then analytics, then null
  const overallScore = session.overall_score ?? session.analytics?.scores?.overall ?? 0
  const overallGrade = getGradeFromScore(overallScore)
  const gradeColor = GRADE_COLORS[overallGrade]

  // Tone/Rapport score (can be rapport_score or tone-related)
  const rapportScore = session.rapport_score ?? session.analytics?.scores?.rapport ?? null
  const toneScore = rapportScore // Use rapport as tone score
  
  // Objection handling score
  const objectionScore = session.objection_handling_score ?? session.analytics?.scores?.objection_handling ?? null
  
  // Closing score
  const closingScore = session.close_score ?? session.analytics?.scores?.closing ?? null

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
          label="Tone" 
          score={toneScore} 
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
          <Text style={styles.secondaryButtonText}>Choose New Agent</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function ScoreItem({ label, score, color }: { label: string; score: number | null; color: string }) {
  if (score === null) return null

  const grade = getGradeFromScore(score)
  const gradeColor = GRADE_COLORS[grade]

  return (
    <View style={styles.scoreItem}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <View style={[styles.gradeBadgeSmall, { backgroundColor: gradeColor + '20', borderColor: gradeColor }]}>
          <Text style={[styles.gradeTextSmall, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBar, { width: `${score}%`, backgroundColor: gradeColor }]} />
      </View>
      <View style={styles.scoreFooter}>
        <Text style={[styles.scoreValue, { color: gradeColor }]}>{score}%</Text>
        <Text style={styles.scoreSubtext}>
          {score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : score >= 60 ? 'Needs Work' : 'Poor'}
        </Text>
      </View>
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
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    flex: 1,
  },
  gradeBadgeSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradeTextSmall: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
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
  scoreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  scoreValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  scoreSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
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
