// Check agent names in database vs what code expects
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected names from ALLOWED_AGENT_ORDER
const EXPECTED_SOLAR_NAMES = [
  "I'm Not Interested in Solar",
  "Solar is Too Expensive",
  "How Much Does It Cost?",
  "My Electric Bill is Too Low",
  "What If It Doesn't Work?",
  "My Roof is Too Old",
  "I've Heard Bad Things About Solar",
  "I Don't Qualify",
  "I Need to Talk to My Spouse", // Michelle Torres
  "I'm Selling Soon" // Jennifer Walsh / Diane Martinez
];

const EXPECTED_WINDOWS_NAMES = [
  "My Windows Are Fine",
  "That's Too Expensive",
  "I'm Going to Get Multiple Quotes",
  "I Just Need One or Two Windows",
  "I'm Selling/Moving Soon",
  "I'll Just Do It Myself",
  "What's Wrong With My Current Windows?",
  "I'm Waiting Until...",
  "Not the Right Time / Maybe Next Year",
  "I Need to Talk to My Spouse" // Angela White
];

const EXPECTED_ROOFING_NAMES = [
  "My Roof is Fine",
  "I'm Not Interested",
  "How Much Does a Roof Cost?",
  "I Just Had My Roof Done",
  "I'll Call You When I Need a Roof",
  "I Already Have Someone",
  "My Insurance Won't Cover It",
  "I'm Selling Soon",
  "I Don't Trust Door-to-Door Roofers",
  "I Need to Talk to My Spouse" // Patricia Wells
];

async function checkAgentNames() {
  console.log('🔍 Checking agent names in database...\n');

  // Get solar agents
  const { data: solarAgents } = await supabase
    .from('agent_industries')
    .select('agents(name, eleven_agent_id), industries(slug)')
    .eq('industries.slug', 'solar');

  console.log('☀️  SOLAR AGENTS:');
  const solarNames = solarAgents?.map(ai => ai.agents?.name).filter(Boolean) || [];
  solarNames.forEach(name => {
    const isExpected = EXPECTED_SOLAR_NAMES.some(expected => 
      name.includes(expected.split(' ')[0]) || expected.includes(name.split(' ')[0])
    );
    const status = isExpected ? '✅' : '❌';
    console.log(`   ${status} ${name}`);
  });

  console.log('\n🚪 WINDOWS AGENTS:');
  const { data: windowsAgents } = await supabase
    .from('agent_industries')
    .select('agents(name, eleven_agent_id), industries(slug)')
    .eq('industries.slug', 'windows');
  
  const windowsNames = windowsAgents?.map(ai => ai.agents?.name).filter(Boolean) || [];
  windowsNames.forEach(name => {
    const isExpected = EXPECTED_WINDOWS_NAMES.some(expected => 
      name.includes(expected.split(' ')[0]) || expected.includes(name.split(' ')[0])
    );
    const status = isExpected ? '✅' : '❌';
    console.log(`   ${status} ${name}`);
  });

  console.log('\n🏠 ROOFING AGENTS:');
  const { data: roofingAgents } = await supabase
    .from('agent_industries')
    .select('agents(name, eleven_agent_id), industries(slug)')
    .eq('industries.slug', 'roofing');
  
  const roofingNames = roofingAgents?.map(ai => ai.agents?.name).filter(Boolean) || [];
  roofingNames.forEach(name => {
    const isExpected = EXPECTED_ROOFING_NAMES.some(expected => 
      name.includes(expected.split(' ')[0]) || expected.includes(name.split(' ')[0])
    );
    const status = isExpected ? '✅' : '❌';
    console.log(`   ${status} ${name}`);
  });

  console.log('\n\n📋 SUMMARY:');
  console.log('The database has REAL NAMES (e.g., "Gary Thompson")');
  console.log('But the code expects OBJECTION NAMES (e.g., "I\'m Not Interested in Solar")');
  console.log('\nThis is why agents aren\'t appearing - the normalizeAgentName function');
  console.log('doesn\'t map real names to objection names for industry-specific agents.');
}

checkAgentNames().catch(console.error);
