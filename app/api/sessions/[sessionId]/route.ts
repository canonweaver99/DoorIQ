import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()
    
    // Fetch session with user data
    const { data: session, error } = await supabase
      .from('live_sessions')
      .select(`
        *,
        users!user_id (
          full_name,
          email
        )
      `)
      .eq('id', sessionId)
      .single()
    
    if (error || !session) {
      console.error('Session fetch error:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Line ratings are already stored in the analytics JSONB column
    // No need to fetch from a separate table

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
