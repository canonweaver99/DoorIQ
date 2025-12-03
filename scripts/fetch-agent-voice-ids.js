/**
 * Script to fetch voice IDs for all agents from ElevenLabs API
 * Run with: node scripts/fetch-agent-voice-ids.js
 * 
 * This will output the voice IDs that should be added to PERSONA_METADATA
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVEN_LABS_API_KEY not found in environment variables');
  console.log('💡 Make sure you have a .env.local file with ELEVEN_LABS_API_KEY set');
  process.exit(1);
}

const PERSONA_METADATA = {
  'Average Austin': { elevenAgentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz' },
  'No Problem Nancy': { elevenAgentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m' },
  'Switchover Steve': { elevenAgentId: 'agent_9901k6dvcv32embbydd7nn0prdgq' },
  'Not Interested Nick': { elevenAgentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga' },
  'DIY Dave': { elevenAgentId: 'agent_1701k6dvc3nfejmvydkk7r85tqef' },
  'Too Expensive Tim': { elevenAgentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0' },
  'Spouse Check Susan': { elevenAgentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8' },
  'Busy Beth': { elevenAgentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10' },
  'Renter Randy': { elevenAgentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx' },
  'Skeptical Sam': { elevenAgentId: 'agent_9201k6dts0haecvssk737vwfjy34' },
  'Just Treated Jerry': { elevenAgentId: 'agent_8401k6dv9z2kepw86hhe5bvj4djz' },
  'Think About It Tina': { elevenAgentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv' },
  'Veteran Victor': { elevenAgentId: 'agent_3701k8s40awcf30tbs5mrksskzav' },
};

async function fetchAgentVoiceId(agentName, agentId) {
  try {
    const url = `https://api.elevenlabs.io/v1/convai/agent/${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch ${agentName}:`, response.status, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    
    // Try multiple possible paths for voice_id
    const voiceId = data?.voice_id || 
                    data?.voice?.voice_id || 
                    data?.voice_config?.voice_id ||
                    data?.conversation_config?.voice_id ||
                    null;

    if (voiceId) {
      console.log(`✅ ${agentName}: ${voiceId}`);
      return { agentName, voiceId, fullResponse: data };
    } else {
      console.warn(`⚠️  ${agentName}: Voice ID not found in response`);
      console.log('   Response keys:', Object.keys(data));
      console.log('   Response sample:', JSON.stringify(data).substring(0, 300));
      return { agentName, voiceId: null, fullResponse: data };
    }
  } catch (error) {
    console.error(`❌ Error fetching ${agentName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Fetching voice IDs for all agents...\n');
  
  const results = [];
  
  for (const [agentName, metadata] of Object.entries(PERSONA_METADATA)) {
    const result = await fetchAgentVoiceId(agentName, metadata.elevenAgentId);
    if (result) {
      results.push(result);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📋 Summary:\n');
  console.log('Add these to PERSONA_METADATA in components/trainer/personas.ts:\n');
  
  results.forEach(({ agentName, voiceId }) => {
    if (voiceId) {
      console.log(`  '${agentName}': {`);
      console.log(`    // ... other fields ...`);
      console.log(`    elevenVoiceId: '${voiceId}',`);
      console.log(`  },`);
    } else {
      console.log(`  // ⚠️  ${agentName}: Voice ID not found - check ElevenLabs dashboard`);
    }
  });

  console.log('\n💡 If voice IDs are not found in the API response, you may need to:');
  console.log('   1. Check the ElevenLabs dashboard for each agent');
  console.log('   2. Look for the voice configuration in the agent settings');
  console.log('   3. Manually add the voice IDs to PERSONA_METADATA');
}

main().catch(console.error);


