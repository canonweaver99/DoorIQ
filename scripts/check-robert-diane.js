// Check Robert Williams and Diane Martinez agents
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgents() {
  console.log('🔍 Checking Robert Williams and Diane Martinez...\n');

  // Check for both names
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, is_active')
    .or('name.eq.Robert Williams,name.eq.Diane Martinez,name.eq.Jennifer Walsh')
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
      const slugs = industries.map(i => i.industries?.slug).filter(Boolean);
      console.log(`   Industries: ${slugs.join(', ')}`);
      console.log(`   Icons should show: ${slugs.map(s => {
        const icons = {solar: '☀️', roofing: '🏠', windows: '🚪', pest: '🐛', fiber: '📡'};
        return icons[s] || s;
      }).join(' ')}`);
    } else {
      console.log(`   ⚠️  NO INDUSTRY ASSIGNMENTS!`);
    }
    console.log('');
  }

  // Also check for agents with "I'm Selling Soon" status/persona
  console.log('\n🔍 Checking for agents with "Selling Soon" in persona...\n');
  const { data: sellingAgents } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, persona')
    .ilike('persona', '%Selling Soon%')
    .limit(10);

  if (sellingAgents && sellingAgents.length > 0) {
    sellingAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.eleven_agent_id})`);
    });
  }
}

checkAgents().catch(console.error);
