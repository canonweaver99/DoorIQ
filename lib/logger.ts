/**
 * Logger utility for DoorIQ
 * 
 * Provides environment-aware logging:
 * - Development: All logs are shown with emoji prefixes
 * - Production: Only errors and warnings are logged
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Failed to fetch data', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogData {
  [key: string]: any
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  /**
   * Debug logs - only shown in development
   * Use for detailed debugging information
   */
  debug(message: string, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`🔍 ${message}`, data ? data : '')
  }

  /**
   * Info logs - only shown in development
   * Use for general information
   */
  info(message: string, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`ℹ️  ${message}`, data ? data : '')
  }

  /**
   * Success logs - only shown in development
   * Use for successful operations
   */
  success(message: string, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`✅ ${message}`, data ? data : '')
  }

  /**
   * Warning logs - shown in all environments
   * Use for non-critical issues
   */
  warn(message: string, data?: LogData): void {
    console.warn(`⚠️  ${message}`, data ? data : '')
  }

  /**
   * Error logs - shown in all environments
   * Use for errors and exceptions
   */
  error(message: string, error?: Error | any, data?: LogData): void {
    if (error instanceof Error) {
      console.error(`❌ ${message}`, {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        ...data
      })
    } else {
      console.error(`❌ ${message}`, error, data ? data : '')
    }
  }

  /**
   * Performance logs - only shown in development
   * Use for timing operations
   */
  perf(message: string, durationMs: number, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`⏱️  ${message} (${durationMs}ms)`, data ? data : '')
  }

  /**
   * API logs - only shown in development
   * Use for API request/response tracking
   */
  api(message: string, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`📡 ${message}`, data ? data : '')
  }

  /**
   * Database logs - only shown in development
   * Use for database operations
   */
  db(message: string, data?: LogData): void {
    if (!this.isDevelopment) return
    console.log(`💾 ${message}`, data ? data : '')
  }

  /**
   * Start a timer for performance measurement
   */
  startTimer(): () => number {
    const start = Date.now()
    return () => Date.now() - start
  }

  /**
   * Group logs together (only in development)
   */
  group(label: string, callback: () => void): void {
    if (!this.isDevelopment) {
      callback()
      return
    }
    console.group(`📦 ${label}`)
    callback()
    console.groupEnd()
  }
}

// Export a singleton instance
export const logger = new Logger()

// Export for testing or custom instances
export default Logger

