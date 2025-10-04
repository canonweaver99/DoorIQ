#!/usr/bin/env node

/**
 * Simple test script to verify the new OpenAI grading system works
 * 
 * Usage:
 *   node scripts/test-grading.js <session-id>
 * 
 * This will:
 * 1. Call the grading API with a session ID
 * 2. Display the results
 */

const sessionId = process.argv[2]

if (!sessionId) {
  console.error('❌ Please provide a session ID')
  console.log('Usage: node scripts/test-grading.js <session-id>')
  process.exit(1)
}

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testGrading() {
  console.log(`\n🧪 Testing grading for session: ${sessionId}\n`)
  
  try {
    const response = await fetch(`${API_URL}/api/grade/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Grading failed:', data.error)
      console.error('Details:', data.details)
      process.exit(1)
    }

    console.log('✅ Grading successful!\n')
    console.log('📊 SCORES:')
    console.log(`   Overall: ${data.scores.overall}`)
    console.log(`   Introduction: ${data.scores.introduction}`)
    console.log(`   Rapport: ${data.scores.rapport}`)
    console.log(`   Listening: ${data.scores.listening}`)
    console.log(`   Sales Technique: ${data.scores.sales_technique}`)
    console.log(`   Closing: ${data.scores.closing}`)
    console.log(`   Safety: ${data.scores.safety}`)
    
    console.log('\n💰 VIRTUAL EARNINGS:', `$${data.virtual_earnings || 0}`)
    
    console.log('\n✨ STRENGTHS:')
    data.feedback.strengths?.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))
    
    console.log('\n⚠️  IMPROVEMENTS:')
    data.feedback.improvements?.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))
    
    console.log('\n💡 SPECIFIC TIPS:')
    data.feedback.specific_tips?.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))
    
    console.log('\n📝 LINE RATINGS:')
    const lineRatings = data.line_ratings || []
    const ratingCounts = {
      excellent: lineRatings.filter(r => r.rating === 'excellent').length,
      good: lineRatings.filter(r => r.rating === 'good').length,
      average: lineRatings.filter(r => r.rating === 'average').length,
      poor: lineRatings.filter(r => r.rating === 'poor').length,
    }
    console.log(`   Excellent: ${ratingCounts.excellent}`)
    console.log(`   Good: ${ratingCounts.good}`)
    console.log(`   Average: ${ratingCounts.average}`)
    console.log(`   Poor: ${ratingCounts.poor}`)
    
    // Show a few examples with alternatives
    const poorLines = lineRatings.filter(r => r.rating === 'poor' && r.alternative)
    if (poorLines.length > 0) {
      console.log('\n🔧 SAMPLE IMPROVEMENTS:')
      poorLines.slice(0, 3).forEach((line, i) => {
        console.log(`\n   Line ${line.idx}:`)
        console.log(`   Reason: ${line.reason}`)
        console.log(`   💡 Alternative: "${line.alternative}"`)
      })
    }
    
    console.log('\n✅ Test complete!\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testGrading()
