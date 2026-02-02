/**
 * Script to update agent names in database with full names from ElevenLabs
 * This will replace objection names (e.g., "I'm Selling Soon") with full names (e.g., "Jennifer Walsh")
 * 
 * Run with: node scripts/update-agent-names-from-elevenlabs.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAllElevenLabsAgents() {
  try {
    let allAgents = [];
    let cursor = null;
    let hasMore = true;
    
    while (hasMore) {
      let url = 'https://api.elevenlabs.io/v1/convai/agents';
      if (cursor) {
        url += `?cursor=${encodeURIComponent(cursor)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const agents = data.agents || [];
      allAgents = allAgents.concat(agents);
      
      cursor = data.next_cursor;
      hasMore = data.has_more || false;
      
      console.log(`   Fetched ${agents.length} agents (total: ${allAgents.length})...`);
      
      if (!hasMore || !cursor) break;
    }
    
    return allAgents;
  } catch (error) {
    console.error('❌ Error fetching ElevenLabs agents:', error);
    return [];
  }
}

async function getAgentsFromDatabase() {
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, is_active')
    .not('eleven_agent_id', 'is', null)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('❌ Error fetching agents:', error);
    return [];
  }

  return agents || [];
}

async function updateAgentName(agentId, newName) {
  const { error } = await supabase
    .from('agents')
    .update({ name: newName })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function main() {
  console.log('🚀 Updating agent names from ElevenLabs...\n');

  // Fetch agents from both sources
  const elAgents = await fetchAllElevenLabsAgents();
  const dbAgents = await getAgentsFromDatabase();

  console.log(`📋 Found ${elAgents.length} agents in ElevenLabs`);
  console.log(`📋 Found ${dbAgents.length} agents in database\n`);

  // Create a map of agent_id -> name from ElevenLabs
  const elAgentMap = new Map();
  elAgents.forEach(agent => {
    elAgentMap.set(agent.agent_id, agent.name);
  });

  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };

  // Process each database agent
  for (const dbAgent of dbAgents) {
    const elFullName = elAgentMap.get(dbAgent.eleven_agent_id);
    
    if (!elFullName) {
      console.log(`⚠️  ${dbAgent.name} (${dbAgent.eleven_agent_id}) - Not found in ElevenLabs`);
      results.skipped.push({ ...dbAgent, reason: 'Not found in ElevenLabs' });
      continue;
    }

    // Extract just the name part (before the first " - ")
    // Format: "FirstName LastName - Objection (Industry)" -> "FirstName LastName"
    // Also handle cases like "Patrick Murphy I'll Just Do It Myself (Windows)" -> "Patrick Murphy"
    // Handle edge case: "Linda Morrison- I'm Happy..." -> "Linda Morrison"
    let elName = elFullName;
    if (elFullName.includes(' - ')) {
      elName = elFullName.split(' - ')[0].trim();
      // Remove trailing dash if present (e.g., "Linda Morrison-" -> "Linda Morrison")
      elName = elName.replace(/-+\s*$/, '').trim();
    } else if (elFullName.match(/^[A-Z][a-z]+ [A-Z][a-z]+-/)) {
      // Handle cases like "Linda Morrison- I'm Happy..." (name followed by dash and text)
      const match = elFullName.match(/^([A-Z][a-z]+ [A-Z][a-z]+)-/);
      if (match) {
        elName = match[1].trim();
      }
    } else if (elFullName.includes(' (') && !elFullName.startsWith('The ') && !elFullName.includes('Tag Team')) {
      // Handle cases like "Patrick Murphy I'll Just Do It Myself (Windows)"
      // Extract just the first two words (first and last name)
      const parts = elFullName.split(' (')[0].trim().split(' ');
      if (parts.length >= 2) {
        elName = `${parts[0]} ${parts[1]}`;
      }
    }

    // Check if name needs updating
    if (dbAgent.name === elName) {
      console.log(`✓ ${dbAgent.name} - Already correct`);
      results.skipped.push({ ...dbAgent, reason: 'Name already matches' });
      continue;
    }

    console.log(`\n🔄 Updating: ${dbAgent.name}`);
    console.log(`   → ${elName} (from: ${elFullName})`);
    console.log(`   Agent ID: ${dbAgent.eleven_agent_id}`);

    const updateResult = await updateAgentName(dbAgent.id, elName);
    
    if (updateResult.success) {
      console.log(`   ✅ Updated successfully`);
      results.updated.push({ 
        oldName: dbAgent.name, 
        newName: elName, 
        agentId: dbAgent.eleven_agent_id 
      });
    } else {
      console.log(`   ❌ Error: ${updateResult.error}`);
      results.errors.push({ 
        name: dbAgent.name, 
        error: updateResult.error 
      });
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Updated: ${results.updated.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.updated.length > 0) {
    console.log('\n✅ Successfully Updated:');
    results.updated.forEach(r => {
      console.log(`   - "${r.oldName}" → "${r.newName}"`);
      console.log(`     Agent ID: ${r.agentId}`);
    });
  }

  if (results.skipped.length > 0 && results.skipped.some(s => s.reason === 'Not found in ElevenLabs')) {
    console.log('\n⚠️  Agents not found in ElevenLabs:');
    results.skipped
      .filter(s => s.reason === 'Not found in ElevenLabs')
      .forEach(s => {
        console.log(`   - ${s.name} (${s.eleven_agent_id})`);
      });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(e => {
      console.log(`   - ${e.name}: ${e.error}`);
    });
  }
}

main().catch(console.error);
