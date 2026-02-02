/**
 * Script to explore ElevenLabs API endpoints to find voice IDs
 */

require('dotenv').config({ path: '.env.local' });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found');
  process.exit(1);
}

async function tryEndpoint(method, url, description) {
  try {
    console.log(`\n🔍 ${description}`);
    console.log(`   ${method} ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Response keys: ${Object.keys(data).join(', ')}`);
      
      // Check if it's an array
      if (Array.isArray(data)) {
        console.log(`   📋 Array length: ${data.length}`);
        if (data.length > 0) {
          console.log(`   📋 First item keys: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   📋 Sample: ${JSON.stringify(data[0]).substring(0, 500)}`);
        }
      } else if (data.agents && Array.isArray(data.agents)) {
        console.log(`   📋 Agents array length: ${data.agents.length}`);
        if (data.agents.length > 0) {
          const firstAgent = data.agents[0];
          console.log(`   📋 First agent keys: ${Object.keys(firstAgent).join(', ')}`);
          console.log(`   📋 Sample agent: ${JSON.stringify(firstAgent).substring(0, 500)}`);
          
          // Check for voice_id in the agent object
          if (firstAgent.voice_id) {
            console.log(`   ✅ Found voice_id in agent object!`);
          }
        }
      } else {
        console.log(`   📋 Response sample: ${JSON.stringify(data).substring(0, 500)}`);
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  return null;
}

async function main() {
  console.log('🔍 Exploring ElevenLabs API endpoints...\n');

  // Try list agents endpoint
  const agentsList = await tryEndpoint(
    'GET',
    'https://api.elevenlabs.io/v1/convai/agents',
    'List all agents'
  );

  // If we got agents, try to get details for one
  if (agentsList && agentsList.agents && agentsList.agents.length > 0) {
    const firstAgentId = agentsList.agents[0].agent_id;
    console.log(`\n📋 Trying to get details for agent: ${firstAgentId}`);
    
    // Try different endpoint variations
    await tryEndpoint(
      'GET',
      `https://api.elevenlabs.io/v1/convai/agent/${firstAgentId}`,
      'Get agent details (v1/convai/agent/{id})'
    );
    
    await tryEndpoint(
      'GET',
      `https://api.elevenlabs.io/v1/convai/agents/${firstAgentId}`,
      'Get agent details (v1/convai/agents/{id})'
    );
    
    await tryEndpoint(
      'GET',
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${firstAgentId}`,
      'Get conversation token'
    );
    
    await tryEndpoint(
      'GET',
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${firstAgentId}`,
      'Get signed URL'
    );
  }

  // Try voices endpoint
  await tryEndpoint(
    'GET',
    'https://api.elevenlabs.io/v1/voices',
    'List all voices'
  );
}

main().catch(console.error);
