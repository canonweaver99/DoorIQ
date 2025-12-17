// Error logging temporarily disabled to prevent bridge crashes
export async function logError(error: any): Promise<void> {
  // Just log to console for now
  console.error('Error:', error)
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
