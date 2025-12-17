import { Tabs } from 'expo-router'
import { Platform, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(26, 26, 26, 0.95)' : COLORS.backgroundSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="mic" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}

// Simple icon component using emoji for now (can be replaced with react-native-vector-icons later)
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    home: '🏠',
    mic: '🎤',
    user: '👤',
  }
  
  return (
    <Text style={{ fontSize: size }}>
      {icons[name] || '•'}
    </Text>
  )
}
