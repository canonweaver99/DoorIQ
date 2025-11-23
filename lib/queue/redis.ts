import Redis from 'ioredis'
import { logger } from '@/lib/logger'

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL
  const redisPassword = process.env.REDIS_PASSWORD

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  try {
    // Parse Redis URL (supports both redis:// and rediss://)
    const url = new URL(redisUrl)
    const host = url.hostname
    const port = parseInt(url.port || '6379')
    const password = redisPassword || url.password || undefined

    redisClient = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        logger.info('Redis retry', { times, delay })
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
    })

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', err)
    })

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    redisClient.on('ready', () => {
      logger.info('Redis ready to accept commands')
    })

    return redisClient
  } catch (error) {
    logger.error('Failed to create Redis client', error)
    throw error
  }
}

export function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    return redisClient.quit().then(() => {
      redisClient = null
      logger.info('Redis connection closed')
    })
  }
  return Promise.resolve()
}

