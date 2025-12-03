/**
 * Script to list all available ElevenLabs voices
 * Run with: node scripts/list-elevenlabs-voices.js
 * 
 * This will help you find the correct voice IDs to add to PERSONA_METADATA
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.ELEVEN_LABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVEN_LABS_API_KEY not found in environment variables');
  console.log('💡 Make sure you have a .env.local file with ELEVEN_LABS_API_KEY set');
  process.exit(1);
}

async function listVoices() {
  try {
    const url = 'https://api.elevenlabs.io/v1/voices';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch voices:', response.status, errorText);
      return;
    }

    const data = await response.json();
    const voices = data.voices || [];

    console.log(`\n✅ Found ${voices.length} voices:\n`);
    console.log('Voice Name'.padEnd(30), 'Voice ID'.padEnd(25), 'Description');
    console.log('-'.repeat(80));

    voices.forEach(voice => {
      const name = (voice.name || 'Unknown').padEnd(30);
      const id = (voice.voice_id || 'N/A').padEnd(25);
      const description = voice.description || voice.labels?.description || '';
      console.log(name, id, description);
    });

    console.log('\n💡 To add voice IDs to personas:');
    console.log('   1. Find the voice ID for each agent from the list above');
    console.log('   2. Add elevenVoiceId to each agent in components/trainer/personas.ts');
    console.log('   3. Example:');
    console.log('      elevenVoiceId: \'pNInz6obpgDQGcFmaJgB\',');
    
    console.log('\n📝 Note: You may need to check your ElevenLabs dashboard to see which');
    console.log('   voice is configured for each ConvAI agent, as the agent API');
    console.log('   doesn\'t expose this information directly.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listVoices();


