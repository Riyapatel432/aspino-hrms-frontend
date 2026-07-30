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

      // Fix invalid syntax created by previous script
      content = content.replace(/dark:bg-slate-900\/50\/50/g, 'dark:bg-slate-900/50');
      
      // Replace non-standard tailwind colors
      content = content.replace(/dark:bg-slate-850/g, 'dark:bg-slate-800');
      content = content.replace(/dark:bg-slate-850\/60/g, 'dark:bg-slate-800/60');
      content = content.replace(/dark:bg-slate-850\/10/g, 'dark:bg-slate-800/10');
      content = content.replace(/dark:text-slate-350/g, 'dark:text-slate-300');
      content = content.replace(/text-slate-850/g, 'text-slate-800');
      
      // For data-table pagination area, ensure it has a proper solid dark background
      // It currently has `bg-slate-50 dark:bg-slate-900/50` but this might be layered wrong or still look white if something overrides it.
      // Wait, `dark:bg-slate-900` is safer than `/50`. Let's just use `dark:bg-slate-900`.
      content = content.replace(/dark:bg-slate-900\/50(?=\s)/g, 'dark:bg-slate-900');

      if (oldContent !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Cleaned up invalid classes in ${fullPath.replace(__dirname, '')}`);
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
