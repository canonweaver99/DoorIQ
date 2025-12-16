export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ reps: [] })
    }

    // Get all team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('users')
      .select('id, full_name, email, role, virtual_earnings, created_at, avatar_url')
      .eq('team_id', userProfile.team_id)
      .order('virtual_earnings', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Get session data for each member
    const repsWithStats = await Promise.all(
      (teamMembers || []).map(async (member) => {
        // Get sessions in the last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: recentSessions } = await supabase
          .from('live_sessions')
          .select('overall_score, created_at, ended_at')
          .eq('user_id', member.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })

        // Get all sessions for average score
        const { data: allSessions } = await supabase
          .from('live_sessions')
          .select('overall_score')
          .eq('user_id', member.id)
          .not('overall_score', 'is', null)

        // Calculate average score
        const scores = allSessions?.filter(s => s.overall_score !== null).map(s => s.overall_score!) || []
        const avgScore = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0

        // Calculate trend (compare last 3 sessions vs previous 3)
        const last3 = scores.slice(0, 3)
        const previous3 = scores.slice(3, 6)
        let trend = 0
        if (last3.length > 0 && previous3.length > 0) {
          const last3Avg = last3.reduce((sum, s) => sum + s, 0) / last3.length
          const prev3Avg = previous3.reduce((sum, s) => sum + s, 0) / previous3.length
          trend = Math.round(last3Avg - prev3Avg)
        }

        // Determine status based on last activity
        let status = 'Offline'
        let lastActive = 'Never'
        
        if (recentSessions && recentSessions.length > 0) {
          const lastSession = recentSessions[0]
          const lastTime = new Date(lastSession.created_at)
          const now = new Date()
          const diffMs = now.getTime() - lastTime.getTime()
          const diffMins = Math.floor(diffMs / 60000)
          const diffHours = Math.floor(diffMins / 60)
          const diffDays = Math.floor(diffHours / 24)

          if (diffMins < 60) {
            lastActive = `${diffMins} min ago`
            status = lastSession.ended_at ? 'Available' : 'In Training'
          } else if (diffHours < 24) {
            lastActive = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
            status = 'Available'
          } else if (diffDays < 7) {
            lastActive = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
            status = 'Available'
          } else {
            lastActive = 'Over a week ago'
            status = 'Offline'
          }

          // Check if actively in a session (ended_at is null and recent)
          if (!lastSession.ended_at && diffMins < 30) {
            status = 'In Training'
          }
        }

        return {
          id: member.id,
          name: member.full_name,
          email: member.email,
          role: member.role,
          avatar_url: member.avatar_url,
          status,
          score: avgScore,
          sessionsWeek: recentSessions?.length || 0,
          trend,
          trendUp: trend >= 0,
          lastActive,
          virtualEarnings: member.virtual_earnings || 0
        }
      })
    )

    return NextResponse.json({ reps: repsWithStats })
  } catch (error) {
    console.error('Error in team reps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

