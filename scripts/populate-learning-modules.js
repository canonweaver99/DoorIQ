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
    slug: 'positioning',
    title: 'Positioning Yourself (Literally)',
    category: 'approach',
    display_order: 1,
    estimated_minutes: 2,
    contentFile: 'modules/approach/01-positioning.md',
  },
  {
    slug: 'pattern-interrupt',
    title: 'The Pattern Interrupt',
    category: 'approach',
    display_order: 2,
    estimated_minutes: 3,
    contentFile: 'modules/approach/02-pattern-interrupt.md',
  },
  {
    slug: 'reading-signs',
    title: 'Reading the Signs',
    category: 'approach',
    display_order: 3,
    estimated_minutes: 3,
    contentFile: 'modules/approach/03-reading-signs.md',
  },
  {
    slug: 'icebreaker',
    title: 'The Icebreaker That Works',
    category: 'approach',
    display_order: 4,
    estimated_minutes: 3,
    contentFile: 'modules/approach/04-icebreaker.md',
  },
  {
    slug: 'what-not-to-do',
    title: 'What Not to Do',
    category: 'approach',
    display_order: 5,
    estimated_minutes: 3,
    contentFile: 'modules/approach/05-what-not-to-do.md',
  },
  {
    slug: 'transition',
    title: 'The Transition',
    category: 'approach',
    display_order: 6,
    estimated_minutes: 2,
    contentFile: 'modules/approach/06-transition.md',
  },
  {
    slug: 'value-before-price',
    title: 'Building Value Before Price',
    category: 'pitch',
    display_order: 8,
    estimated_minutes: 3,
    contentFile: 'modules/pitch/02-value-before-price.md',
  },
  {
    slug: 'features-vs-benefits',
    title: 'Features vs Benefits',
    category: 'pitch',
    display_order: 9,
    estimated_minutes: 3,
    contentFile: 'modules/pitch/03-features-vs-benefits.md',
  },
  {
    slug: 'painting-the-picture',
    title: 'Painting the Picture',
    category: 'pitch',
    display_order: 10,
    estimated_minutes: 3,
    contentFile: 'modules/pitch/04-painting-the-picture.md',
  },
  {
    slug: 'keep-ammo',
    title: 'Keep Ammo in Your Pocket',
    category: 'pitch',
    display_order: 11,
    estimated_minutes: 2,
    contentFile: 'modules/pitch/05-keep-ammo.md',
  },
  {
    slug: 'reading-adjusting',
    title: 'Reading and Adjusting',
    category: 'pitch',
    display_order: 12,
    estimated_minutes: 3,
    contentFile: 'modules/pitch/06-reading-adjusting.md',
  },
  {
    slug: 'overcome',
    title: 'Overcoming Objections: The R.A.C. Framework',
    category: 'overcome',
    display_order: 13,
    estimated_minutes: 3,
    contentFile: 'modules/03-overcome.md',
  },
  {
    slug: 'soft-vs-hard',
    title: 'Soft Closes vs Hard Closes',
    category: 'close',
    display_order: 15,
    estimated_minutes: 3,
    contentFile: 'modules/closing/02-soft-vs-hard.md',
  },
  {
    slug: 'soft-close-types',
    title: 'Types of Soft Closes',
    category: 'close',
    display_order: 16,
    estimated_minutes: 3,
    contentFile: 'modules/closing/03-soft-close-types.md',
  },
  {
    slug: 'three-close-rule',
    title: 'The 3-Close Rule',
    category: 'close',
    display_order: 17,
    estimated_minutes: 3,
    contentFile: 'modules/closing/04-three-close-rule.md',
  },
  {
    slug: 'assumptive-language',
    title: 'Assumptive Language',
    category: 'close',
    display_order: 18,
    estimated_minutes: 2,
    contentFile: 'modules/closing/05-assumptive-language.md',
  },
  {
    slug: 'hard-close-sequence',
    title: 'The Hard Close Sequence',
    category: 'close',
    display_order: 19,
    estimated_minutes: 3,
    contentFile: 'modules/closing/06-hard-close-sequence.md',
  },
  {
    slug: 'mirroring',
    title: 'Mirroring — Get Into Their World',
    category: 'communication',
    display_order: 20,
    estimated_minutes: 3,
    contentFile: 'modules/communication/01-mirroring.md',
  },
  {
    slug: 'eye-contact',
    title: 'Eye Contact — Look, Don\'t Stare',
    category: 'communication',
    display_order: 21,
    estimated_minutes: 2,
    contentFile: 'modules/communication/02-eye-contact.md',
  },
  {
    slug: 'paraverbals',
    title: 'Paraverbals — It\'s Not What You Say, It\'s How You Say It',
    category: 'communication',
    display_order: 22,
    estimated_minutes: 3,
    contentFile: 'modules/communication/03-paraverbals.md',
  },
  {
    slug: 'body-language',
    title: 'Body Language — What You\'re Saying Without Words',
    category: 'communication',
    display_order: 23,
    estimated_minutes: 3,
    contentFile: 'modules/communication/04-body-language.md',
  },
  {
    slug: 'reading-body-language',
    title: 'Reading Their Body Language',
    category: 'communication',
    display_order: 24,
    estimated_minutes: 3,
    contentFile: 'modules/communication/05-reading-body-language.md',
  },
  {
    slug: 'energy-management',
    title: 'Energy Management — Yours and Theirs',
    category: 'communication',
    display_order: 25,
    estimated_minutes: 3,
    contentFile: 'modules/communication/06-energy-management.md',
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


