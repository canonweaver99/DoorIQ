// Delay native module imports until bridge is ready
let getRandomValues: any = null
let AsyncStorage: any = null
let createSupabaseClient: any = null

function ensureNativeModules() {
  if (!getRandomValues) {
    try {
      require('react-native-get-random-values')
    } catch (e) {
      // Ignore if not available
    }
  }
  if (!AsyncStorage) {
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default
    } catch (e) {
      // Fallback mock
      AsyncStorage = {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      }
    }
  }
  if (!createSupabaseClient) {
    try {
      createSupabaseClient = require('@supabase/supabase-js').createClient
    } catch (e) {
      console.error('Failed to load Supabase client:', e)
    }
  }
}

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
  // Ensure native modules are loaded
  ensureNativeModules()
  
  const config = getSupabaseConfig()
  
  if (!config) {
    // Don't throw - return a mock client to prevent crashes
    console.error('Supabase URL and Anon Key must be configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.')
    // Return a minimal mock client that will fail gracefully
    return {} as any
  }
  
  if (!createSupabaseClient) {
    console.error('Supabase client not available')
    return {} as any
  }
  
  const { url: supabaseUrl, key: supabaseAnonKey } = config

  try {
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
  } catch (error: any) {
    console.error('Failed to create Supabase client:', error?.message || error)
    // Return a mock client to prevent crashes
    return {} as any
  }
}

// Initialize client - wrap in try-catch to handle initialization errors gracefully
let _supabaseClient: ReturnType<typeof createClient> | null = null
let _initError: Error | null = null

function getSupabase() {
  if (_initError) {
    throw _initError
  }
  
  if (!_supabaseClient) {
    try {
      _supabaseClient = createClient()
    } catch (error: any) {
      // Store the error but don't throw immediately
      _initError = error
      console.warn('Supabase client initialization failed:', error?.message || error)
      throw error
    }
  }
  return _supabaseClient
}

// Lazy initialization - only create when first accessed, not on import
let _client: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!_client) {
    try {
      _client = createClient()
    } catch (e) {
      console.error('Failed to create Supabase client:', e)
      // Return minimal mock
      _client = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        }),
      } as any
    }
  }
  return _client
}

// Export as getter to delay initialization
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})

