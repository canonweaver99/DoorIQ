/**
 * Script to extract voice IDs from stored ElevenLabs conversation data in Supabase
 * Run with: node scripts/extract-voice-ids-from-conversations.js
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

const AGENT_MAP = {
  'agent_7001k5jqfjmtejvs77jvhjf254tz': 'Average Austin',
  'agent_0101k6dvb96zejkv35ncf1zkj88m': 'No Problem Nancy',
  'agent_9901k6dvcv32embbydd7nn0prdgq': 'Switchover Steve',
  'agent_7601k6dtrf5fe0k9dh8kwmkde0ga': 'Not Interested Nick',
  'agent_1701k6dvc3nfejmvydkk7r85tqef': 'DIY Dave',
  'agent_3901k6dtsjyqfvxbxd1pwzzdham0': 'Too Expensive Tim',
  'agent_4601k6dvddj8fp89cey35hdj9ef8': 'Spouse Check Susan',
  'agent_4801k6dvap8tfnjtgd4f99hhsf10': 'Busy Beth',
  'agent_5701k6dtt9p4f8jbk8rs1akqwtmx': 'Renter Randy',
  'agent_9201k6dts0haecvssk737vwfjy34': 'Skeptical Sam',
  'agent_8401k6dv9z2kepw86hhe5bvj4djz': 'Just Treated Jerry',
  'agent_2501k6btmv4cf2wt8hxxmq4hvzxv': 'Think About It Tina',
  'agent_3701k8s40awcf30tbs5mrksskzav': 'Veteran Victor',
  'agent_4301k8s3mmvvekqb6fdpyszs9md4': 'Tag Team Tanya & Tom',
};

async function extractVoiceIds() {
  console.log('🔍 Searching stored conversations for voice IDs...\n');
  
  // Get all conversations grouped by agent_id
  const { data: conversations, error } = await supabase
    .from('elevenlabs_conversations')
    .select('agent_id, metadata, raw_payload')
    .not('metadata', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching conversations:', error);
    return;
  }

  if (!conversations || conversations.length === 0) {
    console.log('⚠️  No conversations found in database');
    console.log('💡 Voice IDs might need to be manually added from ElevenLabs dashboard');
    return;
  }

  console.log(`✅ Found ${conversations.length} conversations\n`);

  const voiceIdMap = {};

  // Extract voice IDs from metadata and raw_payload
  for (const conv of conversations) {
    const agentName = AGENT_MAP[conv.agent_id] || conv.agent_id;
    
    // Try to find voice_id in various locations
    let voiceId = 
      conv.metadata?.voice_id ||
      conv.metadata?.voice?.voice_id ||
      conv.metadata?.agent?.voice_id ||
      conv.raw_payload?.voice_id ||
      conv.raw_payload?.voice?.voice_id ||
      conv.raw_payload?.agent?.voice_id ||
      conv.raw_payload?.metadata?.voice_id ||
      null;

    if (voiceId && !voiceIdMap[conv.agent_id]) {
      voiceIdMap[conv.agent_id] = voiceId;
      console.log(`✅ Found voice ID for ${agentName}: ${voiceId}`);
    }
  }

  console.log('\n📋 Summary:\n');
  console.log('Agent Name'.padEnd(30), 'Agent ID'.padEnd(40), 'Voice ID');
  console.log('-'.repeat(100));

  const found = [];
  const missing = [];

  for (const [agentId, agentName] of Object.entries(AGENT_MAP)) {
    const voiceId = voiceIdMap[agentId] || 'NOT FOUND';
    console.log(agentName.padEnd(30), agentId.padEnd(40), voiceId);
    
    if (voiceIdMap[agentId]) {
      found.push({ agentId, agentName, voiceId: voiceIdMap[agentId] });
    } else {
      missing.push({ agentId, agentName });
    }
  }

  console.log(`\n✅ Found ${found.length} voice IDs`);
  console.log(`⚠️  Missing ${missing.length} voice IDs`);

  if (found.length > 0) {
    console.log('\n💡 To add these to Supabase, update scripts/populate-voice-ids-in-supabase.js:\n');
    found.forEach(({ agentId, voiceId }) => {
      console.log(`  '${agentId}': '${voiceId}',`);
    });
  }

  if (missing.length > 0) {
    console.log('\n⚠️  Missing voice IDs for:');
    missing.forEach(({ agentName }) => {
      console.log(`   - ${agentName}`);
    });
    console.log('\n💡 For missing agents, check your ElevenLabs dashboard:');
    console.log('   1. Go to each agent in the ElevenLabs dashboard');
    console.log('   2. Check the voice configuration');
    console.log('   3. Find the voice ID (usually visible in the agent settings)');
  }
}

extractVoiceIds().catch(console.error);


