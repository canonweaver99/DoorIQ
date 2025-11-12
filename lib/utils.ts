export function assertEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export function safeParseJSON<T = any>(text: string, fallback: T): T {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

export function msToSeconds(ms: number): number {
  return Math.max(0, Math.round(ms / 1000))
}

export function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (Array.isArray(val)) return val
  if (val == null) return []
  return [val]
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Triggers a single short vibration on supported devices
 */
export function vibrate(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10) // Single short vibration (10ms)
    } catch (error) {
      // Silently fail if vibration is not supported
    }
  }
}

/**
 * Get initials from a name (first letter of first and last name)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get a color gradient class based on name for consistent colored avatars
 */
export function getAvatarColorClass(name: string): string {
  const colors = [
    'from-purple-600 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-cyan-600',
  ]
  const colorIndex = name.length % colors.length
  return `bg-gradient-to-br ${colors[colorIndex]}`
}
