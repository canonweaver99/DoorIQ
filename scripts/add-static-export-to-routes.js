const fs = require('fs');
const path = require('path');

// Recursively find all route.ts files
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all route.ts files in the app/api directory
const appApiDir = path.join(__dirname, '..', 'app', 'api');
const routeFiles = findRouteFiles(appApiDir);

console.log(`Found ${routeFiles.length} route files`);

routeFiles.forEach(filePath => {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file already has the export statement in the right place (at top level)
  if (content.match(/^export const dynamic = ["']force-static["'];?\s*$/m)) {
    console.log(`Skipping ${relativePath} - already has dynamic export`);
    return;
  }
  
  // Remove any incorrectly placed export statements
  content = content.replace(/\n\s*export const dynamic = ["']force-static["'];?\s*\n/g, '\n');
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    // Find the next non-empty line after imports (to handle blank lines)
    let insertIndex = lastImportIndex + 1;
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }
    
    // Insert the export statement
    lines.splice(insertIndex, 0, 'export const dynamic = "force-static";');
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${relativePath}`);
  } else {
    // If no imports, add at the beginning
    const newContent = 'export const dynamic = "force-static";\n\n' + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${relativePath} (no imports found)`);
  }
});

console.log('Done!');


