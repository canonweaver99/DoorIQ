import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// MINIMAL session system - just store basic info and transcript
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_name } = body
    
    console.log('🚀 MINIMAL: Creating session for agent:', agent_name)
    
    // Create a simple session record - no complex fields
    const sessionData = {
      id: Date.now().toString(), // Use timestamp as ID - no UUID issues
      agent_name: agent_name || 'Unknown',
      started_at: new Date().toISOString(),
      transcript: [],
      scores: {
        overall: 0,
        rapport: 0,
        discovery: 0,
        objection_handling: 0,
        closing: 0
      },
      status: 'active'
    }
    
    // Store in a simple way - we'll use localStorage or a simple table
    console.log('✅ MINIMAL session created:', sessionData.id)
    
    return NextResponse.json({ 
      id: sessionData.id,
      status: 'active'
    })
  } catch (e: any) {
    console.error('❌ MINIMAL session creation failed:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// In-memory storage for testing (will be lost on restart but good for debugging)
const sessions: { [key: string]: any } = {}

export async function GET() {
  try {
    console.log('📊 MINIMAL: Listing sessions')
    
    return NextResponse.json({ 
      sessions: Object.values(sessions),
      count: Object.keys(sessions).length
    })
  } catch (e: any) {
    console.error('❌ MINIMAL session list failed:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
