import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface CachedPhrase {
  phrase: string
  alternatives: string[]
  rating: string
  context?: string
}

/**
 * Get cached phrase alternatives from Supabase
 * Uses a simple cache table in Supabase
 */
export async function getCachedPhrase(phrase: string, context?: string): Promise<CachedPhrase | null> {
  try {
    const supabase = await createServiceSupabaseClient()
    const cacheKey = hashPhrase(phrase, context)
    
    const { data, error } = await supabase
      .from('phrase_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Check if cache is expired (24 hours)
    const cachedAt = new Date(data.created_at)
    const now = new Date()
    const hoursSinceCache = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceCache > 24) {
      // Cache expired, delete it
      await supabase.from('phrase_cache').delete().eq('cache_key', cacheKey)
      return null
    }
    
    logger.info('Cache hit', { phrase: phrase.substring(0, 50) })
    return {
      phrase: data.phrase,
      alternatives: data.alternatives,
      rating: data.rating,
      context: data.context,
    }
  } catch (error) {
    logger.error('Failed to get cached phrase', error)
    return null
  }
}

/**
 * Cache phrase alternatives in Supabase
 */
export async function cachePhrase(phrase: string, alternatives: string[], rating: string, context?: string): Promise<void> {
  try {
    const supabase = await createServiceSupabaseClient()
    const cacheKey = hashPhrase(phrase, context)
    
    // Upsert cache entry
    await supabase
      .from('phrase_cache')
      .upsert({
        cache_key: cacheKey,
        phrase,
        alternatives,
        rating,
        context: context || null,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'cache_key',
      })
    
    logger.info('Phrase cached', { phrase: phrase.substring(0, 50) })
  } catch (error) {
    logger.error('Failed to cache phrase', error)
    // Don't throw - caching failures shouldn't break the flow
  }
}

/**
 * Invalidate cache for a phrase
 */
export async function invalidatePhraseCache(phrase: string, context?: string): Promise<void> {
  try {
    const supabase = await createServiceSupabaseClient()
    const cacheKey = hashPhrase(phrase, context)
    
    await supabase
      .from('phrase_cache')
      .delete()
      .eq('cache_key', cacheKey)
    
    logger.info('Phrase cache invalidated', { phrase: phrase.substring(0, 50) })
  } catch (error) {
    logger.error('Failed to invalidate phrase cache', error)
  }
}

/**
 * Invalidate all phrase caches (use when knowledge base updates)
 */
export async function invalidateAllPhraseCaches(): Promise<void> {
  try {
    const supabase = await createServiceSupabaseClient()
    
    const { count } = await supabase
      .from('phrase_cache')
      .delete()
      .neq('cache_key', '') // Delete all
    
    logger.info('All phrase caches invalidated', { count })
  } catch (error) {
    logger.error('Failed to invalidate all phrase caches', error)
  }
}

/**
 * Hash phrase for cache key
 */
function hashPhrase(phrase: string, context?: string): string {
  const normalized = phrase.toLowerCase().trim().replace(/\s+/g, ' ')
  const contextPart = context ? `:${context.toLowerCase().trim()}` : ''
  // Simple hash - in production, consider using crypto.createHash
  return Buffer.from(normalized + contextPart).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
