// Check all solar agent assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSolarAssignments() {
  console.log('🔍 Checking solar agent assignments...\n');

  // Get solar industry ID
  const { data: solarIndustry } = await supabase
    .from('industries')
    .select('id, slug')
    .eq('slug', 'solar')
    .single();

  if (!solarIndustry) {
    console.error('❌ Solar industry not found');
    return;
  }

  // Expected solar agents (from the image)
  const expectedSolarAgents = [
    'Brian Walsh',
    'Gary Thompson',
    'Linda Morrison',
    'Jennifer Walsh',
    'Terrell Washington',
    'Robert Jenkins',
    'David Martinez',
    'James Porter',
    'Sarah Chen',
    'Michelle Torres'
  ];

  console.log('📋 Expected Solar Agents:');
  expectedSolarAgents.forEach(name => console.log(`   - ${name}`));
  console.log('');

  // Get all agents assigned to solar
  const { data: solarAgents } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', solarIndustry.id);

  console.log(`\n☀️  Agents currently assigned to Solar (${solarAgents?.length || 0}):`);
  
  const solarAgentIds = new Set();
  const issues = [];

  if (solarAgents) {
    for (const ai of solarAgents) {
      const agentName = ai.agents?.name;
      const agentId = ai.agents?.eleven_agent_id;
      solarAgentIds.add(ai.agent_id);
      
      const isExpected = expectedSolarAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName)
      );
      
      const status = isExpected ? '✅' : '⚠️';
      console.log(`   ${status} ${agentName} (${agentId})`);
      
      if (!isExpected && !agentName?.includes('Universal') && !agentName?.includes('Crackhead') && !agentName?.includes('Karen')) {
        issues.push({ name: agentName, id: agentId, issue: 'Unexpected in solar' });
      }
    }
  }

  // Check each expected solar agent
  console.log('\n\n🔍 Checking each expected solar agent:');
  for (const expectedName of expectedSolarAgents) {
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
      const hasSolar = industries.includes('solar');
      const otherIndustries = industries.filter(i => i !== 'solar');

      if (!hasSolar) {
        console.log(`   ❌ ${agent.name} (${agent.eleven_agent_id}) - NOT assigned to Solar`);
        console.log(`      Currently in: ${industries.join(', ') || 'NONE'}`);
      } else if (otherIndustries.length > 0) {
        console.log(`   ⚠️  ${agent.name} (${agent.eleven_agent_id}) - In Solar BUT ALSO in: ${otherIndustries.join(', ')}`);
      } else {
        console.log(`   ✅ ${agent.name} (${agent.eleven_agent_id}) - ONLY in Solar`);
      }
    }
  }

  // Check for agents that should NOT be in solar
  console.log('\n\n🚫 Checking for agents that should NOT be in solar:');
  const { data: allSolarAssignments } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', solarIndustry.id);

  if (allSolarAssignments) {
    for (const ai of allSolarAssignments) {
      const agentName = ai.agents?.name;
      const isExpected = expectedSolarAgents.some(expected => 
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
        console.log(`   ⚠️  ${agentName} - Should NOT be in Solar`);
      }
    }
  }
}

checkSolarAssignments().catch(console.error);
