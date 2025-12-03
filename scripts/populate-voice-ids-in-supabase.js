/**
 * Script to populate voice IDs in Supabase agents table
 * 
 * Usage:
 *   1. Get voice IDs from ElevenLabs dashboard for each agent
 *   2. Update the VOICE_ID_MAP below with the correct mappings
 *   3. Run: node scripts/populate-voice-ids-in-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Voice IDs from ElevenLabs dashboard
const VOICE_ID_MAP = {
  'agent_7001k5jqfjmtejvs77jvhjf254tz': 'Bj9UqZbhQsanLzgalpEG', // Average Austin
  'agent_0101k6dvb96zejkv35ncf1zkj88m': 'P7x743VjyZEOihNNygQ9', // No Problem Nancy
  'agent_9901k6dvcv32embbydd7nn0prdgq': 'WLKp2jV6nrS8aMkPPDRO', // Switchover Steve
  'agent_7601k6dtrf5fe0k9dh8kwmkde0ga': 'ChO6kqkVouUn0s7HMunx', // Not Interested Nick
  'agent_1701k6dvc3nfejmvydkk7r85tqef': 'YLbQE9U7P1K6rBNJWNSv', // DIY Dave
  'agent_3901k6dtsjyqfvxbxd1pwzzdham0': 'NOpBlnGInO9m6vDvFkFC', // Too Expensive Tim
  'agent_4601k6dvddj8fp89cey35hdj9ef8': 'EIsgvJT3rwoPvRFG6c4n', // Spouse Check Susan
  'agent_4801k6dvap8tfnjtgd4f99hhsf10': '56AoDkrOh6qfVPDXZ7Pt', // Busy Beth
  'agent_5701k6dtt9p4f8jbk8rs1akqwtmx': '74s0ZNaUEOKhDHSxgJZq', // Renter Randy
  'agent_9201k6dts0haecvssk737vwfjy34': '56bWURjYFHyYyVf490Dp', // Skeptical Sam
  'agent_8401k6dv9z2kepw86hhe5bvj4djz': 'OhisAd2u8Q6qSA4xXAAT', // Just Treated Jerry
  'agent_2501k6btmv4cf2wt8hxxmq4hvzxv': 'Ps8lsQuJKZHMxxDU1tff', // Think About It Tina
  'agent_3701k8s40awcf30tbs5mrksskzav': '1SM7GgM6IMuvQlz2BwM3', // Veteran Victor
  'agent_4301k8s3mmvvekqb6fdpyszs9md4': 'DLsHlh26Ugcm6ELvS0qi', // Tag Team Tanya & Tom
};

async function populateVoiceIds() {
  console.log('🔍 Checking agents table structure...\n');
  
  // First, check if column exists
  const { data: sampleAgent } = await supabase
    .from('agents')
    .select('*')
    .limit(1)
    .single();
  
  if (!sampleAgent) {
    console.error('❌ No agents found in database');
    return;
  }
  
  if (!('eleven_voice_id' in sampleAgent)) {
    console.error('❌ eleven_voice_id column does not exist in agents table');
    console.log('💡 Please run the migration first:');
    console.log('   lib/supabase/migrations/113_add_voice_id_to_agents.sql');
    return;
  }
  
  console.log('✅ Column exists. Updating voice IDs...\n');
  
  // Fetch all agents
  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, eleven_voice_id')
    .eq('is_active', true);
  
  if (fetchError) {
    console.error('❌ Error fetching agents:', fetchError);
    return;
  }
  
  console.log(`Found ${agents.length} active agents\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const agent of agents) {
    const voiceId = VOICE_ID_MAP[agent.eleven_agent_id];
    
    if (!voiceId) {
      console.log(`⏭️  Skipping ${agent.name} - no voice ID in map`);
      skipped++;
      continue;
    }
    
    if (agent.eleven_voice_id === voiceId) {
      console.log(`✓ ${agent.name} already has correct voice ID`);
      continue;
    }
    
    const { error: updateError } = await supabase
      .from('agents')
      .update({ eleven_voice_id: voiceId })
      .eq('id', agent.id);
    
    if (updateError) {
      console.error(`❌ Failed to update ${agent.name}:`, updateError.message);
    } else {
      console.log(`✅ Updated ${agent.name} with voice ID: ${voiceId}`);
      updated++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${agents.length}`);
  
  if (updated === 0 && skipped === agents.length) {
    console.log('\n💡 To populate voice IDs:');
    console.log('   1. Check your ElevenLabs dashboard for each agent');
    console.log('   2. Find the voice ID configured for each agent');
    console.log('   3. Update VOICE_ID_MAP in this script');
    console.log('   4. Run this script again');
  }
}

populateVoiceIds().catch(console.error);

