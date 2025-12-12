import { createClient } from '@/lib/supabase/client'

interface LogErrorParams {
  error: Error | string
  errorType?: 'client' | 'server' | 'api' | 'elevenlabs' | 'webrtc'
  componentName?: string
  severity?: 'warning' | 'error' | 'critical'
  metadata?: Record<string, any>
}

/**
 * Logs an error to Supabase error_logs table
 * This function never throws - it gracefully handles failures to prevent breaking the app
 */
export async function logError({
  error,
  errorType = 'client',
  componentName,
  severity = 'error',
  metadata = {}
}: LogErrorParams) {
  try {
    const supabase = createClient()
    
    // Only proceed if we have a valid Supabase client (client-side only)
    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error logger: Supabase client not available')
      }
      return
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Parse error
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Capture client-side context (only if in browser)
    const pageUrl = typeof window !== 'undefined' ? window.location.href : null
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null
    
    // Log to Supabase
    const { error: logError } = await supabase
      .from('error_logs')
      .insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        error_message: errorMessage,
        error_stack: errorStack,
        error_type: errorType,
        page_url: pageUrl,
        user_agent: userAgent,
        component_name: componentName,
        severity: severity,
        metadata: metadata
      })
    
    if (logError) {
      // Don't throw - just log to console
      console.error('Failed to log error to Supabase:', logError)
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: errorMessage,
        type: errorType,
        component: componentName,
        severity,
        metadata
      })
    }
  } catch (err) {
    // Fallback - don't let error logging break the app
    console.error('Error logger failed:', err)
  }
}
