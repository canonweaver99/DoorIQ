import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()
    
    // Get session details from live_sessions
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const repId = (session as any).user_id as string
    // Fetch user profile for name/email (best-effort)
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('full_name, email')
      .eq('id', repId)
      .single()
    const repName = (userProfile?.full_name as string) || 'Your rep'
    const overallScore = (session as any).overall_score as number | null
    const sessionEarnings = (session as any).virtual_earnings as number | null

    // Find managers for this rep
    const { data: assignments } = await (supabase as any)
      .from('manager_rep_assignments')
      .select(`
        manager_id,
        manager:users!inner(id, email, full_name)
      `)
      .eq('rep_id', repId)

    if (!assignments || assignments.length === 0) {
      console.log('No managers assigned to rep:', repId)
      return NextResponse.json({ message: 'No managers to notify' })
    }

    // Create notification messages for each manager
    const notifications = await Promise.all(
      (assignments as any[]).map(async (assignment) => {
        const message = `${repName} just completed a training session with a score of ${overallScore ?? 'pending'}%. ${
          sessionEarnings && sessionEarnings > 0 
            ? `They earned $${sessionEarnings.toFixed(2)} in virtual commission!` 
            : ''
        }`

        // Create a message in the system (cast to any for TS compatibility)
        try {
          await (supabase as any)
            .from('messages')
            .insert({
              sender_id: repId,
              recipient_id: assignment.manager_id,
              session_id: sessionId,
              message: `[System Notification] ${message}`
            })
        } catch {}

        return {
          manager: assignment.manager?.full_name ?? assignment.manager_id,
          notified: true
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      notificationsCount: notifications.length,
      notifications 
    })
    
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
