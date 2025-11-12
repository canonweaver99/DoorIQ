import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    )
  }

  if (session) {
    return <Redirect href="/dashboard" />
  }

  return <Redirect href="/auth/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

