#!/usr/bin/env node

/**
 * Script to restructure module content to include structured headers
 * Handles SQL single-quoted strings correctly
 */

const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../lib/supabase/migrations/101_populate_learning_content.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

function restructureModuleContent(originalContent, title) {
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
  
  // Check if already structured
  if (/##\s+(Why|why)/i.test(content) && /##\s+(The\s+)?Mistake/i.test(content) && /##\s+(The\s+)?Framework/i.test(content)) {
    return `# ${title}\n**Estimated read: 2 minutes**\n\n${content}`;
  }
  
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0 && !p.startsWith('##'));
  
  const sections = {
    why: [],
    mistake: [],
    framework: [],
    examples: []
  };
  
  for (const para of paragraphs) {
    const lower = para.toLowerCase();
    
    // Why section - first substantial paragraph
    if (sections.why.length === 0 && para.length > 100 && 
        !lower.includes('example') && !lower.includes('script') &&
        !lower.includes("don't") && !lower.includes('never')) {
      sections.why.push(para);
      continue;
    }
    
    // Mistake section
    if (lower.includes("don't") || lower.includes("never") || 
        lower.includes("mistake") || lower.includes("wrong") ||
        lower.includes("bad") || lower.includes("avoid") ||
        lower.includes("shouldn't") || lower.includes("can't") ||
        lower.includes("amateur") || lower.includes("desperate")) {
      sections.mistake.push(para);
      continue;
    }
    
    // Examples
    if (para.startsWith('>') || lower.includes('example') || 
        lower.includes('script') || para.match(/^\*\*.*:/)) {
      sections.examples.push(para);
      continue;
    }
    
    // Framework (default)
    sections.framework.push(para);
  }
  
  let output = `${title}\n\n**Estimated read: 2 minutes**\n\n`;
  
  if (sections.why.length > 0) {
    output += `## Why This Matters\n\n${sections.why.join('\n\n')}\n\n`;
  } else if (paragraphs.length > 0) {
    output += `## Why This Matters\n\n${paragraphs[0]}\n\n`;
  }
  
  if (sections.mistake.length > 0) {
    output += `## The Mistake Most Reps Make\n\n${sections.mistake.join('\n\n')}\n\n`;
  }
  
  if (sections.framework.length > 0) {
    output += `## The Framework\n\n${sections.framework.join('\n\n')}\n\n`;
  }
  
  if (sections.examples.length > 0) {
    output += `## Example Scripts\n\n${sections.examples.join('\n\n')}\n\n`;
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
    // Content is wrapped in single quotes, with '' escaping single quotes
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
    
    const restructured = restructureModuleContent(content, title);
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
const newMigrationPath = path.join(__dirname, '../lib/supabase/migrations/109_restructure_module_content.sql');
let newMigration = `-- Restructure module content with standardized headers
-- Generated: ${new Date().toISOString()}
-- This will update all module content to include:
-- - Why This Matters
-- - The Mistake Most Reps Make  
-- - The Framework
-- - Example Scripts

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
console.log(`\nNext steps:`);
console.log(`1. Review the migration file`);
console.log(`2. Test on a development database`);
console.log(`3. Run your migration command`);

