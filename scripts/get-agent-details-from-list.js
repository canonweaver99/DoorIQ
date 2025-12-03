/**
 * Script to get agent details from the agents list endpoint
 * Run with: node scripts/get-agent-details-from-list.js
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVEN_LABS_API_KEY not found');
  process.exit(1);
}

const OUR_AGENT_IDS = [
  'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
  'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
  'agent_9901k6dvcv32embbydd7nn0prdgq', // Switchover Steve
  'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick
  'agent_1701k6dvc3nfejmvydkk7r85tqef', // DIY Dave
  'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
  'agent_4601k6dvddj8fp89cey35hdj9ef8', // Spouse Check Susan
  'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
  'agent_5701k6dtt9p4f8jbk8rs1akqwtmx', // Renter Randy
  'agent_9201k6dts0haecvssk737vwfjy34', // Skeptical Sam
  'agent_8401k6dv9z2kepw86hhe5bvj4djz', // Just Treated Jerry
  'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
  'agent_3701k8s40awcf30tbs5mrksskzav', // Veteran Victor
  'agent_4301k8s3mmvvekqb6fdpyszs9md4', // Tag Team Tanya & Tom
];

async function getAgentDetails() {
  try {
    // Get list of all agents
    const url = 'https://api.elevenlabs.io/v1/convai/agents';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch agents:', response.status);
      return;
    }

    const data = await response.json();
    const agents = data.agents || [];

    console.log(`✅ Found ${agents.length} total agents\n`);
    console.log('Looking for our agents...\n');

    const ourAgents = agents.filter(agent => OUR_AGENT_IDS.includes(agent.agent_id));
    
    console.log(`Found ${ourAgents.length} of our agents in the list\n`);

    // Try to get full details for each agent
    for (const agent of ourAgents) {
      console.log(`\n🔍 ${agent.name} (${agent.agent_id})`);
      console.log('   Full agent data:', JSON.stringify(agent, null, 2));
      
      // Try to get more details
      try {
        const detailUrl = `https://api.elevenlabs.io/v1/convai/agent/${agent.agent_id}`;
        const detailResponse = await fetch(detailUrl, {
          method: 'GET',
          headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          console.log('   ✅ Agent details:', JSON.stringify(detailData, null, 2).substring(0, 1000));
        } else {
          console.log(`   ⚠️  Detail endpoint returned ${detailResponse.status}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error fetching details: ${error.message}`);
      }
    }

    // Check if any agents have voice info in the list response
    console.log('\n\n📋 Checking for voice IDs in agent list data...\n');
    ourAgents.forEach(agent => {
      const voiceId = agent.voice_id || agent.voice?.voice_id || null;
      if (voiceId) {
        console.log(`✅ ${agent.name}: ${voiceId}`);
      } else {
        console.log(`⚠️  ${agent.name}: No voice ID found`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getAgentDetails();


