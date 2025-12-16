export const dynamic = "force-static";

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get count of active agents
    const { count, error } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching agent count:', error)
      // Return default count if error
      return NextResponse.json({ count: 12 })
    }
    
    return NextResponse.json({ count: count || 12 })
  } catch (error) {
    console.error('Error in agent count API:', error)
    // Return default count if error
    return NextResponse.json({ count: 12 })
  }
}

