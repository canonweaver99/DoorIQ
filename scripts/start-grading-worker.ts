#!/usr/bin/env tsx
/**
 * Start the grading worker to process line-by-line rating jobs
 * 
 * Usage: tsx scripts/start-grading-worker.ts
 * 
 * Environment variables required:
 * - REDIS_URL: Redis connection string (e.g., redis://localhost:6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - OPENAI_API_KEY: OpenAI API key for rating lines
 */

import { createLineRatingWorker } from '../lib/queue/grading-worker'
import { logger } from '../lib/logger'

logger.info('Starting grading worker...')

const worker = createLineRatingWorker()

logger.info('Grading worker started and listening for jobs')

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker...')
  await worker.close()
  process.exit(0)
})

