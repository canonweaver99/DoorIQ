import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../contexts/AuthContext'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0a0a0a' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="trainer/select-homeowner" />
          <Stack.Screen name="trainer/[sessionId]" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

