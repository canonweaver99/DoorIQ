import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const maxDuration = 10

/**
 * Health check endpoint for monitoring
 * Returns system status and basic metrics
 * 
 * Usage:
 * - Uptime monitoring: GET /api/health
 * - Detailed check: GET /api/health?detailed=true
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'

  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    // Basic database connectivity check
    const supabase = await createServiceSupabaseClient()
    const dbStartTime = Date.now()
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    const dbResponseTime = Date.now() - dbStartTime
    
    if (error) {
      health.status = 'degraded'
      health.database = {
        status: 'error',
        error: error.message,
        responseTime: dbResponseTime
      }
    } else {
      health.database = {
        status: 'ok',
        responseTime: dbResponseTime
      }
    }

    // Detailed checks if requested
    if (detailed) {
      // Check critical tables exist
      const tables = ['users', 'live_sessions', 'subscription_events']
      const tableChecks: any = {}
      
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('id')
            .limit(1)
          
          tableChecks[table] = {
            exists: !tableError,
            error: tableError?.message || null
          }
        } catch (err: any) {
          tableChecks[table] = {
            exists: false,
            error: err.message
          }
        }
      }
      
      health.tables = tableChecks

      // Check environment variables
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]
      
      const envVars: any = {}
      for (const envVar of requiredEnvVars) {
        envVars[envVar] = {
          set: !!process.env[envVar],
          // Don't expose actual values, just whether they're set
        }
      }
      
      health.environment = envVars

      // Check external services (non-blocking)
      const serviceChecks: any = {}
      
      // OpenAI check
      try {
        const openaiCheck = await fetch('https://api.openai.com/v1/models', {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        }).catch(() => null)
        serviceChecks.openai = {
          status: openaiCheck?.ok ? 'ok' : 'error',
          responseTime: openaiCheck ? 'ok' : 'timeout'
        }
      } catch {
        serviceChecks.openai = { status: 'error', responseTime: 'timeout' }
      }

      health.services = serviceChecks
    }

    health.totalResponseTime = Date.now() - startTime

    // Determine overall status
    if (health.database?.status === 'error') {
      health.status = 'degraded'
    }

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    health.status = 'error'
    health.error = error.message
    health.totalResponseTime = Date.now() - startTime
    
    return NextResponse.json(health, { status: 503 })
  }
}

