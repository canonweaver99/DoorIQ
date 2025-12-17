import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme'
import { AudioState } from '../lib/types'

interface CallInterfaceProps {
  duration: number
  isActive: boolean
  isConnected: boolean
  audioState: AudioState
  onStart: () => void
  onEnd: () => void
  loading?: boolean
}

export function CallInterface({
  duration,
  isActive,
  isConnected,
  audioState,
  onStart,
  onEnd,
  loading = false,
}: CallInterfaceProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <View style={styles.container}>
      {/* Status Indicator */}
      {isActive && (
        <View style={styles.statusBar}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isConnected && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Live Session' : 'Connecting...'}
            </Text>
            <Text style={styles.timer}>{formatDuration(duration)}</Text>
          </View>
        </View>
      )}

      {/* Audio Indicator */}
      {isActive && audioState.isRecording && (
        <View style={styles.audioIndicator}>
          <View style={styles.audioDot} />
          <Text style={styles.audioText}>
            {audioState.isPlaying ? 'AI is speaking...' : 'Listening...'}
          </Text>
        </View>
      )}

      {/* Start/End Button */}
      {!isActive ? (
        <TouchableOpacity
          style={[styles.startButton, loading && styles.buttonDisabled]}
          onPress={onStart}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {loading ? 'Starting...' : 'Start Practice'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.endButton, loading && styles.buttonDisabled]}
          onPress={onEnd}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.endButtonText}>End Call</Text>
        </TouchableOpacity>
      )}

      {/* Error Display */}
      {audioState.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{audioState.error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statusBar: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textTertiary,
  },
  statusDotActive: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  timer: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  audioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  audioText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  endButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
})

