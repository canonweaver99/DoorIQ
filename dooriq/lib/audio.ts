import { Audio } from 'expo-av'
import { Platform } from 'react-native'

/**
 * Audio utilities for handling voice recording and playback
 */

export interface AudioPermissions {
  granted: boolean
  canAskAgain: boolean
}

/**
 * Request audio recording permissions
 */
export async function requestAudioPermissions(): Promise<AudioPermissions> {
  try {
    const { status, canAskAgain } = await Audio.requestPermissionsAsync()
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? false,
    }
  } catch (error) {
    console.error('Error requesting audio permissions:', error)
    return {
      granted: false,
      canAskAgain: false,
    }
  }
}

/**
 * Configure audio mode for recording and playback
 */
export async function configureAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    })
  } catch (error) {
    console.error('Error configuring audio mode:', error)
  }
}

/**
 * Check if audio permissions are granted
 */
export async function checkAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.getPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    console.error('Error checking audio permissions:', error)
    return false
  }
}

/**
 * Get user-friendly error message for audio errors
 */
export function getAudioErrorMessage(error: any): string {
  if (!error) return 'Audio error occurred'

  const message = error.message?.toLowerCase() || ''

  if (message.includes('permission')) {
    return 'Microphone permission is required. Please enable it in settings.'
  }

  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your internet connection.'
  }

  if (message.includes('format') || message.includes('codec')) {
    return 'Audio format not supported. Please try again.'
  }

  return 'Audio error occurred. Please try again.'
}
