import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>DoorIQ Mobile</Text>
      <Text style={styles.subtext}>App is running!</Text>
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: '#888',
    fontSize: 16,
  },
})

