import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, usePathname } from 'expo-router'

export function MobileNavMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { label: 'Home', route: '/dashboard', icon: '🏠' },
    { label: 'Practice', route: '/trainer/select-homeowner', icon: '🎯' },
  ]

  const isActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(route)
  }

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const active = isActive(item.route)
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuItem, active && styles.menuItemActive]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#2a2a2a',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
  },
  labelActive: {
    color: '#a855f7',
    fontWeight: '600',
  },
})

