// Check "I'm Selling Soon" agents and their industry assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSellingSoonAgents() {
  console.log('🔍 Checking "I\'m Selling Soon" agents...\n');

  // Find all agents with "I'm Selling Soon" or similar names
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, is_active')
    .or('name.ilike.%Selling Soon%,name.ilike.%Selling/Moving%')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${agents.length} agents:\n`);

  for (const agent of agents) {
    console.log(`📋 ${agent.name}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   ElevenLabs ID: ${agent.eleven_agent_id}`);
    console.log(`   Active: ${agent.is_active}`);

    // Get industry assignments
    const { data: industries } = await supabase
      .from('agent_industries')
      .select('industries(slug, name)')
      .eq('agent_id', agent.id);

    if (industries && industries.length > 0) {
      console.log(`   Industries: ${industries.map(i => i.industries?.slug).filter(Boolean).join(', ')}`);
    } else {
      console.log(`   ⚠️  NO INDUSTRY ASSIGNMENTS!`);
    }
    console.log('');
  }

  // Check for agents with the shared agent ID
  const sharedAgentId = 'agent_2701kg2yvease7b89h6nx6p1eqjy';
  console.log(`\n🔗 Agents with shared ID (${sharedAgentId}):`);
  const { data: sharedAgents } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id')
    .eq('eleven_agent_id', sharedAgentId);

  if (sharedAgents) {
    sharedAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
    });
  }
}

checkSellingSoonAgents().catch(console.error);
