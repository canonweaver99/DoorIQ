/**
 * Script to sync all agents from ElevenLabs API to Supabase database
 * This will:
 * 1. Fetch all agents from ElevenLabs
 * 2. Match them with agents in the database by name
 * 3. Update agent IDs and voice IDs where needed
 * 4. Create missing agents
 * 
 * Run with: node scripts/sync-all-agents-from-elevenlabs.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Map of agent names from images to database names
const AGENT_NAME_MAP = {
  // Universal
  'The Crackhead (Universal)': 'Travis "T-Bone" Hendricks',
  'The Karen - No Soliciting Sign (All Industries)': 'The Karen',
  
  // Solar
  'Jennifer Walsh - I\'m Selling Soon (Solar)': 'I\'m Selling Soon',
  'Terrell Washington - I Don\'t Qualify (Solar)': 'I Don\'t Qualify',
  'Linda Morrison - I\'ve Heard Bad Things About Solar (Solar)': 'I\'ve Heard Bad Things About Solar',
  'Robert Jenkins - My Roof is Too Old (Solar)': 'My Roof is Too Old',
  'David Martinez - What If It Doesn\'t Work? (Solar)': 'What If It Doesn\'t Work?',
  'Sarah Chen - My Electric Bill is Too Low (Solar)': 'My Electric Bill is Too Low',
  'James Porter - How Much Does It Cost? (Solar)': 'How Much Does It Cost?',
  'Brian Walsh - Solar is Too Expensive (Solar)': 'Solar is Too Expensive',
  'Gary Thompson - I\'m Not Interested in Solar (Solar)': 'I\'m Not Interested in Solar',
  'Michelle Torres - I Need to Talk to My Spouse (Solar)': 'I Need to Talk to My Spouse',
  
  // Windows
  'Steve Harry - Not the Right Time - Maybe Next Year (Windows)': 'Not the Right Time / Maybe Next Year',
  'Jonathan Wright - I\'m Waiting Until... (Windows)': 'I\'m Waiting Until...',
  'Laura Thompson - What\'s Wrong With My Windows? (Windows)': 'What\'s Wrong With My Current Windows?',
  'Patrick Murphy I\'ll Just Do It Myself (Windows)': 'I\'ll Just Do It Myself',
  'Sherry Green - I\'m Selling/Moving Soon (Windows)': 'I\'m Selling/Moving Soon',
  'Maria Gonzalez - I Just Need One or Two Windows (Windows)': 'I Just Need One or Two Windows',
  'Jeffrey Clark - I\'m Going to Get Multiple Quotes (Windows)': 'I\'m Going to Get Multiple Quotes',
  'Kellie Adams - That\'s Too Expensive (Windows)': 'That\'s Too Expensive',
  'Robert Lee - My Windows Are Fine (Windows)': 'My Windows Are Fine',
  'Angela White - I Need to Talk to My Spouse (Windows)': 'I Need to Talk to My Spouse',
  
  // Roofing
  'Harold Stevens - I Don\'t Trust Door-to-Door (Roofing)': 'I Don\'t Trust Door-to-Door Roofers',
  'Diane Martinez - I\'m Selling Soon (Roofing)': 'I\'m Selling Soon',
  'Lisa Martinez - My Insurance Won\'t Cover It (Roofing)': 'My Insurance Won\'t Cover It',
  'Kevin Anderson - I Already Have Someone (Roofing)': 'I Already Have Someone',
  'Tom Bradley - I\'ll Call You When I Need a Roof (Roofing)': 'I\'ll Call You When I Need a Roof',
  'Carlos Mendez - I Just Had My Roof Done (Roofing)': 'I Just Had My Roof Done',
  'David Kim - How Much Does a Roof Cost? (Roofing)': 'How Much Does a Roof Cost?',
  
  // Pest Control
  'Vincent "Vinny" Caruso - What\'s the Price? (Pest Control)': 'What\'s the Price?',
};

async function fetchAllAgentsFromElevenLabs() {
  try {
    console.log('🔍 Fetching all agents from ElevenLabs API...\n');
    
    const url = 'https://api.elevenlabs.io/v1/convai/agents';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch agents: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const agents = data.agents || [];
    
    console.log(`✅ Found ${agents.length} agents in ElevenLabs\n`);
    return agents;
  } catch (error) {
    console.error('❌ Error fetching agents:', error.message);
    return null;
  }
}

async function getAgentDetails(agentId) {
  try {
    const url = `https://api.elevenlabs.io/v1/convai/agent/${agentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

async function getAgentsFromDatabase() {
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, eleven_agent_id, eleven_voice_id, is_active')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching agents from database:', error);
    return [];
  }

  return agents || [];
}

async function updateAgentInDatabase(dbAgent, elevenLabsAgent, voiceId) {
  const updates = {};
  let needsUpdate = false;

  // Update agent ID if different
  if (dbAgent.eleven_agent_id !== elevenLabsAgent.agent_id) {
    updates.eleven_agent_id = elevenLabsAgent.agent_id;
    needsUpdate = true;
  }

  // Update voice ID if different and we have one
  if (voiceId && dbAgent.eleven_voice_id !== voiceId) {
    updates.eleven_voice_id = voiceId;
    needsUpdate = true;
  }

  if (!needsUpdate) {
    return { updated: false, message: 'Already up to date' };
  }

  const { error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', dbAgent.id);

  if (error) {
    return { updated: false, error: error.message };
  }

  return { updated: true, updates };
}

async function createAgentInDatabase(name, agentId, voiceId, industrySlug) {
  // Get industry ID
  const { data: industry } = await supabase
    .from('industries')
    .select('id')
    .eq('slug', industrySlug)
    .single();

  if (!industry) {
    return { created: false, error: `Industry ${industrySlug} not found` };
  }

  // Create agent
  const { data: newAgent, error: createError } = await supabase
    .from('agents')
    .insert({
      name,
      eleven_agent_id: agentId,
      eleven_voice_id: voiceId || null,
      is_active: true,
    })
    .select()
    .single();

  if (createError) {
    return { created: false, error: createError.message };
  }

  // Assign to industry
  const { error: assignError } = await supabase
    .from('agent_industries')
    .insert({
      agent_id: newAgent.id,
      industry_id: industry.id,
    });

  if (assignError) {
    return { created: true, assigned: false, error: assignError.message };
  }

  return { created: true, assigned: true };
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function findMatchingDatabaseAgent(elevenLabsName, dbAgents) {
  // Try exact match first
  let match = dbAgents.find(a => normalizeName(a.name) === normalizeName(elevenLabsName));
  if (match) return match;

  // Try mapping
  const mappedName = AGENT_NAME_MAP[elevenLabsName];
  if (mappedName) {
    match = dbAgents.find(a => normalizeName(a.name) === normalizeName(mappedName));
    if (match) return match;
  }

  // Try partial match
  const searchName = mappedName || elevenLabsName;
  match = dbAgents.find(a => {
    const dbName = normalizeName(a.name);
    const elName = normalizeName(searchName);
    return dbName.includes(elName) || elName.includes(dbName);
  });

  return match;
}

async function main() {
  console.log('🚀 Starting agent sync from ElevenLabs to Supabase...\n');

  // Fetch agents from both sources
  const elevenLabsAgents = await fetchAllAgentsFromElevenLabs();
  if (!elevenLabsAgents || elevenLabsAgents.length === 0) {
    console.error('❌ No agents found in ElevenLabs');
    return;
  }

  const dbAgents = await getAgentsFromDatabase();
  console.log(`✅ Found ${dbAgents.length} agents in database\n`);

  const results = {
    updated: [],
    created: [],
    skipped: [],
    errors: [],
  };

  // Process each ElevenLabs agent
  for (const elAgent of elevenLabsAgents) {
    const elName = elAgent.name || elAgent.agent_name || '';
    const agentId = elAgent.agent_id;
    
    console.log(`\n🔍 Processing: ${elName} (${agentId})`);

    // Try to get detailed agent info for voice ID
    let voiceId = elAgent.voice_id || null;
    if (!voiceId) {
      const details = await getAgentDetails(agentId);
      if (details) {
        voiceId = details.voice_id || 
                 details.voice?.voice_id || 
                 details.voice_config?.voice_id ||
                 null;
      }
    }

    // Find matching database agent
    const dbAgent = findMatchingDatabaseAgent(elName, dbAgents);

    if (dbAgent) {
      // Update existing agent
      console.log(`   📝 Found in database: ${dbAgent.name}`);
      const result = await updateAgentInDatabase(dbAgent, elAgent, voiceId);
      
      if (result.updated) {
        console.log(`   ✅ Updated:`, result.updates);
        results.updated.push({ name: elName, dbName: dbAgent.name, ...result });
      } else if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
        results.errors.push({ name: elName, error: result.error });
      } else {
        console.log(`   ✓ ${result.message}`);
        results.skipped.push({ name: elName, reason: result.message });
      }
    } else {
      // Agent not found in database
      console.log(`   ⚠️  Not found in database - would need to create`);
      console.log(`   💡 Voice ID: ${voiceId || 'NOT FOUND'}`);
      results.skipped.push({ 
        name: elName, 
        reason: 'Not found in database - manual creation needed',
        agentId,
        voiceId 
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Updated: ${results.updated.length}`);
  console.log(`➕ Created: ${results.created.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.updated.length > 0) {
    console.log('\n📝 Updated Agents:');
    results.updated.forEach(r => {
      console.log(`   - ${r.dbName}: ${JSON.stringify(r.updates)}`);
    });
  }

  if (results.skipped.length > 0 && results.skipped.some(s => s.reason.includes('Not found'))) {
    console.log('\n⚠️  Agents not found in database (may need manual creation):');
    results.skipped
      .filter(s => s.reason.includes('Not found'))
      .forEach(s => {
        console.log(`   - ${s.name}`);
        console.log(`     Agent ID: ${s.agentId}`);
        console.log(`     Voice ID: ${s.voiceId || 'NOT FOUND'}`);
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
