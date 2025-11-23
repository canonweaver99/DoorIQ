import { NextRequest, NextResponse } from 'next/server'
import { processNextJob } from '@/lib/queue/supabase-worker'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Process next pending grading job from Supabase queue
 * This endpoint can be called periodically (via cron or scheduled task)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const result = await processNextJob()
    
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    logger.error('Failed to process grading job', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process job' },
      { status: 500 }
    )
  }
}

