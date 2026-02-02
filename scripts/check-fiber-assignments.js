// Check all fiber internet agent assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFiberAssignments() {
  console.log('🔍 Checking fiber internet agent assignments...\n');

  // Get fiber industry ID
  const { data: fiberIndustry } = await supabase
    .from('industries')
    .select('id, slug')
    .eq('slug', 'fiber')
    .single();

  if (!fiberIndustry) {
    console.error('❌ Fiber industry not found');
    return;
  }

  // Expected fiber agents (from the image)
  const expectedFiberAgents = [
    '"Rob" Davis',
    'Rob Davis',
    'Sarah Kim',
    'Daniel Mitchell',
    'James Wilson',
    'Marcus Johnson',
    'Tom Henderson',
    'Amanda Stevens',
    'Linda Morrison',
    'Jessica Martinez',
    'Kevin Richardson'
  ];

  console.log('📋 Expected Fiber Internet Agents:');
  expectedFiberAgents.forEach(name => console.log(`   - ${name}`));
  console.log('');

  // Get all agents assigned to fiber
  const { data: fiberAgents } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', fiberIndustry.id);

  console.log(`\n📡 Agents currently assigned to Fiber Internet (${fiberAgents?.length || 0}):`);
  
  const fiberAgentIds = new Set();
  const issues = [];

  if (fiberAgents) {
    for (const ai of fiberAgents) {
      const agentName = ai.agents?.name;
      const agentId = ai.agents?.eleven_agent_id;
      fiberAgentIds.add(ai.agent_id);
      
      const isExpected = expectedFiberAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName) ||
        (expected === '"Rob" Davis' && agentName?.includes('Rob') && agentName?.includes('Davis')) ||
        (expected === 'Rob Davis' && agentName?.includes('Rob') && agentName?.includes('Davis'))
      );
      
      const status = isExpected ? '✅' : '⚠️';
      console.log(`   ${status} ${agentName} (${agentId})`);
      
      if (!isExpected && !agentName?.includes('Universal') && !agentName?.includes('Crackhead') && !agentName?.includes('Karen')) {
        issues.push({ name: agentName, id: agentId, issue: 'Unexpected in fiber' });
      }
    }
  }

  // Check each expected fiber agent
  console.log('\n\n🔍 Checking each expected fiber agent:');
  const expectedNames = [
    'Rob Davis',
    'Sarah Kim',
    'Daniel Mitchell',
    'James Wilson',
    'Marcus Johnson',
    'Tom Henderson',
    'Amanda Stevens',
    'Linda Morrison',
    'Jessica Martinez',
    'Kevin Richardson'
  ];

  for (const expectedName of expectedNames) {
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
      const hasFiber = industries.includes('fiber');
      const otherIndustries = industries.filter(i => i !== 'fiber');

      if (!hasFiber) {
        console.log(`   ❌ ${agent.name} (${agent.eleven_agent_id}) - NOT assigned to Fiber`);
        console.log(`      Currently in: ${industries.join(', ') || 'NONE'}`);
      } else if (otherIndustries.length > 0) {
        console.log(`   ⚠️  ${agent.name} (${agent.eleven_agent_id}) - In Fiber BUT ALSO in: ${otherIndustries.join(', ')}`);
      } else {
        console.log(`   ✅ ${agent.name} (${agent.eleven_agent_id}) - ONLY in Fiber`);
      }
    }
  }

  // Check for agents that should NOT be in fiber
  console.log('\n\n🚫 Checking for agents that should NOT be in fiber:');
  const { data: allFiberAssignments } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', fiberIndustry.id);

  if (allFiberAssignments) {
    for (const ai of allFiberAssignments) {
      const agentName = ai.agents?.name;
      const isExpected = expectedFiberAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName) ||
        (expected === '"Rob" Davis' && agentName?.includes('Rob') && agentName?.includes('Davis')) ||
        (expected === 'Rob Davis' && agentName?.includes('Rob') && agentName?.includes('Davis'))
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
        console.log(`   ⚠️  ${agentName} - Should NOT be in Fiber`);
      }
    }
  }
}

checkFiberAssignments().catch(console.error);
