import { Worker, Job } from 'bullmq'
import { getRedisClient } from './redis'
import { logger } from '@/lib/logger'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { getCachedPhrase, cachePhrase } from '@/lib/cache/phrase-cache'
import { LineRatingJobData } from './grading-queue'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
})

const BATCH_SIZE = 5 // Process 5 lines at a time

/**
 * Process line-by-line rating job
 */
async function processLineRatingJob(job: Job<LineRatingJobData>) {
  const { sessionId, transcript, batchIndex, batchSize, salesRepName, customerName, totalBatches } = job.data
  
  logger.info('Processing line rating batch', {
    sessionId,
    batchIndex,
    batchSize,
    totalBatches,
    linesInBatch: transcript.length,
  })

  const supabase = await createServiceSupabaseClient()

  // Get session to check if it still exists
  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Filter to only rep lines for rating
  const repLines = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )

  if (repLines.length === 0) {
    logger.info('No rep lines in batch, skipping', { sessionId, batchIndex })
    return { rated: 0, cached: 0 }
  }

  const ratings: any[] = []
  let cachedCount = 0

  // Process each line (check cache first)
  for (const line of repLines) {
    const text = line.text || line.message || ''
    const lineIndex = line.index || line.line_number || 0

    // Check cache first
    const cached = await getCachedPhrase(text)
    if (cached) {
      ratings.push({
        line_index: lineIndex,
        line_text: text,
        rating: cached.rating,
        alternatives: cached.alternatives,
        cached: true,
      })
      cachedCount++
      continue
    }

    // Rate with OpenAI if not cached
    try {
      const rating = await rateLineWithAI(text, salesRepName, customerName)
      
      // Cache the result
      await cachePhrase(text, rating.alternatives, rating.rating)
      
      ratings.push({
        line_index: lineIndex,
        line_text: text,
        rating: rating.rating,
        alternatives: rating.alternatives,
        cached: false,
      })
    } catch (error) {
      logger.error('Failed to rate line', error, { sessionId, lineIndex, text: text.substring(0, 50) })
      // Continue with other lines even if one fails
      ratings.push({
        line_index: lineIndex,
        line_text: text,
        rating: 'error',
        alternatives: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Update database with batch results
  if (ratings.length > 0) {
    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('analytics')
      .eq('id', sessionId)
      .single()

    const existingAnalytics = existingSession?.analytics || {}
    const existingLineRatings = existingAnalytics.line_ratings || []
    const completedBatches = (existingAnalytics.line_ratings_completed_batches || 0) + 1

    // Merge new ratings with existing ones (avoid duplicates by line_index)
    const lineIndexMap = new Map(existingLineRatings.map((r: any) => [r.line_index, r]))
    ratings.forEach((r) => lineIndexMap.set(r.line_index, r))
    const updatedLineRatings = Array.from(lineIndexMap.values())

    // Check if all batches are complete
    const isComplete = completedBatches >= totalBatches

    await supabase
      .from('live_sessions')
      .update({
        analytics: {
          ...existingAnalytics,
          line_ratings: updatedLineRatings,
          line_ratings_completed_batches: completedBatches,
          line_ratings_status: isComplete ? 'completed' : 'processing',
        },
      })
      .eq('id', sessionId)

    logger.info('Line ratings batch saved', {
      sessionId,
      batchIndex,
      ratingsCount: ratings.length,
      cachedCount,
      totalRatings: updatedLineRatings.length,
      completedBatches,
      totalBatches,
      isComplete,
    })
  }

  return {
    rated: ratings.length,
    cached: cachedCount,
    batchIndex,
    totalBatches,
  }
}

/**
 * Rate a single line using OpenAI
 */
async function rateLineWithAI(
  lineText: string,
  salesRepName: string,
  customerName: string
): Promise<{ rating: string; alternatives: string[] }> {
  const prompt = `You are an expert door-to-door sales coach. Rate this sales rep line and provide better alternatives.

Sales Rep Line: "${lineText}"

Rate the effectiveness as one of: "excellent", "good", "poor", "missed_opportunity"

Provide 2-3 alternative ways to say this that would be more effective.

Return JSON:
{
  "rating": "excellent|good|poor|missed_opportunity",
  "alternatives": ["alternative 1", "alternative 2", "alternative 3"],
  "reason": "brief explanation"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Use cheaper model for line-by-line
    messages: [
      { role: 'system', content: 'You are an expert sales coach. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
    temperature: 0.3,
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  
  return {
    rating: result.rating || 'good',
    alternatives: result.alternatives || [],
  }
}

/**
 * Create and start the line rating worker
 */
export function createLineRatingWorker() {
  const worker = new Worker<LineRatingJobData>(
    'line-rating',
    async (job) => {
      return await processLineRatingJob(job)
    },
    {
      connection: getRedisClient(),
      concurrency: 3, // Process 3 batches concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per second
      },
    }
  )

  worker.on('completed', (job) => {
    logger.info('Line rating job completed', {
      jobId: job.id,
      sessionId: job.data.sessionId,
      batchIndex: job.data.batchIndex,
    })
  })

  worker.on('failed', (job, err) => {
    logger.error('Line rating job failed', err, {
      jobId: job?.id,
      sessionId: job?.data.sessionId,
      batchIndex: job?.data.batchIndex,
    })
  })

  worker.on('error', (err) => {
    logger.error('Line rating worker error', err)
  })

  return worker
}

/**
 * Split transcript into batches for processing
 */
export function splitTranscriptIntoBatches(transcript: any[], batchSize: number = BATCH_SIZE): any[][] {
  const batches: any[][] = []
  const repLines = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )

  for (let i = 0; i < repLines.length; i += batchSize) {
    batches.push(repLines.slice(i, i + batchSize))
  }

  return batches
}

