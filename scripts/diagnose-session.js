#!/usr/bin/env node

/**
 * Diagnostic tool to check session grading status
 * Usage: node scripts/diagnose-session.js <session-id>
 */

const sessionId = process.argv[2]

if (!sessionId) {
  console.log('Usage: node scripts/diagnose-session.js <session-id>')
  console.log('\nExample:')
  console.log('node scripts/diagnose-session.js 60e279e-8f0a-477a-9b23-c8a28b93539e')
  process.exit(1)
}

async function diagnose() {
  console.log('🔍 Diagnosing session:', sessionId)
  console.log('')
  
  try {
    // Test the grading endpoint
    console.log('📡 Testing grading endpoint...')
    const response = await fetch(`http://localhost:3000/api/grade/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    
    console.log('Status:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('\n📦 Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ Grading successful!')
      console.log('Overall score:', data.scores?.overall)
      console.log('Virtual earnings:', data.virtual_earnings)
      console.log('Line ratings:', data.line_ratings?.length || 0)
    } else {
      console.log('\n❌ Grading failed')
      console.log('Error:', data.error)
      console.log('Details:', data.details)
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message)
    console.error('\nMake sure:')
    console.error('1. Dev server is running (npm run dev)')
    console.error('2. Session ID is correct')
    console.error('3. Session has a transcript')
  }
}

diagnose()
