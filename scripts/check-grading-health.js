#!/usr/bin/env node

/**
 * Health check for the grading system
 * Verifies all components are working
 */

const fs = require('fs')
const path = require('path')

console.log('\n🔍 DoorIQ Grading System Health Check\n')
console.log('=' .repeat(50))

let allGood = true

// 1. Check OpenAI API Key
console.log('\n1️⃣  Checking OpenAI API Key...')
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const hasKey = envContent.includes('OPENAI_API_KEY')
  const keyLine = envContent.split('\n').find(line => line.startsWith('OPENAI_API_KEY'))
  
  if (hasKey && keyLine && !keyLine.includes('sk-...') && keyLine.length > 30) {
    console.log('   ✅ OpenAI API key found and configured')
  } else if (hasKey) {
    console.log('   ⚠️  OpenAI API key found but may be invalid')
    console.log('   Check that it starts with "sk-" and is not a placeholder')
    allGood = false
  } else {
    console.log('   ❌ OpenAI API key NOT found in .env')
    console.log('   Add: OPENAI_API_KEY="sk-your-key-here"')
    allGood = false
  }
} else {
  console.log('   ❌ .env file not found')
  console.log('   Create .env file and add: OPENAI_API_KEY="sk-your-key-here"')
  allGood = false
}

// 2. Check grading API file exists
console.log('\n2️⃣  Checking grading API file...')
const apiPath = path.join(__dirname, '..', 'app', 'api', 'grade', 'session', 'route.ts')
if (fs.existsSync(apiPath)) {
  const apiContent = fs.readFileSync(apiPath, 'utf8')
  if (apiContent.includes('gradeWithOpenAI')) {
    console.log('   ✅ Grading API file exists and contains OpenAI function')
  } else {
    console.log('   ⚠️  Grading API file exists but may be outdated')
    allGood = false
  }
} else {
  console.log('   ❌ Grading API file not found')
  allGood = false
}

// 3. Check old analyzer is archived
console.log('\n3️⃣  Checking old analyzer is removed...')
const oldAnalyzerPath = path.join(__dirname, '..', 'lib', 'trainer', 'conversationAnalyzer.ts')
const archivedPath = path.join(__dirname, '..', 'archive', 'conversationAnalyzer.ts')
if (!fs.existsSync(oldAnalyzerPath)) {
  console.log('   ✅ Old analyzer removed from lib/trainer/')
  if (fs.existsSync(archivedPath)) {
    console.log('   ✅ Old analyzer archived successfully')
  }
} else {
  console.log('   ⚠️  Old analyzer still exists in lib/trainer/')
  console.log('   This might cause conflicts. It should be archived.')
}

// 4. Check TranscriptView component
console.log('\n4️⃣  Checking TranscriptView component...')
const transcriptViewPath = path.join(__dirname, '..', 'components', 'analytics', 'TranscriptView.tsx')
if (fs.existsSync(transcriptViewPath)) {
  const content = fs.readFileSync(transcriptViewPath, 'utf8')
  if (content.includes('alternative') && content.includes('Try instead')) {
    console.log('   ✅ TranscriptView supports alternative phrases')
  } else {
    console.log('   ⚠️  TranscriptView may not show alternative phrases')
    allGood = false
  }
} else {
  console.log('   ❌ TranscriptView component not found')
  allGood = false
}

// 5. Check analytics page
console.log('\n5️⃣  Checking analytics page...')
const analyticsPath = path.join(__dirname, '..', 'app', 'trainer', 'analytics', '[sessionId]', 'page.tsx')
if (fs.existsSync(analyticsPath)) {
  const content = fs.readFileSync(analyticsPath, 'utf8')
  if (content.includes('what_worked') && content.includes('AI Performance Analysis')) {
    console.log('   ✅ Analytics page shows AI feedback properly')
  } else {
    console.log('   ⚠️  Analytics page may not display AI feedback')
    allGood = false
  }
} else {
  console.log('   ❌ Analytics page not found')
  allGood = false
}

// 6. Check dependencies
console.log('\n6️⃣  Checking dependencies...')
const packagePath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const hasOpenAI = packageJson.dependencies?.openai || packageJson.devDependencies?.openai
  
  if (hasOpenAI) {
    console.log('   ✅ OpenAI package installed:', hasOpenAI)
  } else {
    console.log('   ❌ OpenAI package NOT found in package.json')
    console.log('   Run: npm install openai')
    allGood = false
  }
} else {
  console.log('   ❌ package.json not found')
  allGood = false
}

// Summary
console.log('\n' + '='.repeat(50))
if (allGood) {
  console.log('✅ All checks passed! Grading system should work.')
  console.log('\nNext steps:')
  console.log('1. Start dev server: npm run dev')
  console.log('2. Complete a training session')
  console.log('3. Check analytics page for grading')
  console.log('4. Look at terminal logs for 🤖 emoji messages')
} else {
  console.log('⚠️  Some issues found. Fix them and run this check again.')
  console.log('\nFor detailed troubleshooting, see:')
  console.log('📖 GRADING_TROUBLESHOOTING.md')
}

console.log('\n')
process.exit(allGood ? 0 : 1)
