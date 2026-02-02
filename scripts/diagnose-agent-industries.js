// Diagnostic script to check agent-industry assignments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAgentIndustries() {
  console.log('🔍 Diagnosing agent-industry assignments...\n');

  // Get all industries
  const { data: industries, error: industriesError } = await supabase
    .from('industries')
    .select('*')
    .order('slug');

  if (industriesError) {
    console.error('Error fetching industries:', industriesError);
    return;
  }

  console.log('📋 Industries:', industries.map(i => `${i.slug} (${i.name})`).join(', '));
  console.log('');

  // Get all active agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (agentsError) {
    console.error('Error fetching agents:', agentsError);
    return;
  }

  console.log(`📊 Total active agents: ${agents.length}\n`);

  // Get all agent-industry mappings
  const { data: agentIndustries, error: aiError } = await supabase
    .from('agent_industries')
    .select('agent_id, industry_id, industries(slug), agents(name, eleven_agent_id)');

  if (aiError) {
    console.error('Error fetching agent-industry mappings:', aiError);
    return;
  }

  console.log(`🔗 Total agent-industry mappings: ${agentIndustries.length}\n`);

  // Group by industry
  const byIndustry = {};
  industries.forEach(industry => {
    byIndustry[industry.slug] = {
      industry,
      agents: []
    };
  });

  agentIndustries.forEach(ai => {
    const industrySlug = ai.industries?.slug;
    if (industrySlug && byIndustry[industrySlug]) {
      byIndustry[industrySlug].agents.push({
        agent_id: ai.agent_id,
        name: ai.agents?.name,
        eleven_agent_id: ai.agents?.eleven_agent_id
      });
    }
  });

  // Print results by industry
  industries.forEach(industry => {
    const data = byIndustry[industry.slug];
    console.log(`\n🏷️  ${industry.name} (${industry.slug}):`);
    console.log(`   Agents assigned: ${data.agents.length}`);
    
    if (data.agents.length === 0) {
      console.log('   ⚠️  NO AGENTS ASSIGNED!');
    } else {
      data.agents.forEach(agent => {
        const hasId = agent.eleven_agent_id && !agent.eleven_agent_id.startsWith('placeholder_');
        const status = hasId ? '✅' : '⚠️';
        console.log(`   ${status} ${agent.name} (${agent.eleven_agent_id || 'NO ID'})`);
      });
    }
  });

  // Check for agents without industry assignments
  console.log('\n\n🔍 Agents WITHOUT industry assignments:');
  const agentsWithIndustries = new Set(agentIndustries.map(ai => ai.agent_id));
  const orphanedAgents = agents.filter(a => !agentsWithIndustries.has(a.id));
  
  if (orphanedAgents.length === 0) {
    console.log('   ✅ All agents have industry assignments');
  } else {
    console.log(`   ⚠️  Found ${orphanedAgents.length} agents without assignments:`);
    orphanedAgents.forEach(agent => {
      console.log(`      - ${agent.name} (${agent.eleven_agent_id || 'NO ID'})`);
    });
  }

  // Check for agents with placeholder IDs that should have real IDs
  console.log('\n\n⚠️  Agents with placeholder IDs:');
  const placeholderAgents = agents.filter(a => 
    a.eleven_agent_id && a.eleven_agent_id.startsWith('placeholder_')
  );
  
  if (placeholderAgents.length === 0) {
    console.log('   ✅ No placeholder IDs found');
  } else {
    placeholderAgents.forEach(agent => {
      const industries = agentIndustries
        .filter(ai => ai.agent_id === agent.id)
        .map(ai => ai.industries?.slug)
        .filter(Boolean);
      console.log(`      - ${agent.name} (${agent.eleven_agent_id}) [Industries: ${industries.join(', ') || 'NONE'}]`);
    });
  }
}

diagnoseAgentIndustries().catch(console.error);
