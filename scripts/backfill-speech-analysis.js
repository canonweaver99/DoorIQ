/**
 * Backfill script to populate speech_analysis table from existing live_sessions data
 * 
 * This script reads voice_analysis data from live_sessions.analytics and creates
 * corresponding records in the speech_analysis table.
 * 
 * Usage: node scripts/backfill-speech-analysis.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillSpeechAnalysis() {
  console.log('🔄 Starting speech_analysis backfill...\n')
  
  try {
    // Get all sessions with voice_analysis data
    const { data: sessions, error: fetchError } = await supabase
      .from('live_sessions')
      .select('id, analytics, duration_seconds, ended_at')
      .not('analytics->voice_analysis', 'is', null)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching sessions:', fetchError)
      return
    }
    
    if (!sessions || sessions.length === 0) {
      console.log('ℹ️  No sessions with voice_analysis data found')
      return
    }
    
    console.log(`📊 Found ${sessions.length} sessions with voice_analysis data\n`)
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    for (const session of sessions) {
      const voiceAnalysis = session.analytics?.voice_analysis
      
      if (!voiceAnalysis) {
        skippedCount++
        continue
      }
      
      // Check if speech_analysis record already exists
      const { data: existing } = await supabase
        .from('speech_analysis')
        .select('id')
        .eq('session_id', session.id)
        .single()
      
      if (existing) {
        console.log(`⏭️  Skipping ${session.id.slice(0, 8)}... (already exists)`)
        skippedCount++
        continue
      }
      
      const speechAnalysisData = {
        session_id: session.id,
        is_final: !!session.ended_at,
        avg_wpm: Math.round(voiceAnalysis.avgWPM || 0),
        total_filler_words: voiceAnalysis.totalFillerWords || 0,
        filler_words_per_minute: session.duration_seconds && session.duration_seconds > 0
          ? (voiceAnalysis.totalFillerWords || 0) / (session.duration_seconds / 60)
          : 0,
        avg_pitch: voiceAnalysis.avgPitch || null,
        min_pitch: voiceAnalysis.minPitch || null,
        max_pitch: voiceAnalysis.maxPitch || null,
        pitch_variation: voiceAnalysis.pitchVariation || null,
        avg_volume: voiceAnalysis.avgVolume || null,
        volume_consistency: voiceAnalysis.volumeConsistency || null,
        has_pitch_data: !!(voiceAnalysis.avgPitch && voiceAnalysis.avgPitch > 0),
        has_volume_data: !!(voiceAnalysis.avgVolume && voiceAnalysis.avgVolume > 0),
        pitch_timeline: voiceAnalysis.pitchTimeline || [],
        volume_timeline: voiceAnalysis.volumeTimeline || [],
        wpm_timeline: voiceAnalysis.wpmTimeline || [],
        issues: {
          excessiveFillers: (voiceAnalysis.totalFillerWords || 0) > 10,
          tooFast: (voiceAnalysis.avgWPM || 0) > 200,
          tooSlow: (voiceAnalysis.avgWPM || 0) < 120 && (voiceAnalysis.avgWPM || 0) > 0,
          monotone: voiceAnalysis.isMonotone || false,
          lowEnergy: voiceAnalysis.lowEnergy || false,
          poorEndings: voiceAnalysis.poorEndings || false
        },
        analysis_timestamp: session.ended_at || session.created_at || new Date().toISOString()
      }
      
      const { error: insertError } = await supabase
        .from('speech_analysis')
        .insert(speechAnalysisData)
      
      if (insertError) {
        console.error(`❌ Error inserting ${session.id.slice(0, 8)}...:`, insertError.message)
        errorCount++
      } else {
        console.log(`✅ Inserted ${session.id.slice(0, 8)}... (WPM: ${speechAnalysisData.avg_wpm}, Fillers: ${speechAnalysisData.total_filler_words})`)
        successCount++
      }
    }
    
    console.log('\n📈 Backfill Summary:')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   📊 Total: ${sessions.length}`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the backfill
backfillSpeechAnalysis()
  .then(() => {
    console.log('\n✅ Backfill complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  })


