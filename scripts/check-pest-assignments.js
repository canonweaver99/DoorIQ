// Check all pest control agent assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPestAssignments() {
  console.log('🔍 Checking pest control agent assignments...\n');

  // Get pest industry ID
  const { data: pestIndustry } = await supabase
    .from('industries')
    .select('id, slug')
    .eq('slug', 'pest')
    .single();

  if (!pestIndustry) {
    console.error('❌ Pest industry not found');
    return;
  }

  // Expected pest agents (from the image)
  const expectedPestAgents = [
    'Dan Mitchell',
    'Vincent "Vinny" Caruso',
    'Jennifer Lee',
    'Tyler Jackson',
    'Greg Wilson',
    'Chris Bennett',
    'Nicole Rodriguez',
    'Rachel Cooper',
    'Mike Sullivan'
  ];

  console.log('📋 Expected Pest Control Agents:');
  expectedPestAgents.forEach(name => console.log(`   - ${name}`));
  console.log('');

  // Get all agents assigned to pest
  const { data: pestAgents } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', pestIndustry.id);

  console.log(`\n🐛 Agents currently assigned to Pest Control (${pestAgents?.length || 0}):`);
  
  const pestAgentIds = new Set();
  const issues = [];

  if (pestAgents) {
    for (const ai of pestAgents) {
      const agentName = ai.agents?.name;
      const agentId = ai.agents?.eleven_agent_id;
      pestAgentIds.add(ai.agent_id);
      
      const isExpected = expectedPestAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName)
      );
      
      const status = isExpected ? '✅' : '⚠️';
      console.log(`   ${status} ${agentName} (${agentId})`);
      
      if (!isExpected && !agentName?.includes('Universal') && !agentName?.includes('Crackhead') && !agentName?.includes('Karen')) {
        issues.push({ name: agentName, id: agentId, issue: 'Unexpected in pest' });
      }
    }
  }

  // Check each expected pest agent
  console.log('\n\n🔍 Checking each expected pest agent:');
  for (const expectedName of expectedPestAgents) {
    // Find agent by name
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, eleven_agent_id')
      .ilike('name', `%${expectedName}%`)
      .limit(5);

    if (!agents || agents.length === 0) {
      console.log(`   ❌ ${expectedName} - NOT FOUND in database`);
      continue;
    }

    for (const agent of agents) {
      // Check all industry assignments for this agent
      const { data: assignments } = await supabase
        .from('agent_industries')
        .select('industries(slug)')
        .eq('agent_id', agent.id);

      const industries = assignments?.map(a => a.industries?.slug).filter(Boolean) || [];
      const hasPest = industries.includes('pest');
      const otherIndustries = industries.filter(i => i !== 'pest');

      if (!hasPest) {
        console.log(`   ❌ ${agent.name} (${agent.eleven_agent_id}) - NOT assigned to Pest`);
        console.log(`      Currently in: ${industries.join(', ') || 'NONE'}`);
      } else if (otherIndustries.length > 0) {
        console.log(`   ⚠️  ${agent.name} (${agent.eleven_agent_id}) - In Pest BUT ALSO in: ${otherIndustries.join(', ')}`);
      } else {
        console.log(`   ✅ ${agent.name} (${agent.eleven_agent_id}) - ONLY in Pest`);
      }
    }
  }

  // Check for agents that should NOT be in pest
  console.log('\n\n🚫 Checking for agents that should NOT be in pest:');
  const { data: allPestAssignments } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', pestIndustry.id);

  if (allPestAssignments) {
    for (const ai of allPestAssignments) {
      const agentName = ai.agents?.name;
      const isExpected = expectedPestAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName)
      );
      
      // Universal agents are OK
      const isUniversal = agentName?.includes('Austin') || 
                         agentName?.includes('Tina') ||
                         agentName?.includes('Nick') ||
                         agentName?.includes('Sam') ||
                         agentName?.includes('Tim') ||
                         agentName?.includes('Jerry') ||
                         agentName?.includes('Beth') ||
                         agentName?.includes('Nancy') ||
                         agentName?.includes('Dave') ||
                         agentName?.includes('Steve') ||
                         agentName?.includes('Victor') ||
                         agentName?.includes('Susan') ||
                         agentName?.includes('Crackhead') ||
                         agentName?.includes('Karen') ||
                         agentName?.includes('FUNNY INDIAN');

      if (!isExpected && !isUniversal) {
        console.log(`   ⚠️  ${agentName} - Should NOT be in Pest`);
      }
    }
  }
}

checkPestAssignments().catch(console.error);
