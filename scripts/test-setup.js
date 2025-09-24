#!/usr/bin/env node

/**
 * Test script to verify DoorIQ setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking DoorIQ setup...\n');

// Check for required files
const requiredFiles = [
  '.env.local',
  'package.json',
  'next.config.ts',
  'lib/supabase/schema.sql',
];

const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} found`);
  } else {
    console.log(`❌ ${file} missing`);
    missingFiles.push(file);
  }
});

// Check for environment variables
if (fs.existsSync('.env.local')) {
  console.log('\n🔐 Checking environment variables...');
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar) && !envContent.includes(`${envVar}=your_`)) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`❌ ${envVar} is not set or uses placeholder value`);
    }
  });
}

// Check dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredDeps = ['next', 'react', '@supabase/supabase-js', 'framer-motion'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} installed`);
    } else {
      console.log(`❌ ${dep} missing`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
}

// Summary
console.log('\n📋 Summary:');
if (missingFiles.length === 0) {
  console.log('✅ All required files are present');
} else {
  console.log(`❌ Missing files: ${missingFiles.join(', ')}`);
  console.log('\nTo fix:');
  if (missingFiles.includes('.env.local')) {
    console.log('- Copy .env.example to .env.local and fill in your credentials');
  }
}

console.log('\n🚀 Next steps:');
console.log('1. Ensure all environment variables are set correctly');
console.log('2. Run the SQL schema in your Supabase dashboard');
console.log('3. Run `npm run dev` to start the application');
console.log('4. Visit http://localhost:3000 to see DoorIQ in action!');
