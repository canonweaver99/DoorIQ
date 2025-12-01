#!/usr/bin/env node

/**
 * Script to add structured header placeholders to module content
 * This version preserves existing structure and adds headers as placeholders
 * for manual editing, rather than auto-categorizing content
 */

const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../lib/supabase/migrations/101_populate_learning_content.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

function addHeaderStructure(originalContent, title) {
  let content = originalContent.trim();
  
  // Remove title and estimated read if present
  content = content.replace(/^#\s+.*?\n/, '');
  content = content.replace(/\*\*Estimated read:.*?\*\*\n\n?/g, '');
  content = content.trim();
  
  // Remove "Try This Today" section
  const tryThisIndex = content.indexOf('**Try This Today**');
  if (tryThisIndex !== -1) {
    content = content.substring(0, tryThisIndex).trim();
  }
  
  // Remove horizontal rules
  content = content.replace(/^---\s*$/gm, '').trim();
  
  // Check if already has structured headers
  const hasWhy = /##\s+(Why|why)/i.test(content);
  const hasMistake = /##\s+(The\s+)?Mistake/i.test(content);
  const hasFramework = /##\s+(The\s+)?Framework/i.test(content);
  const hasExamples = /##\s+Example/i.test(content);
  
  if (hasWhy && hasMistake && hasFramework) {
    // Already structured, just ensure title format is correct
    return `${title}\n\n**Estimated read: 2 minutes**\n\n${content}`;
  }
  
  // If content already has some structure, preserve it and add missing headers
  let output = `${title}\n\n**Estimated read: 2 minutes**\n\n`;
  
  // Add headers as placeholders, preserving existing content
  if (!hasWhy) {
    output += `## Why This Matters\n\n[Add content explaining why this matters]\n\n`;
  }
  
  if (!hasMistake) {
    output += `## The Mistake Most Reps Make\n\n[Add content about common mistakes]\n\n`;
  }
  
  if (!hasFramework) {
    output += `## The Framework\n\n[Add content explaining the framework/approach]\n\n`;
  }
  
  if (!hasExamples) {
    output += `## Example Scripts\n\n[Add example scripts or scenarios]\n\n`;
  }
  
  // Append original content after the headers for manual organization
  if (content.length > 0) {
    output += `---\n\n## Original Content (to be organized above)\n\n${content}`;
  }
  
  return output.trim();
}

// Split by INSERT statements
const inserts = migrationContent.split(/INSERT INTO learning_modules/).slice(1);

const modules = [];

inserts.forEach((insertSQL, idx) => {
  try {
    // Extract title, slug, category, display_order, estimated_minutes
    const titleMatch = insertSQL.match(/'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),/);
    if (!titleMatch) {
      console.log(`Skipping insert ${idx + 1}: Could not parse title/slug`);
      return;
    }
    
    const title = titleMatch[1];
    const slug = titleMatch[2];
    const category = titleMatch[3];
    const displayOrder = parseInt(titleMatch[4]);
    const estimatedMinutes = parseInt(titleMatch[5]);
    
    // Find content - it starts after estimated_minutes and ends before ', true)' or ', false)'
    const afterEstimated = insertSQL.indexOf(`${estimatedMinutes},`);
    if (afterEstimated === -1) {
      console.log(`Skipping ${title}: Could not find estimated_minutes`);
      return;
    }
    
    // Find the opening quote for content
    const contentStart = insertSQL.indexOf("'", afterEstimated);
    if (contentStart === -1) {
      console.log(`Skipping ${title}: Could not find content start`);
      return;
    }
    
    // Parse content character by character, handling '' escapes
    let content = '';
    let i = contentStart + 1; // Skip opening quote
    let inQuote = true;
    
    while (i < insertSQL.length && inQuote) {
      if (insertSQL[i] === "'" && insertSQL[i + 1] === "'") {
        // Escaped quote
        content += "'";
        i += 2;
      } else if (insertSQL[i] === "'" && insertSQL[i + 1] !== "'") {
        // Check if this is the end quote (followed by comma and whitespace/newline, then true/false)
        const afterQuote = insertSQL.substring(i + 1).trim();
        if (afterQuote.match(/^,\s*(true|false)\)/)) {
          inQuote = false;
          break;
        }
        content += "'";
        i++;
      } else {
        content += insertSQL[i];
        i++;
      }
    }
    
    if (!content.trim()) {
      console.log(`Skipping ${title}: Empty content`);
      return;
    }
    
    console.log(`Processing: ${title} (${slug})`);
    
    const restructured = addHeaderStructure(content, title);
    modules.push({
      title,
      slug,
      category,
      displayOrder,
      estimatedMinutes,
      content: restructured
    });
  } catch (error) {
    console.log(`Error processing insert ${idx + 1}: ${error.message}`);
  }
});

console.log(`\nSuccessfully processed ${modules.length} modules\n`);

// Generate migration
const newMigrationPath = path.join(__dirname, '../lib/supabase/migrations/110_add_header_structure_placeholders.sql');
let newMigration = `-- Add structured header placeholders to module content
-- Generated: ${new Date().toISOString()}
-- This adds header placeholders for manual editing:
-- - Why This Matters
-- - The Mistake Most Reps Make  
-- - The Framework
-- - Example Scripts
-- Original content is preserved at the bottom for manual organization

BEGIN;

`;

modules.forEach((module) => {
  // Escape single quotes for SQL ('' becomes ''''')
  const escapedContent = module.content.replace(/'/g, "''");
  
  newMigration += `-- Module: ${module.title}
UPDATE learning_modules
SET content = '''${escapedContent}''',
    updated_at = NOW()
WHERE slug = '${module.slug}';

`;
});

newMigration += `COMMIT;
`;

fs.writeFileSync(newMigrationPath, newMigration, 'utf8');
console.log(`✅ Generated migration: ${newMigrationPath}`);
console.log(`\nThis migration adds header placeholders while preserving original content.`);
console.log(`You can then manually organize each lesson's content into the appropriate sections.`);

