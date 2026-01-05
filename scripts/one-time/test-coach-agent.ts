/**
 * Test script for coach agent
 * Tests specific homeowner statements to ensure responses are natural and don't contain banned phrases
 */

import 'dotenv/config'
import { generateSuggestion, CoachAgentContext } from '../lib/coach/coach-agent'

// Test cases: homeowner statement -> what it should NOT include -> what it SHOULD sound like
const testCases = [
  {
    homeowner: "Not interested",
    shouldNotInclude: ["I appreciate", "Quick question"],
    shouldSoundLike: "No worries. Any bugs lately?"
  },
  {
    homeowner: "Too expensive",
    shouldNotInclude: ["The great news", "What I can do"],
    shouldSoundLike: "Yeah it's not cheap. What do you spend now on sprays and stuff?"
  },
  {
    homeowner: "Need to ask my wife",
    shouldNotInclude: ["That's totally fair", "What I can do is"],
    shouldSoundLike: "For sure. She around?"
  },
  {
    homeowner: "Already have Orkin",
    shouldNotInclude: ["What sets us apart"],
    shouldSoundLike: "Oh nice, they been good?"
  }
]

// Mock script sections (typical pest control script content)
const mockScriptSections = [
  {
    text: `Opening: When homeowner answers the door, introduce yourself and company. 
    "Hi, I'm [YOUR NAME] with [COMPANY NAME]. We're treating homes in the neighborhood for pests today."
    
    If they say not interested: "I appreciate your time! Quick question though - are you not interested because you don't have a pest problem, or is it more about timing?"
    
    Price objection: "I totally understand budget is a concern. The great news is we offer flexible payment options. What I can do for you is show you how our service actually saves money compared to what you're spending now."
    
    Spouse objection: "That's totally fair, it's a big decision! What I can do is leave some information with you, or if she's available now, I'd be happy to chat with both of you."
    
    Already have service: "That's great that you're already protected! What sets us apart is our satisfaction guarantee and local service. Have you been happy with them?"`
  }
]

async function runTests() {
  console.log('🧪 Testing Coach Agent\n')
  console.log('=' .repeat(80))
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n📝 Test ${i + 1}/${testCases.length}`)
    console.log(`Homeowner says: "${testCase.homeowner}"`)
    console.log(`Should NOT include: ${testCase.shouldNotInclude.join(', ')}`)
    console.log(`Should sound like: "${testCase.shouldSoundLike}"`)
    console.log('-'.repeat(80))
    
    const context: CoachAgentContext = {
      homeownerText: testCase.homeowner,
      scriptSections: mockScriptSections,
      companyName: 'Pest Shield',
      repName: 'John'
    }
    
    try {
      const result = await generateSuggestion(context)
      const response = result.suggestedLine
      
      console.log(`✅ Coach Response: "${response}"`)
      
      // Check for banned phrases
      const lowerResponse = response.toLowerCase()
      const foundBannedPhrases: string[] = []
      
      testCase.shouldNotInclude.forEach(phrase => {
        if (lowerResponse.includes(phrase.toLowerCase())) {
          foundBannedPhrases.push(phrase)
        }
      })
      
      if (foundBannedPhrases.length > 0) {
        console.log(`❌ FAILED: Found banned phrases: ${foundBannedPhrases.join(', ')}`)
      } else {
        console.log(`✅ PASSED: No banned phrases detected`)
      }
      
      // Check length (should be short)
      const sentences = response.split(/[.!?]/).filter(s => s.trim().length > 0)
      if (sentences.length > 3) {
        console.log(`⚠️  WARNING: Response is too long (${sentences.length} sentences)`)
      } else {
        console.log(`✅ Length check passed (${sentences.length} sentences)`)
      }
      
      // Check for exclamation points
      if (response.includes('!')) {
        console.log(`⚠️  WARNING: Response contains exclamation points (too eager)`)
      } else {
        console.log(`✅ No exclamation points`)
      }
      
    } catch (error: any) {
      console.error(`❌ ERROR: ${error.message}`)
      console.error(error.stack)
    }
    
    console.log('='.repeat(80))
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✅ Testing complete!\n')
}

// Run tests
runTests().catch(console.error)
