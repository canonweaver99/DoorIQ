/**
 * Script to fetch voice IDs from ElevenLabs API using different methods
 * Run with: node scripts/fetch-agent-voice-ids-from-api.js
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVEN_LABS_API_KEY not found in environment variables');
  process.exit(1);
}

const AGENTS = [
  { name: 'Average Austin', id: 'agent_7001k5jqfjmtejvs77jvhjf254tz' },
  { name: 'No Problem Nancy', id: 'agent_0101k6dvb96zejkv35ncf1zkj88m' },
  { name: 'Switchover Steve', id: 'agent_9901k6dvcv32embbydd7nn0prdgq' },
  { name: 'Not Interested Nick', id: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga' },
  { name: 'DIY Dave', id: 'agent_1701k6dvc3nfejmvydkk7r85tqef' },
  { name: 'Too Expensive Tim', id: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0' },
  { name: 'Spouse Check Susan', id: 'agent_4601k6dvddj8fp89cey35hdj9ef8' },
  { name: 'Busy Beth', id: 'agent_4801k6dvap8tfnjtgd4f99hhsf10' },
  { name: 'Renter Randy', id: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx' },
  { name: 'Skeptical Sam', id: 'agent_9201k6dts0haecvssk737vwfjy34' },
  { name: 'Just Treated Jerry', id: 'agent_8401k6dv9z2kepw86hhe5bvj4djz' },
  { name: 'Think About It Tina', id: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv' },
  { name: 'Veteran Victor', id: 'agent_3701k8s40awcf30tbs5mrksskzav' },
  { name: 'Tag Team Tanya & Tom', id: 'agent_4301k8s3mmvvekqb6fdpyszs9md4' },
];

async function tryGetConversationToken(agentId) {
  try {
    const url = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function tryGetSignedUrl(agentId) {
  try {
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function tryListAgents() {
  try {
    // Try different possible endpoints
    const endpoints = [
      'https://api.elevenlabs.io/v1/convai/agents',
      'https://api.elevenlabs.io/v1/convai/agent/list',
      'https://api.elevenlabs.io/v1/convai/agents/list',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Found endpoint: ${endpoint}`);
          return data;
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchAgentVoiceId(agentName, agentId) {
  console.log(`\n🔍 Checking ${agentName} (${agentId})...`);
  
  // Method 1: Try to get agent details directly
  try {
    const url = `https://api.elevenlabs.io/v1/convai/agent/${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Agent details response:`, JSON.stringify(data, null, 2).substring(0, 500));
      
      // Try to extract voice_id from various possible locations
      const voiceId = data?.voice_id || 
                     data?.voice?.voice_id || 
                     data?.voice_config?.voice_id ||
                     data?.conversation_config?.voice_id ||
                     data?.agent_config?.voice_id ||
                     null;
      
      if (voiceId) {
        return voiceId;
      }
    } else {
      const errorText = await response.text();
      console.log(`   ⚠️  Agent endpoint returned ${response.status}: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error fetching agent: ${error.message}`);
  }

  // Method 2: Try conversation token endpoint
  const tokenData = await tryGetConversationToken(agentId);
  if (tokenData) {
    console.log(`   📦 Token response:`, JSON.stringify(tokenData, null, 2).substring(0, 300));
    const voiceId = tokenData?.voice_id || tokenData?.agent?.voice_id || null;
    if (voiceId) return voiceId;
  }

  // Method 3: Try signed URL endpoint
  const signedUrlData = await tryGetSignedUrl(agentId);
  if (signedUrlData) {
    console.log(`   📦 Signed URL response:`, JSON.stringify(signedUrlData, null, 2).substring(0, 300));
    const voiceId = signedUrlData?.voice_id || signedUrlData?.agent?.voice_id || null;
    if (voiceId) return voiceId;
  }

  return null;
}

async function main() {
  console.log('🔍 Attempting to fetch voice IDs from ElevenLabs API...\n');
  
  // First, try to list all agents
  console.log('📋 Trying to list all agents...');
  const agentsList = await tryListAgents();
  if (agentsList) {
    console.log('✅ Got agents list:', JSON.stringify(agentsList, null, 2).substring(0, 500));
  } else {
    console.log('⚠️  Could not list agents from API');
  }

  const results = [];
  
  for (const agent of AGENTS) {
    const voiceId = await fetchAgentVoiceId(agent.name, agent.id);
    results.push({ ...agent, voiceId });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n\n📋 Results:\n');
  console.log('Agent Name'.padEnd(30), 'Agent ID'.padEnd(40), 'Voice ID');
  console.log('-'.repeat(100));

  results.forEach(({ name, id, voiceId }) => {
    const voiceDisplay = voiceId || 'NOT FOUND';
    console.log(name.padEnd(30), id.padEnd(40), voiceDisplay);
  });

  const found = results.filter(r => r.voiceId).length;
  console.log(`\n✅ Found ${found} out of ${results.length} voice IDs`);

  if (found > 0) {
    console.log('\n💡 To add these to Supabase, update scripts/populate-voice-ids-in-supabase.js with:');
    results.forEach(({ id, voiceId }) => {
      if (voiceId) {
        console.log(`  '${id}': '${voiceId}',`);
      }
    });
  } else {
    console.log('\n💡 Voice IDs not found via API. You may need to:');
    console.log('   1. Check your ElevenLabs dashboard for each agent');
    console.log('   2. Look at the agent configuration to find the voice ID');
    console.log('   3. Or check webhook/conversation data if available');
  }
}

main().catch(console.error);


