import { supabase } from './supabase/client'
import { Platform } from 'react-native'

interface ErrorLog {
  message: string
  stack?: string
  componentStack?: string
  errorBoundary?: boolean
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Logs errors to Supabase for tracking and debugging
 */
// Flag to prevent recursive error logging
let isLoggingError = false

export async function logError(error: ErrorLog): Promise<void> {
  // TEMPORARILY DISABLED: Error logging is causing React Native bridge type errors
  // Re-enable once the boolean/string type issue is resolved
  return
  
  // Prevent recursive error logging
  if (isLoggingError) {
    return
  }
  
  // Don't log errors in production to avoid performance issues
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  try {
    isLoggingError = true
    
    // Check if supabase client is available and properly initialized
    // Use try-catch to handle any proxy-related issues
    let client: any = null
    try {
      client = supabase
      if (!client || typeof client !== 'object' || typeof client.from !== 'function') {
        return
      }
    } catch (e) {
      // Client not ready, skip logging
      return
    }

    // Get current user if available
    let userId: string | null = null
    try {
      const authResult = await client.auth.getSession()
      userId = authResult?.data?.session?.user?.id || null
    } catch (authError) {
      // Auth might not be initialized yet, that's okay
    }

    // Prepare error data - match the actual database schema
    // Schema: error_message, error_stack, error_type, component_name, severity, resolved, metadata
    // Ensure all values are the correct types to avoid React Native bridge errors
    const errorData = {
      error_message: String(error.message || 'Unknown error'),
      error_stack: error.stack ? String(error.stack) : null,
      error_type: 'client',
      component_name: error.metadata?.componentName ? String(error.metadata.componentName) : null,
      severity: 'error' as const,
      metadata: {
        ...(error.metadata || {}),
        componentStack: error.componentStack ? String(error.componentStack) : null,
        errorBoundary: error.errorBoundary === true, // Explicit boolean conversion
        platform: String(Platform.OS || 'unknown'),
        app_version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    }

    // Try to insert into error_logs table (if it exists)
    // Use the client variable we validated earlier
    try {
      const insertResult = await client.from('error_logs').insert(errorData)
      if (insertResult?.error) {
        // Silently fail - don't spam console
      }
    } catch (insertErr) {
      // Table might not exist or other insertion error, that's okay - silently fail
    }
  } catch (err) {
    // Silently fail - don't let error logging break the app
    // Don't try to log this error to prevent recursion
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logger exception:', err)
    }
  } finally {
    isLoggingError = false
  }
}

/**
 * Logs user-friendly error messages
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return 'An unexpected error occurred'

  // Supabase errors
  if (error.message) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection.'
    }
    
    if (message.includes('auth') || message.includes('session')) {
      return 'Authentication error. Please sign in again.'
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You don\'t have permission to perform this action.'
    }
  }

  // Default fallback
  return error.message || 'An unexpected error occurred. Please try again.'
}
