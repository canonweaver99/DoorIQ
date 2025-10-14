/**
 * Check Audio URLs Script
 * 
 * This script checks which sessions have audio URLs and which don't.
 * Run with: node scripts/check-audio-urls.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAudioUrls() {
  console.log('🔍 Checking audio URLs in live_sessions...\n')

  try {
    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('live_sessions')
      .select('id, agent_name, audio_url, duration_seconds, upload_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('❌ Error fetching sessions:', error)
      return
    }

    console.log(`Found ${sessions.length} recent sessions:\n`)

    const withAudio = sessions.filter(s => s.audio_url)
    const withoutAudio = sessions.filter(s => !s.audio_url)

    console.log('📊 Summary:')
    console.log(`  ✅ With audio: ${withAudio.length}`)
    console.log(`  ❌ Without audio: ${withoutAudio.length}`)
    console.log('')

    if (withAudio.length > 0) {
      console.log('✅ Sessions with audio:')
      withAudio.forEach(s => {
        console.log(`  - ${s.id.slice(0, 8)}... | ${s.agent_name || 'Unknown'} | ${s.upload_type || 'N/A'} | ${new Date(s.created_at).toLocaleString()}`)
        console.log(`    Audio: ${s.audio_url?.slice(0, 60)}...`)
      })
      console.log('')
    }

    if (withoutAudio.length > 0) {
      console.log('❌ Sessions without audio:')
      withoutAudio.forEach(s => {
        console.log(`  - ${s.id.slice(0, 8)}... | ${s.agent_name || 'Unknown'} | ${s.upload_type || 'N/A'} | ${new Date(s.created_at).toLocaleString()}`)
      })
      console.log('')
    }

    // Get overall stats
    const { count: totalCount } = await supabase
      .from('live_sessions')
      .select('*', { count: 'exact', head: true })

    const { count: audioCount } = await supabase
      .from('live_sessions')
      .select('*', { count: 'exact', head: true })
      .not('audio_url', 'is', null)

    console.log('📈 Overall Statistics:')
    console.log(`  Total sessions: ${totalCount}`)
    console.log(`  With audio: ${audioCount} (${Math.round(audioCount / totalCount * 100)}%)`)
    console.log(`  Without audio: ${totalCount - audioCount} (${Math.round((totalCount - audioCount) / totalCount * 100)}%)`)
    console.log('')

    console.log('💡 Note: Sessions without audio were likely created before')
    console.log('   the audio recording feature was implemented, or the')
    console.log('   recording failed during the session.')
    console.log('')
    console.log('🎯 To get audio for new sessions:')
    console.log('   1. Start a new training session at /trainer')
    console.log('   2. Or upload audio at /trainer/upload')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAudioUrls()

