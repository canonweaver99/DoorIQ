import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Detailed health check endpoint
 * Returns comprehensive system status including:
 * - Database connectivity and performance
 * - Table existence checks
 * - Environment variable validation
 * - External service status
 * - Recent error counts
 */
export async function GET() {
  const startTime = Date.now()
  
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    const supabase = await createServiceSupabaseClient()

    // 1. Database Connectivity
    const dbStart = Date.now()
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    health.checks.database = {
      status: dbError ? 'error' : 'ok',
      responseTime: Date.now() - dbStart,
      error: dbError?.message || null
    }

    // 2. Critical Tables Check
    const criticalTables = [
      'users',
      'live_sessions',
      'subscription_events',
      'user_session_limits',
      'organizations',
      'messages'
    ]
    
    health.checks.tables = {}
    for (const table of criticalTables) {
      const tableStart = Date.now()
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        health.checks.tables[table] = {
          exists: !tableError,
          accessible: !tableError,
          responseTime: Date.now() - tableStart,
          error: tableError?.message || null
        }
      } catch (err: any) {
        health.checks.tables[table] = {
          exists: false,
          accessible: false,
          responseTime: Date.now() - tableStart,
          error: err.message
        }
      }
    }

    // 3. Query Performance Check
    const perfStart = Date.now()
    try {
      const { error: perfError } = await supabase
        .from('live_sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      
      health.checks.queryPerformance = {
        status: perfError ? 'error' : 'ok',
        responseTime: Date.now() - perfStart,
        error: perfError?.message || null
      }
    } catch (err: any) {
      health.checks.queryPerformance = {
        status: 'error',
        responseTime: Date.now() - perfStart,
        error: err.message
      }
    }

    // 4. Environment Variables Check
    const requiredEnvVars = {
      'NEXT_PUBLIC_SUPABASE_URL': 'Supabase URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase Anon Key',
      'SUPABASE_SERVICE_ROLE_KEY': 'Supabase Service Role Key',
      'OPENAI_API_KEY': 'OpenAI API Key',
      'ELEVEN_LABS_API_KEY': 'ElevenLabs API Key',
      'STRIPE_SECRET_KEY': 'Stripe Secret Key',
      'STRIPE_WEBHOOK_SECRET': 'Stripe Webhook Secret'
    }
    
    health.checks.environment = {}
    for (const [key, description] of Object.entries(requiredEnvVars)) {
      health.checks.environment[key] = {
        set: !!process.env[key],
        description,
        // Don't expose actual values
      }
    }

    // 5. Recent Activity Check
    try {
      const { count: recentSessions } = await supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      const { count: recentUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      health.checks.activity = {
        sessionsLast24h: recentSessions || 0,
        usersLast24h: recentUsers || 0,
        status: 'ok'
      }
    } catch (err: any) {
      health.checks.activity = {
        status: 'error',
        error: err.message
      }
    }

    // 6. Grading Status Check
    try {
      const { count: pendingGrading } = await supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .in('grading_status', ['pending', 'processing'])
      
      health.checks.grading = {
        pendingJobs: pendingGrading || 0,
        status: 'ok'
      }
    } catch (err: any) {
      health.checks.grading = {
        status: 'error',
        error: err.message
      }
    }

    // Determine overall status
    const hasErrors = Object.values(health.checks).some((check: any) => 
      check.status === 'error' || check.error
    )
    
    health.status = hasErrors ? 'degraded' : 'ok'
    health.totalResponseTime = Date.now() - startTime

    const statusCode = health.status === 'ok' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    health.status = 'error'
    health.error = error.message
    health.totalResponseTime = Date.now() - startTime
    
    return NextResponse.json(health, { status: 503 })
  }
}

