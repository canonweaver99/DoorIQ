/**
 * Script to check ALL agents with missing voice IDs, including those with valid agent IDs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Checking ALL agents with missing voice IDs...\n');
  
  // Get all agents with missing voice IDs
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, eleven_voice_id, is_active')
    .is('eleven_voice_id', null)
    .order('name');

  if (error) {
    console.error('❌ Error fetching agents:', error);
    return;
  }

  console.log(`✅ Found ${agents.length} agents with missing voice IDs\n`);

  if (agents.length === 0) {
    console.log('🎉 All agents have voice IDs!');
    return;
  }

  // Separate by whether they have valid agent IDs
  const withValidAgentIds = agents.filter(a => 
    a.eleven_agent_id && 
    !a.eleven_agent_id.startsWith('placeholder_') && 
    !a.eleven_agent_id.includes('placeholder')
  );
  
  const withPlaceholderIds = agents.filter(a => 
    !a.eleven_agent_id || 
    a.eleven_agent_id.startsWith('placeholder_') || 
    a.eleven_agent_id.includes('placeholder')
  );

  console.log('📋 Agents with VALID agent IDs but missing voice IDs:');
  console.log(`   Count: ${withValidAgentIds.length}\n`);
  withValidAgentIds.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.name}`);
    console.log(`   Agent ID: ${agent.eleven_agent_id}`);
    console.log(`   Active: ${agent.is_active}`);
    console.log('');
  });

  if (withPlaceholderIds.length > 0) {
    console.log('\n📋 Agents with PLACEHOLDER agent IDs:');
    console.log(`   Count: ${withPlaceholderIds.length}\n`);
    withPlaceholderIds.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   Agent ID: ${agent.eleven_agent_id || 'NULL'}`);
      console.log(`   Active: ${agent.is_active}`);
      console.log('');
    });
  }
}

main().catch(console.error);
