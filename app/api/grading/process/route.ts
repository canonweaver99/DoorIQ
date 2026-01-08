import { NextRequest, NextResponse } from 'next/server'
import { processNextJob } from '@/lib/queue/supabase-worker'
import { processGradingJob } from '@/trigger/session-grading'
import { logger } from '@/lib/logger'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";
export const maxDuration = 60

/**
 * Process next pending grading job from Supabase queue
 * This endpoint can be called periodically (via cron or scheduled task)
 * 
 * Now supports both Trigger.dev and Supabase queue processing
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { useTriggerDev = false } = await request.json().catch(() => ({}))

    if (useTriggerDev) {
      // Process jobs from Supabase queue using Trigger.dev
      const supabase = await createServiceSupabaseClient()
      const { data: job } = await supabase
        .from('grading_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (!job) {
        return NextResponse.json({
          success: true,
          processed: false,
          message: 'No pending jobs',
          method: 'trigger.dev',
        })
      }

      const jobData = job.job_data as any
      
      // Trigger Trigger.dev task
      const trigger = await processGradingJob.trigger({
        jobId: job.id,
        sessionId: job.session_id,
        transcript: jobData.transcript,
        batchIndex: jobData.batchIndex,
        batchSize: jobData.batchSize,
        salesRepName: jobData.salesRepName,
        customerName: jobData.customerName,
        totalBatches: jobData.totalBatches,
      })

      return NextResponse.json({
        success: true,
        processed: true,
        jobId: job.id,
        triggerId: trigger.id,
        method: 'trigger.dev',
      })
    } else {
      // Original Supabase queue processing (backward compatibility)
      const result = await processNextJob()
      
      return NextResponse.json({
        success: true,
        ...result,
        method: 'supabase-queue',
      })
    }
  } catch (error: any) {
    logger.error('Failed to process grading job', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process job' },
      { status: 500 }
    )
  }
}

