import { Queue } from 'bullmq'
import { getRedisClient } from './redis'
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

export interface GradingJobData {
  sessionId: string
  transcript: any[]
  salesRepName: string
  customerName: string
}

// Create grading queue
export const gradingQueue = new Queue<GradingJobData>('grading', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
})

// Create line-by-line rating queue
export const lineRatingQueue = new Queue<LineRatingJobData>('line-rating', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 5000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
})

// Helper to add grading job
export async function addGradingJob(data: GradingJobData) {
  try {
    const job = await gradingQueue.add('grade-session', data, {
      jobId: `grading-${data.sessionId}`,
    })
    logger.info('Grading job added', { sessionId: data.sessionId, jobId: job.id })
    return job
  } catch (error) {
    logger.error('Failed to add grading job', error, { sessionId: data.sessionId })
    throw error
  }
}

// Helper to add line-by-line rating job
export async function addLineRatingJob(data: LineRatingJobData) {
  try {
    const job = await lineRatingQueue.add('rate-lines', data, {
      jobId: `line-rating-${data.sessionId}-batch-${data.batchIndex}`,
    })
    logger.info('Line rating job added', {
      sessionId: data.sessionId,
      batchIndex: data.batchIndex,
      jobId: job.id,
    })
    return job
  } catch (error) {
    logger.error('Failed to add line rating job', error, {
      sessionId: data.sessionId,
      batchIndex: data.batchIndex,
    })
    throw error
  }
}

// Helper to get job status
export async function getJobStatus(jobId: string) {
  try {
    const job = await gradingQueue.getJob(jobId)
    if (!job) {
      return null
    }
    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      failedReason: job.failedReason,
    }
  } catch (error) {
    logger.error('Failed to get job status', error, { jobId })
    throw error
  }
}

