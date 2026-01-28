import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return a mock client during SSR/build to prevent errors
    return null as any
  }

  // Additional check for browser APIs (important for TV browsers)
  if (typeof window.localStorage === 'undefined' || typeof window.sessionStorage === 'undefined') {
    console.warn('⚠️ Browser storage APIs not available, Supabase client may not work correctly')
    // Still try to create client, but it may have limited functionality
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Supabase URL or Anon Key not configured')
    return null as any
  }

  try {
    const client = createBrowserClient<Database>(
      url,
      key,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Add storage error handling for TV browsers
          storage: typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage 
            : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
              } as any
        },
        global: {
          headers: {
            'X-Client-Info': 'dooriq-web'
          }
        },
        realtime: {
          // Disable realtime WebSocket connections completely
          // This prevents WebSocket connection errors in console
          params: {
            eventsPerSecond: 0
          }
        }
      }
    )
  
    // Disable Realtime completely to prevent WebSocket connection spam
    // We don't use realtime subscriptions in this app
    try {
      // Remove all channels and disconnect realtime
      const realtime = (client as any).realtime
      if (realtime) {
        // Remove all existing channels
        realtime.channels.forEach((channel: any) => {
          try {
            realtime.removeChannel(channel)
          } catch (e) {
            // Ignore errors removing channels
          }
        })
        
        // Disconnect and prevent auto-reconnection
        try {
          realtime.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
        
        // Prevent auto-reconnection by clearing access token
        realtime.accessToken = null
        
        // Override the connect method to prevent reconnection attempts
        const originalConnect = realtime.connect.bind(realtime)
        realtime.connect = () => {
          // Do nothing - prevent connection attempts
          return realtime
        }
      }
    } catch (e) {
      // Ignore errors during realtime cleanup - this is expected if realtime isn't initialized
    }
    
    return client
  } catch (error: any) {
    console.error('❌ Error creating Supabase client:', error)
    // Return null instead of throwing to allow graceful degradation
    return null as any
  }
}
