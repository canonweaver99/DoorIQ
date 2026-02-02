// Check all roofing agent assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoofingAssignments() {
  console.log('🔍 Checking roofing agent assignments...\n');

  // Get roofing industry ID
  const { data: roofingIndustry } = await supabase
    .from('industries')
    .select('id, slug')
    .eq('slug', 'roofing')
    .single();

  if (!roofingIndustry) {
    console.error('❌ Roofing industry not found');
    return;
  }

  // Expected roofing agents (from the image)
  const expectedRoofingAgents = [
    'Lewis McArthur',
    'Diane Martinez',
    'Mark Patterson',
    'Kevin Anderson',
    'Lisa Martinez',
    'David Kim',
    'Carlos Mendez',
    'Harold Stevens',
    'Patricia Wells',
    'Tom Bradley'
  ];

  console.log('📋 Expected Roofing Agents:');
  expectedRoofingAgents.forEach(name => console.log(`   - ${name}`));
  console.log('');

  // Get all agents assigned to roofing
  const { data: roofingAgents } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', roofingIndustry.id);

  console.log(`\n🏠 Agents currently assigned to Roofing (${roofingAgents?.length || 0}):`);
  
  const roofingAgentIds = new Set();
  const issues = [];

  if (roofingAgents) {
    for (const ai of roofingAgents) {
      const agentName = ai.agents?.name;
      const agentId = ai.agents?.eleven_agent_id;
      roofingAgentIds.add(ai.agent_id);
      
      const isExpected = expectedRoofingAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName)
      );
      
      const status = isExpected ? '✅' : '⚠️';
      console.log(`   ${status} ${agentName} (${agentId})`);
      
      if (!isExpected && !agentName?.includes('Universal') && !agentName?.includes('Crackhead') && !agentName?.includes('Karen')) {
        issues.push({ name: agentName, id: agentId, issue: 'Unexpected in roofing' });
      }
    }
  }

  // Check each expected roofing agent
  console.log('\n\n🔍 Checking each expected roofing agent:');
  for (const expectedName of expectedRoofingAgents) {
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
      const hasRoofing = industries.includes('roofing');
      const otherIndustries = industries.filter(i => i !== 'roofing');

      if (!hasRoofing) {
        console.log(`   ❌ ${agent.name} (${agent.eleven_agent_id}) - NOT assigned to Roofing`);
        console.log(`      Currently in: ${industries.join(', ') || 'NONE'}`);
      } else if (otherIndustries.length > 0) {
        console.log(`   ⚠️  ${agent.name} (${agent.eleven_agent_id}) - In Roofing BUT ALSO in: ${otherIndustries.join(', ')}`);
      } else {
        console.log(`   ✅ ${agent.name} (${agent.eleven_agent_id}) - ONLY in Roofing`);
      }
    }
  }

  // Check for agents that should NOT be in roofing
  console.log('\n\n🚫 Checking for agents that should NOT be in roofing:');
  const { data: allRoofingAssignments } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', roofingIndustry.id);

  if (allRoofingAssignments) {
    for (const ai of allRoofingAssignments) {
      const agentName = ai.agents?.name;
      const isExpected = expectedRoofingAgents.some(expected => 
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
        console.log(`   ⚠️  ${agentName} - Should NOT be in Roofing`);
      }
    }
  }
}

checkRoofingAssignments().catch(console.error);
