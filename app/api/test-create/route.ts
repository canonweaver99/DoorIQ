import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Test session creation in complete isolation
export async function GET() {
  try {
    console.log('🧪 TEST: Attempting to create a test session...')
    
    const supabase = await createServiceSupabaseClient()
    
    // Try to create the absolute minimum session
    const testData = {
      user_id: 'c4721c11-8b92-47f6-be26-ebc6d8976f6', // Known user ID from debug
      agent_name: 'Test Agent',
      started_at: new Date().toISOString()
    }
    
    console.log('📝 TEST: Inserting test data:', testData)
    
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .insert(testData)
      .select('id, user_id, agent_name, started_at')
      .single()
    
    if (error) {
      console.error('❌ TEST: Insert failed:', error)
      return NextResponse.json({
        status: 'FAILED',
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        test_data: testData
      })
    }
    
    console.log('✅ TEST: Session created successfully:', data)
    
    // Now try to fetch it back
    const { data: fetchData, error: fetchError } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', data.id)
      .single()
    
    if (fetchError) {
      console.error('❌ TEST: Fetch failed:', fetchError)
      return NextResponse.json({
        status: 'CREATE_SUCCESS_FETCH_FAILED',
        created_session: data,
        fetch_error: fetchError.message
      })
    }
    
    console.log('✅ TEST: Session fetched successfully')
    
    return NextResponse.json({
      status: 'SUCCESS',
      created_session: data,
      fetched_session: fetchData,
      message: 'Session creation and retrieval both work!'
    })
  } catch (e: any) {
    console.error('❌ TEST: Fatal error:', e)
    return NextResponse.json({
      status: 'FATAL_ERROR',
      error: e.message,
      stack: e.stack
    })
  }
}
