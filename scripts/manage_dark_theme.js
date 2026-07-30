const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let oldContent = content;

      // 1. bg-white -> bg-white dark:bg-slate-900
      // Only replace if it doesn't already have dark:bg-
      content = content.replace(/bg-white(?!\s+dark:bg-)/g, 'bg-white dark:bg-slate-900');

      // 2. border-slate-200 -> border-slate-200 dark:border-slate-800
      content = content.replace(/border-slate-200(?!\s+dark:border-)/g, 'border-slate-200 dark:border-slate-800');
      
      // border-slate-100 -> border-slate-100 dark:border-slate-800
      content = content.replace(/border-slate-100(?!\s+dark:border-)/g, 'border-slate-100 dark:border-slate-800');

      // 3. text-slate-700 -> text-slate-700 dark:text-slate-200
      content = content.replace(/text-slate-700(?!\s+dark:text-)/g, 'text-slate-700 dark:text-slate-200');

      // 4. text-slate-800 -> text-slate-800 dark:text-slate-200
      content = content.replace(/text-slate-800(?!\s+dark:text-)/g, 'text-slate-800 dark:text-slate-200');

      // 5. text-slate-600 -> text-slate-600 dark:text-slate-300
      content = content.replace(/text-slate-600(?!\s+dark:text-)/g, 'text-slate-600 dark:text-slate-300');

      // 6. bg-slate-50 -> bg-slate-50 dark:bg-slate-900/50
      content = content.replace(/bg-slate-50(?!\s+dark:bg-)/g, 'bg-slate-50 dark:bg-slate-900/50');

      // 7. text-slate-900 -> text-slate-900 dark:text-white
      content = content.replace(/text-slate-900(?!\s+dark:text-)/g, 'text-slate-900 dark:text-white');
      
      // 8. text-black -> text-black dark:text-white
      content = content.replace(/text-black(?!\s+dark:text-)/g, 'text-black dark:text-white');

      if (oldContent !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Added dark theme classes to ${fullPath.replace(__dirname, '')}`);
      }
    }
  }
}

const dashboardDir = path.join(__dirname, '..', 'src', 'app', 'dashboard');
const componentsDir = path.join(__dirname, '..', 'src', 'components');

console.log("Processing Dashboard...");
processDirectory(dashboardDir);
console.log("Processing Components...");
processDirectory(componentsDir);
