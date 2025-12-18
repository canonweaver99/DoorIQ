import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { COLORS, SPACING } from '../constants/theme'

interface SpeakingIndicatorProps {
  isSpeaking: boolean
  barCount?: number
}

export function SpeakingIndicator({ isSpeaking, barCount = 5 }: SpeakingIndicatorProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current

  useEffect(() => {
    if (isSpeaking) {
      // Create staggered animations for each bar
      const anims = animations.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        )
      })

      // Start all animations
      Animated.parallel(anims).start()
    } else {
      // Reset all bars to low state
      Animated.parallel(
        animations.map((anim) =>
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ).start()
    }
  }, [isSpeaking, animations])

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 32],
              }),
              opacity: anim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    height: 40,
  },
  bar: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    minHeight: 8,
  },
})


