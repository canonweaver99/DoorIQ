/**
 * Script to populate learning modules and objections from markdown files
 * Run with: node scripts/populate-learning-modules.js
 * 
 * This script reads markdown files from modules/ and objections/ directories
 * and inserts them into the Supabase database.
 */

const fs = require('fs')
const path = require('path')

// Module data mapping
const modules = [
  {
    slug: 'approach',
    title: 'The Approach: Your First 5 Seconds Decide Everything',
    category: 'approach',
    display_order: 1,
    estimated_minutes: 3,
    contentFile: 'modules/01-approach.md',
  },
  {
    slug: 'pitch',
    title: 'The Pitch: Building Value Before Price',
    category: 'pitch',
    display_order: 2,
    estimated_minutes: 3,
    contentFile: 'modules/02-pitch.md',
  },
  {
    slug: 'overcome',
    title: 'Overcoming Objections: The R.A.C. Framework',
    category: 'overcome',
    display_order: 3,
    estimated_minutes: 3,
    contentFile: 'modules/03-overcome.md',
  },
  {
    slug: 'close',
    title: 'The Close: Why Customers Expect You to Ask',
    category: 'close',
    display_order: 4,
    estimated_minutes: 2,
    contentFile: 'modules/04-close.md',
  },
  {
    slug: 'mirroring',
    title: 'Mirroring: Building Instant Rapport',
    category: 'communication',
    display_order: 5,
    estimated_minutes: 3,
    contentFile: 'modules/05-mirroring.md',
  },
  {
    slug: 'tone',
    title: 'Tone: How You Say It Matters More Than What You Say',
    category: 'communication',
    display_order: 6,
    estimated_minutes: 3,
    contentFile: 'modules/06-tone.md',
  },
  {
    slug: 'paraverbals',
    title: 'Paraverbals: The Hidden Language of Sales',
    category: 'communication',
    display_order: 7,
    estimated_minutes: 3,
    contentFile: 'modules/07-paraverbals.md',
  },
  {
    slug: 'eye-contact',
    title: 'Eye Contact: The Window to Trust',
    category: 'communication',
    display_order: 8,
    estimated_minutes: 3,
    contentFile: 'modules/08-eye-contact.md',
  },
  {
    slug: 'energy-matching',
    title: 'Energy Matching: Finding Their Frequency',
    category: 'communication',
    display_order: 9,
    estimated_minutes: 3,
    contentFile: 'modules/09-energy-matching.md',
  },
]

// Objection data mapping
const objections = [
  {
    slug: 'price',
    name: 'Price Objection',
    display_order: 1,
    contentFile: 'objections/01-price.md',
  },
  {
    slug: 'switchover',
    name: 'Switchover Objection',
    display_order: 2,
    contentFile: 'objections/02-switchover.md',
  },
  {
    slug: 'diy',
    name: 'DIY Objection',
    display_order: 3,
    contentFile: 'objections/03-diy.md',
  },
  {
    slug: 'spouse',
    name: 'Spouse Check Objection',
    display_order: 4,
    contentFile: 'objections/04-spouse.md',
  },
  {
    slug: 'think-about-it',
    name: 'Think About It Objection',
    display_order: 5,
    contentFile: 'objections/05-think-about-it.md',
  },
  {
    slug: 'renter',
    name: 'Renter Objection',
    display_order: 6,
    contentFile: 'objections/06-renter.md',
  },
]

function readMarkdownFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    return fs.readFileSync(fullPath, 'utf-8')
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return null
  }
}

function generateSQL() {
  const sqlStatements = []
  
  // Generate INSERT statements for modules
  sqlStatements.push('-- Insert Learning Modules')
  sqlStatements.push('BEGIN;')
  sqlStatements.push('')
  
  modules.forEach((module) => {
    const content = readMarkdownFile(module.contentFile)
    if (!content) {
      console.warn(`Skipping module ${module.slug} - file not found`)
      return
    }
    
    // Escape single quotes in SQL
    const escapedContent = content.replace(/'/g, "''")
    
    sqlStatements.push(`-- Module: ${module.title}`)
    sqlStatements.push(`INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)`)
    sqlStatements.push(`VALUES (`)
    sqlStatements.push(`  '${module.title.replace(/'/g, "''")}',`)
    sqlStatements.push(`  '${module.slug}',`)
    sqlStatements.push(`  '${module.category}',`)
    sqlStatements.push(`  ${module.display_order},`)
    sqlStatements.push(`  ${module.estimated_minutes},`)
    sqlStatements.push(`  '${escapedContent}',`)
    sqlStatements.push(`  true`)
    sqlStatements.push(`) ON CONFLICT (slug) DO UPDATE SET`)
    sqlStatements.push(`  title = EXCLUDED.title,`)
    sqlStatements.push(`  category = EXCLUDED.category,`)
    sqlStatements.push(`  display_order = EXCLUDED.display_order,`)
    sqlStatements.push(`  estimated_minutes = EXCLUDED.estimated_minutes,`)
    sqlStatements.push(`  content = EXCLUDED.content,`)
    sqlStatements.push(`  is_published = EXCLUDED.is_published,`)
    sqlStatements.push(`  updated_at = NOW();`)
    sqlStatements.push('')
  })
  
  // Generate INSERT statements for objections
  sqlStatements.push('-- Insert Learning Objections')
  sqlStatements.push('')
  
  objections.forEach((objection) => {
    const content = readMarkdownFile(objection.contentFile)
    if (!content) {
      console.warn(`Skipping objection ${objection.slug} - file not found`)
      return
    }
    
    // Escape single quotes in SQL
    const escapedContent = content.replace(/'/g, "''")
    
    sqlStatements.push(`-- Objection: ${objection.name}`)
    sqlStatements.push(`INSERT INTO learning_objections (name, slug, description, display_order)`)
    sqlStatements.push(`VALUES (`)
    sqlStatements.push(`  '${objection.name.replace(/'/g, "''")}',`)
    sqlStatements.push(`  '${objection.slug}',`)
    sqlStatements.push(`  '${escapedContent}',`)
    sqlStatements.push(`  ${objection.display_order}`)
    sqlStatements.push(`) ON CONFLICT (slug) DO UPDATE SET`)
    sqlStatements.push(`  name = EXCLUDED.name,`)
    sqlStatements.push(`  description = EXCLUDED.description,`)
    sqlStatements.push(`  display_order = EXCLUDED.display_order,`)
    sqlStatements.push(`  updated_at = NOW();`)
    sqlStatements.push('')
  })
  
  sqlStatements.push('COMMIT;')
  
  return sqlStatements.join('\n')
}

// Generate SQL file
const sql = generateSQL()
const outputPath = path.join(process.cwd(), 'lib/supabase/migrations/101_populate_learning_content.sql')

fs.writeFileSync(outputPath, sql)
console.log(`✅ Generated SQL migration file: ${outputPath}`)
console.log(`📝 Review the file and run it in your Supabase SQL editor`)


