import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
