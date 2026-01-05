#!/usr/bin/env node

/**
 * Script to restructure module content to include structured headers:
 * - Why This Matters (or Why They Say This)
 * - The Mistake Most Reps Make
 * - The Framework
 * - Example Scripts
 * 
 * Usage: node scripts/restructure-module-content.js
 */

const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, '../lib/supabase/migrations/101_populate_learning_content.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

// Function to restructure a module's content
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
  
  const sections = {
    why: '',
    mistake: '',
    framework: '',
    examples: ''
  };
  
  // Check if content already has structured headers
  const hasWhy = /##\s+(Why|why)/i.test(content);
  const hasMistake = /##\s+(The\s+)?Mistake/i.test(content);
  const hasFramework = /##\s+(The\s+)?Framework/i.test(content);
  const hasExamples = /##\s+Example/i.test(content);
  
  if (hasWhy && hasMistake && hasFramework) {
    // Content already structured, return as-is
    return `# ${title}\n**Estimated read: 2 minutes**\n\n${content}`;
  }
  
  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Identify sections intelligently
  let currentSection = null;
  const sectionContent = {
    why: [],
    mistake: [],
    framework: [],
    examples: []
  };
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    const lowerPara = para.toLowerCase();
    
    // Skip headers
    if (para.startsWith('##')) continue;
    
    // Identify "Why" section - usually first paragraph explaining importance
    if (i === 0 && para.length > 100 && !lowerPara.includes('example') && !lowerPara.includes('script')) {
      sectionContent.why.push(para);
      currentSection = 'why';
      continue;
    }
    
    // Identify "Mistake" section - contains negative language
    if (lowerPara.includes("don't") || lowerPara.includes("never") || 
        lowerPara.includes("mistake") || lowerPara.includes("wrong") ||
        lowerPara.includes("bad") || lowerPara.includes("avoid") ||
        lowerPara.includes("shouldn't") || lowerPara.includes("can't")) {
      sectionContent.mistake.push(para);
      currentSection = 'mistake';
      continue;
    }
    
    // Identify "Examples" section - contains quotes, scripts, or example markers
    if (para.startsWith('>') || lowerPara.includes('example') || 
        lowerPara.includes('script') || para.match(/^\*\*.*:/)) {
      sectionContent.examples.push(para);
      currentSection = 'examples';
      continue;
    }
    
    // Default to framework
    if (!currentSection || currentSection === 'framework') {
      sectionContent.framework.push(para);
      currentSection = 'framework';
    } else {
      // Continue current section
      sectionContent[currentSection].push(para);
    }
  }
  
  // Build output
  let output = `# ${title}\n**Estimated read: 2 minutes**\n\n`;
  
  // Why This Matters
  if (sectionContent.why.length > 0) {
    output += `## Why This Matters\n\n${sectionContent.why.join('\n\n')}\n\n`;
  } else if (paragraphs.length > 0 && paragraphs[0].length > 50) {
    // Use first paragraph as "Why"
    output += `## Why This Matters\n\n${paragraphs[0]}\n\n`;
  }
  
  // The Mistake Most Reps Make
  if (sectionContent.mistake.length > 0) {
    output += `## The Mistake Most Reps Make\n\n${sectionContent.mistake.join('\n\n')}\n\n`;
  } else {
    // Try to find mistake content
    const mistakePara = paragraphs.find(p => {
      const lower = p.toLowerCase();
      return (lower.includes("don't") || lower.includes("never") || 
              lower.includes("mistake") || lower.includes("wrong"));
    });
    if (mistakePara) {
      output += `## The Mistake Most Reps Make\n\n${mistakePara}\n\n`;
    }
  }
  
  // The Framework
  if (sectionContent.framework.length > 0) {
    output += `## The Framework\n\n${sectionContent.framework.join('\n\n')}\n\n`;
  } else {
    // Use remaining content
    const frameworkParas = paragraphs.filter((p, idx) => {
      if (idx === 0 && sectionContent.why.length > 0) return false;
      const lower = p.toLowerCase();
      return !lower.includes('example') && !lower.includes('script') && 
             !lower.includes("don't") && !lower.includes("never");
    });
    if (frameworkParas.length > 0) {
      output += `## The Framework\n\n${frameworkParas.join('\n\n')}\n\n`;
    }
  }
  
  // Example Scripts
  if (sectionContent.examples.length > 0) {
    output += `## Example Scripts\n\n${sectionContent.examples.join('\n\n')}\n\n`;
  }
  
  return output.trim();
}

