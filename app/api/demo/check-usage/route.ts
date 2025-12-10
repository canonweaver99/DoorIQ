import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

// Check if user has used their free demo
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // For authenticated users, check database
    if (user) {
      const serviceSupabase = await createServiceSupabaseClient()
      const { data: userData, error } = await serviceSupabase
        .from('users')
        .select('used_free_demo, free_demo_used_at')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error checking demo usage:', error)
        return NextResponse.json({ used: false, error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        used: userData?.used_free_demo || false,
        usedAt: userData?.free_demo_used_at || null
      })
    }
    
    // For anonymous users, check localStorage on client side
    // This endpoint just returns that anonymous users need client-side check
    return NextResponse.json({ used: false, anonymous: true })
  } catch (error: any) {
    console.error('Error checking demo usage:', error)
    return NextResponse.json({ used: false, error: error.message }, { status: 500 })
  }
}

// Mark demo as used
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Verify this is a free demo session
    const { data: sessionData } = await serviceSupabase
      .from('live_sessions')
      .select('is_free_demo, user_id')
      .eq('id', sessionId)
      .single()
    
    if (!sessionData || !sessionData.is_free_demo) {
      return NextResponse.json({ error: 'Invalid demo session' }, { status: 400 })
    }
    
    // For authenticated users, mark in database
    if (user && sessionData.user_id === user.id) {
      const { error: updateError } = await serviceSupabase
        .from('users')
        .update({
          used_free_demo: true,
          free_demo_used_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error marking demo as used:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, marked: true })
    }
    
    // For anonymous users, return success (client will handle localStorage)
    return NextResponse.json({ success: true, anonymous: true })
  } catch (error: any) {
    console.error('Error marking demo as used:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
