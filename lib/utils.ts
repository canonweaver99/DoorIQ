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