// Extract module INSERT statements more reliably
const moduleBlocks = [];
let currentBlock = '';
let inValues = false;
let quoteDepth = 0;
let inContent = false;

const lines = migrationContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('INSERT INTO learning_modules')) {
    currentBlock = line + '\n';
    inValues = false;
    quoteDepth = 0;
    inContent = false;
    continue;
  }
  
  if (currentBlock) {
    currentBlock += line + '\n';
    
    // Track quote depth for SQL string handling
    const singleQuotes = (line.match(/'/g) || []).length;
    const tripleQuotes = (line.match(/'''/g) || []).length;
    quoteDepth += singleQuotes - (tripleQuotes * 3);
    
    if (line.includes('VALUES')) {
      inValues = true;
    }
    
    if (inValues && line.includes("content,")) {
      inContent = true;
    }
    
    // End of INSERT statement
    if (line.includes('ON CONFLICT') || (line.includes(';') && quoteDepth === 0 && inValues)) {
      moduleBlocks.push(currentBlock);
      currentBlock = '';
      inValues = false;
      quoteDepth = 0;
      inContent = false;
    }
  }
}

console.log(`Found ${moduleBlocks.length} module blocks\n`);

// Parse each module block
const modules = [];
moduleBlocks.forEach((block, index) => {
  // Extract title, slug, category, display_order, estimated_minutes
  const titleMatch = block.match(/'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),/);
  if (!titleMatch) return;
  
  const title = titleMatch[1];
  const slug = titleMatch[2];
  const category = titleMatch[3];
  const displayOrder = parseInt(titleMatch[4]);
  const estimatedMinutes = parseInt(titleMatch[5]);
  
  // Extract content - find content between triple quotes or single quotes
  let contentMatch = block.match(/content,\s*is_published\)\s*VALUES\s*\([^']+'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*('''|')([\s\S]*?)(?:'''|'),\s*(true|false)\)/);
  
  if (!contentMatch) {
    // Try simpler pattern - content is between quotes
    const contentStart = block.indexOf("'''");
    const contentEnd = block.lastIndexOf("'''");
    if (contentStart !== -1 && contentEnd !== -1 && contentEnd > contentStart) {
      const content = block.substring(contentStart + 3, contentEnd).replace(/''/g, "'");
      console.log(`Processing: ${title} (${slug})`);
      
      const restructured = restructureModuleContent(content, title);
      modules.push({
        title,
        slug,
        category,
        displayOrder,
        estimatedMinutes,
        content: restructured,
        originalContent: content
      });
    }
  } else {
    const content = contentMatch[7].replace(/''/g, "'");
    console.log(`Processing: ${title} (${slug})`);
    
    const restructured = restructureModuleContent(content, title);
    modules.push({
      title,
      slug,
      category,
      displayOrder,
      estimatedMinutes,
      content: restructured,
      originalContent: content
    });
  }
});

console.log(`\nSuccessfully processed ${modules.length} modules\n`);

// Generate new migration file with UPDATE statements
const newMigrationPath = path.join(__dirname, '../lib/supabase/migrations/109_restructure_module_content.sql');
let newMigration = `-- Restructure module content with standardized headers
-- This migration updates all module content to include:
-- - Why This Matters (or Why They Say This)
-- - The Mistake Most Reps Make
-- - The Framework
-- - Example Scripts
--
-- Generated: ${new Date().toISOString()}

BEGIN;

`;

modules.forEach((module) => {
  // Escape single quotes for SQL
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
console.log(`✅ Generated new migration file: ${newMigrationPath}`);
console.log(`\nNext steps:`);
console.log(`1. Review the migration file: ${newMigrationPath}`);
console.log(`2. Test it on a development database first`);
console.log(`3. Run: npm run migrate (or your migration command)`);
console.log(`\nNote: The script intelligently reorganizes content. Review each module to ensure accuracy.`);
