const fs = require('fs');
const path = require('path');

// Recursively find all route.ts files in dynamic directories
function findDynamicRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Check if directory name contains [param] pattern
      if (file.includes('[') && file.includes(']')) {
        const routeFile = path.join(filePath, 'route.ts');
        if (fs.existsSync(routeFile)) {
          fileList.push(routeFile);
        }
      }
      findDynamicRouteFiles(filePath, fileList);
    }
  });
  
  return fileList;
}

// Find all dynamic route.ts files in the app/api directory
const appApiDir = path.join(__dirname, '..', 'app', 'api');
const routeFiles = findDynamicRouteFiles(appApiDir);

console.log(`Found ${routeFiles.length} dynamic route files`);

routeFiles.forEach(filePath => {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file already has generateStaticParams
  if (content.includes('generateStaticParams')) {
    console.log(`Skipping ${relativePath} - already has generateStaticParams`);
    return;
  }
  
  // Find where to insert (after imports and exports, before first function)
  const lines = content.split('\n');
  let insertIndex = -1;
  
  // Find the first export async function or export function
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export async function') || 
        lines[i].trim().startsWith('export function')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex >= 0) {
    // Insert generateStaticParams before the first export function
    lines.splice(insertIndex, 0, '');
    lines.splice(insertIndex, 0, 'export async function generateStaticParams() {');
    lines.splice(insertIndex + 1, 0, '  return []');
    lines.splice(insertIndex + 2, 0, '}');
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${relativePath}`);
  } else {
    console.log(`Warning: Could not find insertion point in ${relativePath}`);
  }
});

console.log('Done!');

