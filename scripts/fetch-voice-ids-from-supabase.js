/**
 * Script to fetch agent voice IDs from Supabase
 * Run with: node scripts/fetch-voice-ids-from-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('💡 Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAgents() {
  try {
    console.log('🔍 Fetching agents from Supabase...\n');
    
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching agents:', error);
      return;
    }

    console.log(`✅ Found ${agents.length} active agents:\n`);
    console.log('Agent Name'.padEnd(30), 'Eleven Agent ID'.padEnd(35), 'Voice ID');
    console.log('-'.repeat(100));

    agents.forEach(agent => {
      const name = (agent.name || 'Unknown').padEnd(30);
      const agentId = (agent.eleven_agent_id || 'N/A').padEnd(35);
      const voiceId = agent.eleven_voice_id || agent.voice_id || 'NOT SET';
      console.log(name, agentId, voiceId);
    });

    // Check if voice_id column exists
    const sampleAgent = agents[0];
    if (sampleAgent && !sampleAgent.eleven_voice_id && !sampleAgent.voice_id) {
      console.log('\n⚠️  No voice_id column found in agents table.');
      console.log('💡 You may need to:');
      console.log('   1. Add an eleven_voice_id column to the agents table');
      console.log('   2. Or check if voice IDs are stored in a different table/column');
      console.log('   3. Or add voice IDs manually to PERSONA_METADATA');
    } else {
      console.log('\n✅ Voice IDs found! These can be used in the sample-audio route.');
    }

    return agents;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAgents();


