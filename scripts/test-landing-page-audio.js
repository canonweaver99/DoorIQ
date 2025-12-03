/**
 * Test script to simulate the landing page audio component behavior
 * Tests multiple agents by cycling through indices like the component does
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!supabaseUrl || !supabaseKey || !API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the component's agent cycling logic
const ALLOWED_AGENT_ORDER = [
  'Average Austin',
  'No Problem Nancy',
  'Switchover Steve',
  'Not Interested Nick',
  'DIY Dave',
  'Too Expensive Tim',
  'Spouse Check Susan',
  'Busy Beth',
  'Renter Randy',
  'Skeptical Sam',
  'Just Treated Jerry',
  'Think About It Tina',
  'Veteran Victor',
  // 'Tag Team Tanya & Tom', // Excluded like in the code
];

const PERSONA_METADATA = {
  'Average Austin': { card: { elevenAgentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz' } },
  'No Problem Nancy': { card: { elevenAgentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m' } },
  'Switchover Steve': { card: { elevenAgentId: 'agent_9901k6dvcv32embbydd7nn0prdgq' } },
  'Not Interested Nick': { card: { elevenAgentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga' } },
  'DIY Dave': { card: { elevenAgentId: 'agent_1701k6dvc3nfejmvydkk7r85tqef' } },
  'Too Expensive Tim': { card: { elevenAgentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0' } },
  'Spouse Check Susan': { card: { elevenAgentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8' } },
  'Busy Beth': { card: { elevenAgentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10' } },
  'Renter Randy': { card: { elevenAgentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx' } },
  'Skeptical Sam': { card: { elevenAgentId: 'agent_9201k6dts0haecvssk737vwfjy34' } },
  'Just Treated Jerry': { card: { elevenAgentId: 'agent_8401k6dv9z2kepw86hhe5bvj4djz' } },
  'Think About It Tina': { card: { elevenAgentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv' } },
  'Veteran Victor': { card: { elevenAgentId: 'agent_3701k8s40awcf30tbs5mrksskzav' } },
};

async function testAgentAtIndex(index) {
  const activeAgents = ALLOWED_AGENT_ORDER.filter(name => name !== 'Tag Team Tanya & Tom');
  const agentName = activeAgents[index % activeAgents.length];
  const agentMetadata = PERSONA_METADATA[agentName];
  
  if (!agentMetadata || !agentMetadata.card.elevenAgentId) {
    return { success: false, error: 'Agent not found', agentName };
  }
  
  const agentId = agentMetadata.card.elevenAgentId;
  
  // Fetch voice ID from Supabase (simulating the API route)
  const { data: agentData, error } = await supabase
    .from('agents')
    .select('eleven_voice_id')
    .eq('eleven_agent_id', agentId)
    .single();
  
  if (error || !agentData?.eleven_voice_id) {
    return { 
      success: false, 
      error: error?.message || 'Voice ID not found', 
      agentName,
      agentId 
    };
  }
  
  const voiceId = agentData.eleven_voice_id;
  
  // Test TTS generation
  try {
    const sampleText = `Hi, I'm ${agentName}. This is a test snippet.`;
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sampleText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `TTS API error: ${response.status}`, 
        agentName,
        voiceId,
        details: errorText.substring(0, 200)
      };
    }
    
    const audioBuffer = await response.arrayBuffer();
    return { 
      success: true, 
      agentName, 
      voiceId, 
      audioSize: audioBuffer.byteLength 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      agentName,
      voiceId 
    };
  }
}

async function testComponentBehavior() {
  console.log('🧪 Testing landing page audio component behavior...\n');
  console.log('Simulating component cycling through agents (like clicking the button multiple times)\n');
  
  const testIndices = [0, 1, 2, 3, 4, 5]; // Test first 6 agents
  const results = [];
  
  for (const index of testIndices) {
    console.log(`Testing index ${index}...`);
    const result = await testAgentAtIndex(index);
    results.push({ index, ...result });
    
    if (result.success) {
      console.log(`  ✅ ${result.agentName} - Voice ID: ${result.voiceId} - Audio: ${result.audioSize} bytes`);
    } else {
      console.log(`  ❌ ${result.agentName} - Error: ${result.error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testIndices.length}`);
  console.log(`   ❌ Failed: ${failed}/${testIndices.length}`);
  
  if (passed === testIndices.length) {
    console.log(`\n🎉 All tests passed! The component should work correctly.`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Start dev server: npm run dev`);
    console.log(`   2. Visit: http://localhost:3000/landing`);
    console.log(`   3. Click the audio snippet button multiple times`);
    console.log(`   4. Each click should play a different agent's voice`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the errors above.`);
  }
  
  return results;
}

testComponentBehavior().catch(console.error);

