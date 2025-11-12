import 'react-native-get-random-values'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from './database.types'
import Constants from 'expo-constants'

function getSupabaseConfig() {
  const url = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL
  const key = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase URL or Anon Key not configured')
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
      detectSessionInUrl: false,
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

export const supabase = createClient()

