/**
 * Script to find and fetch voice IDs for agents that are missing them
 * 
 * Run with: node scripts/fetch-missing-voice-ids.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAgentsWithMissingVoiceIds() {
  console.log('🔍 Finding agents with missing voice IDs...\n');
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, eleven_voice_id, is_active')
    .is('eleven_voice_id', null)
    .not('eleven_agent_id', 'is', null)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('❌ Error fetching agents:', error);
    return [];
  }

  console.log(`✅ Found ${agents.length} agents with missing voice IDs\n`);
  return agents || [];
}

async function fetchAgentVoiceId(agentId, agentName) {
  try {
    // Use the correct endpoint (plural "agents")
    const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API returned ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const data = await response.json();
    
    // Extract voice_id from conversation_config.tts
    const voiceId = 
      data?.conversation_config?.tts?.voice_id ||
      data?.conversation_config?.tts?.voice?.voice_id ||
      data?.voice_id ||
      data?.voice?.voice_id ||
      null;

    if (voiceId) {
      return { success: true, voiceId };
    } else {
      return { success: false, error: 'Voice ID not found in response' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateVoiceIdInDatabase(agentId, voiceId) {
  const { error } = await supabase
    .from('agents')
    .update({ eleven_voice_id: voiceId })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function main() {
  console.log('🚀 Fetching missing voice IDs from ElevenLabs API...\n');

  // Find agents with missing voice IDs
  const agentsWithMissingVoiceIds = await findAgentsWithMissingVoiceIds();

  if (agentsWithMissingVoiceIds.length === 0) {
    console.log('✅ All agents already have voice IDs!');
    return;
  }

  console.log('📋 Agents needing voice IDs:\n');
  agentsWithMissingVoiceIds.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.name} (${agent.eleven_agent_id})`);
  });
  console.log('');

  const results = {
    found: [],
    notFound: [],
    errors: [],
    updated: [],
  };

  // Process each agent
  for (const agent of agentsWithMissingVoiceIds) {
    console.log(`\n🔍 Processing: ${agent.name}`);
    console.log(`   Agent ID: ${agent.eleven_agent_id}`);
    
    const fetchResult = await fetchAgentVoiceId(agent.eleven_agent_id, agent.name);
    
    if (fetchResult.success) {
      console.log(`   ✅ Found voice ID: ${fetchResult.voiceId}`);
      results.found.push({ ...agent, voiceId: fetchResult.voiceId });
      
      // Update database
      const updateResult = await updateVoiceIdInDatabase(agent.id, fetchResult.voiceId);
      if (updateResult.success) {
        console.log(`   ✅ Updated database`);
        results.updated.push({ ...agent, voiceId: fetchResult.voiceId });
      } else {
        console.log(`   ❌ Failed to update database: ${updateResult.error}`);
        results.errors.push({ ...agent, error: updateResult.error });
      }
    } else {
      console.log(`   ⚠️  ${fetchResult.error}`);
      results.notFound.push({ ...agent, reason: fetchResult.error });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Found voice IDs: ${results.found.length}`);
  console.log(`✅ Updated in database: ${results.updated.length}`);
  console.log(`⚠️  Not found: ${results.notFound.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.updated.length > 0) {
    console.log('\n✅ Successfully Updated:');
    results.updated.forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     Agent ID: ${r.eleven_agent_id}`);
      console.log(`     Voice ID: ${r.voiceId}`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  Voice IDs Not Found:');
    results.notFound.forEach(r => {
      console.log(`   - ${r.name} (${r.eleven_agent_id})`);
      console.log(`     Reason: ${r.reason}`);
    });
    console.log('\n💡 These may need to be manually added from the ElevenLabs dashboard');
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  // Generate SQL for manual updates if needed
  if (results.found.length > 0) {
    console.log('\n\n📋 SQL for manual updates (if needed):');
    console.log('-- Voice ID updates');
    results.found.forEach(r => {
      console.log(`UPDATE agents SET eleven_voice_id = '${r.voiceId}' WHERE eleven_agent_id = '${r.eleven_agent_id}';`);
    });
  }
}

main().catch(console.error);
