/**
 * Test script to verify the sample-audio endpoint works with voice IDs from Supabase
 * Run with: node scripts/test-sample-audio-endpoint.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!API_KEY) {
  console.error('❌ Missing ELEVEN_LABS_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test a few agents to verify voice IDs work
const TEST_AGENTS = [
  { name: 'Average Austin', agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', expectedVoiceId: 'Bj9UqZbhQsanLzgalpEG' },
  { name: 'No Problem Nancy', agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', expectedVoiceId: 'P7x743VjyZEOihNNygQ9' },
  { name: 'Switchover Steve', agentId: 'agent_9901k6dvcv32embbydd7nn0prdgq', expectedVoiceId: 'WLKp2jV6nrS8aMkPPDRO' },
];

async function testVoiceIdFromSupabase(agentName, agentId, expectedVoiceId) {
  console.log(`\n🔍 Testing ${agentName}...`);
  
  // Fetch voice ID from Supabase (simulating what the API does)
  const { data: agentData, error } = await supabase
    .from('agents')
    .select('eleven_voice_id')
    .eq('eleven_agent_id', agentId)
    .single();
  
  if (error) {
    console.log(`   ❌ Error fetching from Supabase: ${error.message}`);
    return false;
  }
  
  if (!agentData?.eleven_voice_id) {
    console.log(`   ⚠️  No voice ID found in Supabase`);
    return false;
  }
  
  const voiceId = agentData.eleven_voice_id;
  
  if (voiceId !== expectedVoiceId) {
    console.log(`   ⚠️  Voice ID mismatch:`);
    console.log(`      Expected: ${expectedVoiceId}`);
    console.log(`      Got: ${voiceId}`);
    return false;
  }
  
  console.log(`   ✅ Voice ID found: ${voiceId}`);
  
  // Test TTS API call with this voice ID
  try {
    const testText = `Hi, I'm ${agentName}. This is a test.`;
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ TTS API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return false;
    }
    
    const audioBuffer = await response.arrayBuffer();
    console.log(`   ✅ TTS API success! Generated ${audioBuffer.byteLength} bytes of audio`);
    return true;
  } catch (error) {
    console.log(`   ❌ TTS API error: ${error.message}`);
    return false;
  }
}

async function testAllAgents() {
  console.log('🧪 Testing sample-audio endpoint voice IDs...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const agent of TEST_AGENTS) {
    const success = await testVoiceIdFromSupabase(
      agent.name,
      agent.agentId,
      agent.expectedVoiceId
    );
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${TEST_AGENTS.length}`);
  
  if (passed === TEST_AGENTS.length) {
    console.log(`\n🎉 All tests passed! Voice IDs are working correctly.`);
    console.log(`\n💡 To test the full endpoint:`);
    console.log(`   1. Start your dev server: npm run dev`);
    console.log(`   2. Visit: http://localhost:3000/landing`);
    console.log(`   3. Click the audio snippet button to test`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the errors above.`);
  }
}

testAllAgents().catch(console.error);

