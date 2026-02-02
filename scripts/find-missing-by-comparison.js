/**
 * Script to compare ElevenLabs agents with database and find any missing voice IDs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAllElevenLabsAgents() {
  try {
    const url = 'https://api.elevenlabs.io/v1/convai/agents';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.agents || [];
  } catch (error) {
    console.error('❌ Error fetching ElevenLabs agents:', error);
    return [];
  }
}

async function fetchVoiceId(agentId) {
  try {
    const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.conversation_config?.tts?.voice_id || null;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('🔍 Comparing ElevenLabs agents with database...\n');

  // Get all agents from database
  const { data: dbAgents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, eleven_voice_id, is_active')
    .not('eleven_agent_id', 'is', null)
    .order('name');

  if (error) {
    console.error('❌ Error fetching database agents:', error);
    return;
  }

  // Get all agents from ElevenLabs
  const elAgents = await fetchAllElevenLabsAgents();
  console.log(`📋 Found ${dbAgents.length} agents in database`);
  console.log(`📋 Found ${elAgents.length} agents in ElevenLabs\n`);

  // Find agents in database that are missing voice IDs
  const missingVoiceIds = dbAgents.filter(a => !a.eleven_voice_id);
  
  console.log(`🔍 Found ${missingVoiceIds.length} agents with missing voice IDs\n`);

  if (missingVoiceIds.length === 0) {
    console.log('✅ All agents have voice IDs!');
    return;
  }

  // Try to fetch voice IDs for each
  const results = {
    found: [],
    notFound: [],
    updated: [],
  };

  for (const agent of missingVoiceIds) {
    console.log(`\n🔍 Processing: ${agent.name}`);
    console.log(`   Agent ID: ${agent.eleven_agent_id}`);
    
    // Check if this agent exists in ElevenLabs
    const elAgent = elAgents.find(a => a.agent_id === agent.eleven_agent_id);
    
    if (!elAgent) {
      console.log(`   ⚠️  Agent not found in ElevenLabs`);
      results.notFound.push({ ...agent, reason: 'Not found in ElevenLabs' });
      continue;
    }

    // Fetch voice ID
    const voiceId = await fetchVoiceId(agent.eleven_agent_id);
    
    if (voiceId) {
      console.log(`   ✅ Found voice ID: ${voiceId}`);
      results.found.push({ ...agent, voiceId });
      
      // Update database
      const { error: updateError } = await supabase
        .from('agents')
        .update({ eleven_voice_id: voiceId })
        .eq('id', agent.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated database`);
        results.updated.push({ ...agent, voiceId });
      }
    } else {
      console.log(`   ⚠️  Voice ID not found`);
      results.notFound.push({ ...agent, reason: 'Voice ID not found in API response' });
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Found voice IDs: ${results.found.length}`);
  console.log(`✅ Updated in database: ${results.updated.length}`);
  console.log(`⚠️  Not found: ${results.notFound.length}`);

  if (results.updated.length > 0) {
    console.log('\n✅ Successfully Updated:');
    results.updated.forEach(r => {
      console.log(`   - ${r.name} (${r.eleven_agent_id})`);
      console.log(`     Voice ID: ${r.voiceId}`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  Not Found:');
    results.notFound.forEach(r => {
      console.log(`   - ${r.name} (${r.eleven_agent_id})`);
      console.log(`     Reason: ${r.reason}`);
    });
  }
}

main().catch(console.error);
