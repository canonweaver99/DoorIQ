import 'react-native-get-random-values' // ← MUST be first!
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from './database.types'

function getSupabaseConfig() {
  // Always use environment variables directly - they're set at build time
  // The app.json extra values are just for reference, not runtime values
  let url = process.env.EXPO_PUBLIC_SUPABASE_URL
  let key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  
  // Try to get from Constants as fallback (only if env vars not set)
  // Wrap in try-catch to avoid crashing if native modules aren't ready
  if ((!url || !key) && typeof require !== 'undefined') {
    try {
      const ConstantsModule = require('expo-constants')
      const Constants = ConstantsModule?.default || ConstantsModule
      if (Constants && typeof Constants === 'object' && Constants.expoConfig?.extra) {
        const extra = Constants.expoConfig.extra
        if (!url && extra.supabaseUrl && typeof extra.supabaseUrl === 'string' && !extra.supabaseUrl.startsWith('process.env')) {
          url = extra.supabaseUrl
        }
        if (!key && extra.supabaseAnonKey && typeof extra.supabaseAnonKey === 'string' && !extra.supabaseAnonKey.startsWith('process.env')) {
          key = extra.supabaseAnonKey
        }
      }
    } catch (e) {
      // Constants not available - this is fine, we'll use env vars
      // Native modules might not be ready yet during initial load
      // This error is expected and can be safely ignored
    }
  }
  
  if (!url || !key) {
    console.warn('Supabase URL or Anon Key not configured. Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.')
    return null
  }
  
  return { url, key }
}

export function createClient() {
  const config = getSupabaseConfig()
  
  if (!config) {
    throw new Error('Supabase URL and Anon Key must be configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.')
  }
  
  const { url: supabaseUrl, key: supabaseAnonKey } = config

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Enable to auto-detect sessions from URL
    },
    global: {
      headers: {
        'X-Client-Info': 'dooriq-mobile',
      },
    },
  })

  // Disable Realtime completely to prevent WebSocket connection spam
  try {
    const realtime = (client as any).realtime
    if (realtime) {
      realtime.channels.forEach((channel: any) => {
        realtime.removeChannel(channel)
      })
      realtime.disconnect()
      realtime.accessToken = null
    }
  } catch (e) {
    // Ignore errors during realtime cleanup
  }

  return client
}

// Initialize client - wrap in try-catch to handle initialization errors gracefully
let _supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!_supabaseClient) {
    try {
      _supabaseClient = createClient()
    } catch (error) {
      // If initialization fails (e.g., native modules not ready), throw to be caught by caller
      throw error
    }
  }
  return _supabaseClient
}

// Lazy initialization - will attempt to create client on first access
// This prevents crashes during module load if env vars aren't ready yet
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    try {
      const client = getSupabase()
      const value = (client as any)[prop]
      // Bind functions to maintain 'this' context
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    } catch (error) {
      // If client initialization fails, return safe defaults for common methods
      if (prop === 'from') {
        return () => ({
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client not initialized' } }),
          select: () => Promise.resolve({ data: null, error: { message: 'Supabase client not initialized' } }),
        })
      }
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        }
      }
      // For other properties, throw to indicate client isn't ready
      throw error
    }
  }
})

