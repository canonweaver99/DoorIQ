/**
 * Specialization Manager Service
 * Handles caching, retrieval, and regeneration of coach specializations
 */

import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { generateCoachSpecialization } from './specialization-generator'

const CACHE_TTL_HOURS = 24 // Specialization is considered fresh for 24 hours

/**
 * Check if specialization is fresh (less than TTL hours old)
 */
function isSpecializationFresh(updatedAt: string | null): boolean {
  if (!updatedAt) return false

  const updated = new Date(updatedAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60)

  return hoursDiff < CACHE_TTL_HOURS
}

/**
 * Get cached specialization or generate new one if missing/stale
 */
export async function getOrGenerateSpecialization(teamId: string): Promise<string> {
  try {
    const supabase = await createServiceSupabaseClient()

    // Fetch current specialization from database
    const { data: config } = await supabase
      .from('team_grading_configs')
      .select('coach_specialization, coach_specialization_updated_at')
      .eq('team_id', teamId)
      .single()

    // Check if we have a fresh cached version
    if (config?.coach_specialization && isSpecializationFresh(config.coach_specialization_updated_at)) {
      return config.coach_specialization
    }

    // Generate new specialization
    console.log(`Generating new coach specialization for team ${teamId}`)
    const specialization = await generateCoachSpecialization(teamId)

    // Save to database
    await supabase
      .from('team_grading_configs')
      .update({
        coach_specialization: specialization,
        coach_specialization_updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId)

    return specialization
  } catch (error: any) {
    console.error('Error getting/generating specialization:', error)
    // Return empty string on error - base prompt will still work
    return ''
  }
}

/**
 * Invalidate and regenerate specialization for a team
 * Call this when knowledge base content changes
 */
export async function invalidateAndRegenerateSpecialization(teamId: string): Promise<void> {
  try {
    console.log(`Invalidating and regenerating coach specialization for team ${teamId}`)
    
    // Generate new specialization
    const specialization = await generateCoachSpecialization(teamId)

    // Update database
    const supabase = await createServiceSupabaseClient()
    await supabase
      .from('team_grading_configs')
      .update({
        coach_specialization: specialization,
        coach_specialization_updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId)

    console.log(`Successfully regenerated specialization for team ${teamId}`)
  } catch (error: any) {
    console.error('Error invalidating/regenerating specialization:', error)
    // Don't throw - this is a background operation
  }
}
