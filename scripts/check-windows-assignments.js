// Check all windows agent assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWindowsAssignments() {
  console.log('🔍 Checking windows agent assignments...\n');

  // Get windows industry ID
  const { data: windowsIndustry } = await supabase
    .from('industries')
    .select('id, slug')
    .eq('slug', 'windows')
    .single();

  if (!windowsIndustry) {
    console.error('❌ Windows industry not found');
    return;
  }

  // Expected windows agents (from the image)
  const expectedWindowsAgents = [
    'Robert Lee',
    'Laura Thompson',
    'Maria Gonzalez',
    'Kellie Adams',
    'Jonathan Wright',
    'Sherry Green',
    'Patrick Murphy',
    'Jeffrey Clark',
    'Angela White',
    'Steve Harry'
  ];

  console.log('📋 Expected Windows Agents:');
  expectedWindowsAgents.forEach(name => console.log(`   - ${name}`));
  console.log('');

  // Get all agents assigned to windows
  const { data: windowsAgents } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', windowsIndustry.id);

  console.log(`\n🚪 Agents currently assigned to Windows (${windowsAgents?.length || 0}):`);
  
  const windowsAgentIds = new Set();
  const issues = [];

  if (windowsAgents) {
    for (const ai of windowsAgents) {
      const agentName = ai.agents?.name;
      const agentId = ai.agents?.eleven_agent_id;
      windowsAgentIds.add(ai.agent_id);
      
      const isExpected = expectedWindowsAgents.some(expected => 
        agentName?.includes(expected) || expected.includes(agentName)
      );
      
      const status = isExpected ? '✅' : '⚠️';
      console.log(`   ${status} ${agentName} (${agentId})`);
      
      if (!isExpected && !agentName?.includes('Universal') && !agentName?.includes('Crackhead') && !agentName?.includes('Karen')) {
        issues.push({ name: agentName, id: agentId, issue: 'Unexpected in windows' });
      }
    }
  }

  // Check each expected windows agent
  console.log('\n\n🔍 Checking each expected windows agent:');
  for (const expectedName of expectedWindowsAgents) {
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
      const hasWindows = industries.includes('windows');
      const otherIndustries = industries.filter(i => i !== 'windows');

      if (!hasWindows) {
        console.log(`   ❌ ${agent.name} (${agent.eleven_agent_id}) - NOT assigned to Windows`);
        console.log(`      Currently in: ${industries.join(', ') || 'NONE'}`);
      } else if (otherIndustries.length > 0) {
        console.log(`   ⚠️  ${agent.name} (${agent.eleven_agent_id}) - In Windows BUT ALSO in: ${otherIndustries.join(', ')}`);
      } else {
        console.log(`   ✅ ${agent.name} (${agent.eleven_agent_id}) - ONLY in Windows`);
      }
    }
  }

  // Check for agents that should NOT be in windows
  console.log('\n\n🚫 Checking for agents that should NOT be in windows:');
  const { data: allWindowsAssignments } = await supabase
    .from('agent_industries')
    .select('agent_id, agents(name, eleven_agent_id), industries(slug)')
    .eq('industry_id', windowsIndustry.id);

  if (allWindowsAssignments) {
    for (const ai of allWindowsAssignments) {
      const agentName = ai.agents?.name;
      const isExpected = expectedWindowsAgents.some(expected => 
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
        console.log(`   ⚠️  ${agentName} - Should NOT be in Windows`);
      }
    }
  }
}

checkWindowsAssignments().catch(console.error);
