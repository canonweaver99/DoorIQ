import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return a mock client during SSR/build to prevent errors
    return null as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Supabase URL or Anon Key not configured')
    return null as any
  }

  const client = createBrowserClient<Database>(
    url,
    key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': 'dooriq-web'
        }
      }
    }
  )
  
  // Disable Realtime to prevent WebSocket connection spam
  // We don't use realtime subscriptions in this app
  if ((client as any).realtime) {
    (client as any).realtime.disconnect()
  }
  
  return client
}
