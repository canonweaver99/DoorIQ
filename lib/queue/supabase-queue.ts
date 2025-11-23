import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface LineRatingJobData {
  sessionId: string
  transcript: any[]
  batchIndex: number
  batchSize: number
  salesRepName: string
  customerName: string
  totalBatches: number
}

/**
 * Add line-by-line rating job to Supabase queue table
 * Uses Supabase database as a simple job queue
 */
export async function addLineRatingJob(data: LineRatingJobData) {
  try {
    const supabase = await createServiceSupabaseClient()
    
    // Insert job into queue table
    const { data: job, error } = await supabase
      .from('grading_jobs')
      .insert({
        session_id: data.sessionId,
        job_type: 'line_rating',
        job_data: {
          transcript: data.transcript,
          batchIndex: data.batchIndex,
          batchSize: data.batchSize,
          salesRepName: data.salesRepName,
          customerName: data.customerName,
          totalBatches: data.totalBatches,
        },
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info('Line rating job added to Supabase queue', {
      sessionId: data.sessionId,
      batchIndex: data.batchIndex,
      jobId: job.id,
    })

    return { id: job.id, ...job }
  } catch (error) {
    logger.error('Failed to add line rating job', error, {
      sessionId: data.sessionId,
      batchIndex: data.batchIndex,
    })
    throw error
  }
}

/**
 * Get next pending job from queue
 */
export async function getNextPendingJob() {
  try {
    const supabase = await createServiceSupabaseClient()
    
    const { data: job, error } = await supabase
      .from('grading_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return job
  } catch (error) {
    logger.error('Failed to get next pending job', error)
    throw error
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId: string, status: 'processing' | 'completed' | 'failed', result?: any) {
  try {
    const supabase = await createServiceSupabaseClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed' && result) {
      updateData.result = result
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'failed') {
      updateData.error = result
      updateData.failed_at = new Date().toISOString()
    } else if (status === 'processing') {
      updateData.started_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('grading_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (error) {
      throw error
    }

    logger.info('Job status updated', { jobId, status })
  } catch (error) {
    logger.error('Failed to update job status', error, { jobId, status })
    throw error
  }
}

