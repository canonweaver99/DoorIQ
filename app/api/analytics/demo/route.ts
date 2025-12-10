import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId } = await request.json()
    
    // Track demo analytics (non-blocking logging for now)
    // Can be enhanced later with database tracking
    console.log('📊 Demo Analytics:', { action, sessionId, timestamp: new Date().toISOString() })
    
    // Optional: Track in database if table exists
    try {
      const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
      const serviceSupabase = await createServiceSupabaseClient()
      
      if (action === 'started') {
        await serviceSupabase
          .from('demo_analytics')
          .insert({
            event_type: 'demo_started',
            created_at: new Date().toISOString()
          })
          .catch(() => {}) // Non-blocking - table might not exist
      } else if (action === 'completed' && sessionId) {
        await serviceSupabase
          .from('demo_analytics')
          .insert({
            event_type: 'demo_completed',
            session_id: sessionId,
            created_at: new Date().toISOString()
          })
          .catch(() => {}) // Non-blocking - table might not exist
      }
    } catch (dbError) {
      // Database tracking is optional - just log
      console.log('Demo analytics DB tracking skipped (optional)')
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Demo analytics error:', error)
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
