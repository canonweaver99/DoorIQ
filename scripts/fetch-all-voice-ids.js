/**
 * Script to fetch voice IDs for all agents from ElevenLabs API
 * This fetches individual agent details to get voice IDs
 * 
 * Run with: node scripts/fetch-all-voice-ids.js
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

// List of all agent IDs from your list
const AGENT_IDS = [
  // Universal
  { id: 'agent_2601kg2zz82zf2mst4mrdj9mjr76', name: 'Travis "T-Bone" Hendricks (The Crackhead)' },
  { id: 'agent_3401kfhajkp1efdrv88hp8rnzdh2', name: 'The Karen' },
  
  // Solar
  { id: 'agent_2701kg2yvease7b89h6nx6p1eqjy', name: 'Jennifer Walsh / Diane Martinez (I\'m Selling Soon)' },
  { id: 'agent_7401kg2vf3twe1xr9d66asfc43sv', name: 'Terrell Washington (I Don\'t Qualify)' },
  { id: 'agent_0901kfgyntt4ekz9xfj3q5srk3sh', name: 'Linda Morrison (I\'ve Heard Bad Things About Solar)' },
  { id: 'agent_0201kfgymyrpe6yvb7f0ay8efd72', name: 'Robert Jenkins (My Roof is Too Old)' },
  { id: 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp', name: 'David Martinez (What If It Doesn\'t Work?)' },
  { id: 'agent_0501kfgyh9vrea4v9sb923t6vtfv', name: 'Sarah Chen (My Electric Bill is Too Low)' },
  { id: 'agent_5001kfgygawzf3z9prjqkqv1wj85', name: 'James Porter (How Much Does It Cost?)' },
  { id: 'agent_1501kfgycw6wff3vd46tnzjr8xkb', name: 'Brian Walsh (Solar is Too Expensive)' },
  { id: 'agent_2101kfgybvm0fz1shb4msy1q5qxz', name: 'Gary Thompson (I\'m Not Interested in Solar)' },
  { id: 'agent_9101kfgy6d0jft18a06r0zj19jp1', name: 'Michelle Torres (I Need to Talk to My Spouse)' },
  
  // Windows
  { id: 'agent_2601kg2wcsw2f16sw06e5mxaeras', name: 'Steve Harry (Not the Right Time)' },
  { id: 'agent_7801kg2wc55se38vwwrj6dafec7d', name: 'Jonathan Wright (I\'m Waiting Until...)' },
  { id: 'agent_7701kg2wbfn0e7mvw4p69wr13rb4', name: 'Laura Thompson (What\'s Wrong With My Windows?)' },
  { id: 'agent_6601kg2wav3hebnvq04zeymzkbhb', name: 'Patrick Murphy (I\'ll Just Do It Myself)' },
  { id: 'agent_1401kg2w9r2tf13bwqebxrn9m3g0', name: 'Sherry Green (I\'m Selling/Moving Soon)' },
  { id: 'agent_9901kg2w904weyjv9xjs9sxjzszt', name: 'Maria Gonzalez (I Just Need One or Two Windows)' },
  { id: 'agent_9801kg2w89tqfy3tht3zwjp5w3qc', name: 'Jeffrey Clark (I\'m Going to Get Multiple Quotes)' },
  { id: 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct', name: 'Kellie Adams (That\'s Too Expensive)' },
  { id: 'agent_5901kg2w2pbke0p81575yq1c6spj', name: 'Robert Lee (My Windows Are Fine)' },
  { id: 'agent_3301kg2vydhnf28s2q2b6thzhfa4', name: 'Angela White (I Need to Talk to My Spouse)' },
  
  // Roofing
  { id: 'agent_7201kfgy3kgeexwvkw15c30n3q3n', name: 'Harold Stevens (I Don\'t Trust Door-to-Door)' },
  { id: 'agent_9701kfgy2ptff7x8je2fcca13jp1', name: 'Diane Martinez (I\'m Selling Soon - Roofing)' },
  { id: 'agent_3801kfgy1qw9eyxa31hxdy66syrm', name: 'Lisa Martinez (My Insurance Won\'t Cover It)' },
  { id: 'agent_9201kfgy0r49fc09xn6t28bcr7n5', name: 'Kevin Anderson (I Already Have Someone)' },
  { id: 'agent_3001kfgxy6vfe3wbsjeqpczh4gje', name: 'Tom Bradley (I\'ll Call You When I Need a Roof)' },
  { id: 'agent_6801kfgxt1bxfzvrc1xatssc5f1m', name: 'Carlos Mendez (I Just Had My Roof Done)' },
  { id: 'agent_3201kfgxs63qf3yrz6spva0xmn76', name: 'David Kim (How Much Does a Roof Cost?)' },
  
  // Pest Control
  { id: 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b', name: 'Vincent "Vinny" Caruso (What\'s the Price?)' },
];

async function fetchAgentVoiceId(agentId, agentName) {
  try {
    console.log(`\n🔍 Fetching ${agentName}...`);
    
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
      console.log(`   ⚠️  API returned ${response.status}: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    
    // Extract voice_id from conversation_config.tts
    const voiceId = 
      data?.conversation_config?.tts?.voice_id ||
      data?.conversation_config?.tts?.voice?.voice_id ||
      data?.voice_id ||
      data?.voice?.voice_id ||
      data?.voice_config?.voice_id ||
      data?.agent_config?.voice_id ||
      data?.config?.voice_id ||
      data?.settings?.voice_id ||
      null;

    if (voiceId) {
      console.log(`   ✅ Found voice ID: ${voiceId}`);
      return voiceId;
    } else {
      console.log(`   ⚠️  Voice ID not found in response`);
      console.log(`   📋 Response keys: ${Object.keys(data).join(', ')}`);
      
      // Check conversation_config structure
      if (data.conversation_config) {
        console.log(`   📋 conversation_config keys: ${Object.keys(data.conversation_config).join(', ')}`);
        if (data.conversation_config.tts) {
          console.log(`   📋 TTS keys: ${Object.keys(data.conversation_config.tts).join(', ')}`);
          console.log(`   📋 TTS object: ${JSON.stringify(data.conversation_config.tts).substring(0, 300)}`);
        }
      }
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function updateVoiceIdInDatabase(agentId, voiceId) {
  const { error } = await supabase
    .from('agents')
    .update({ eleven_voice_id: voiceId })
    .eq('eleven_agent_id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function main() {
  console.log('🚀 Fetching voice IDs for all agents from ElevenLabs API...\n');
  console.log(`📋 Processing ${AGENT_IDS.length} agents\n`);

  const results = {
    found: [],
    notFound: [],
    errors: [],
    updated: [],
  };

  for (const agent of AGENT_IDS) {
    const voiceId = await fetchAgentVoiceId(agent.id, agent.name);
    
    if (voiceId) {
      results.found.push({ ...agent, voiceId });
      
      // Update database
      const updateResult = await updateVoiceIdInDatabase(agent.id, voiceId);
      if (updateResult.success) {
        console.log(`   ✅ Updated database`);
        results.updated.push({ ...agent, voiceId });
      } else {
        console.log(`   ❌ Failed to update database: ${updateResult.error}`);
        results.errors.push({ ...agent, error: updateResult.error });
      }
    } else {
      results.notFound.push(agent);
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
      console.log(`     Agent ID: ${r.id}`);
      console.log(`     Voice ID: ${r.voiceId}`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  Voice IDs Not Found:');
    results.notFound.forEach(r => {
      console.log(`   - ${r.name} (${r.id})`);
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
      console.log(`UPDATE agents SET eleven_voice_id = '${r.voiceId}' WHERE eleven_agent_id = '${r.id}';`);
    });
  }
}

main().catch(console.error);
