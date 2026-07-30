const fs = require('fs');
const path = require('path');

const filesToProcess = [
  "src/app/dashboard/recruitment/page.js",
  "src/app/dashboard/attendance-leave/page.js",
  "src/app/dashboard/leave-master/page.js",
  "src/app/dashboard/performance-training/page.js",
  "src/app/dashboard/exit/page.js"
];

for (const file of filesToProcess) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let oldContent = content;
    
    // Add theme class to SelectContent
    content = content.replace(/<SelectContent>/g, '<SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">');
    
    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated SelectContent in ${file}`);
    }
  }
}
