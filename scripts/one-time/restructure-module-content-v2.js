#!/usr/bin/env node

/**
 * Script to restructure module content to include structured headers
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
  
  let output = `# ${title}\n**Estimated read: 2 minutes**\n\n`;
  
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

inserts.forEach((insertSQL) => {
  // Extract title, slug, category, display_order, estimated_minutes
  const titleMatch = insertSQL.match(/'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),/);
  if (!titleMatch) return;
  
  const title = titleMatch[1];
  const slug = titleMatch[2];
  const category = titleMatch[3];
  const displayOrder = parseInt(titleMatch[4]);
  const estimatedMinutes = parseInt(titleMatch[5]);
  
  // Find content - it's between the estimated_minutes and is_published
  // Content starts after estimated_minutes and ends before the closing quote before true/false
  const contentStartMarker = `${estimatedMinutes},\n  `;
  const contentStart = insertSQL.indexOf(contentStartMarker);
  
  if (contentStart === -1) return;
  
  // Find where content ends - look for the pattern: ',\n  true) or ',\n  false)
  const contentEndPattern = /',\s*\n\s*(true|false)\)/;
  const contentEndMatch = insertSQL.match(contentEndPattern);
  
  if (!contentEndMatch) return;
  
  const contentEnd = insertSQL.indexOf(contentEndMatch[0]);
  let content = insertSQL.substring(contentStart + contentStartMarker.length, contentEnd);
  
  // Remove leading/trailing quotes and newlines
  content = content.trim();
  if (content.startsWith("'")) content = content.substring(1);
  if (content.endsWith("'")) content = content.substring(0, content.length - 1);
  
  // Unescape SQL quotes ('' becomes ')
  content = content.replace(/''/g, "'");
  
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
});

console.log(`\nSuccessfully processed ${modules.length} modules\n`);

// Generate migration
const newMigrationPath = path.join(__dirname, '../lib/supabase/migrations/109_restructure_module_content.sql');
let newMigration = `-- Restructure module content with standardized headers
-- Generated: ${new Date().toISOString()}

BEGIN;

`;

modules.forEach((module) => {
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
console.log(`\nReview the file and run your migration command when ready.`);
