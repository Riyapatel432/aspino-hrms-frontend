const fs = require('fs');
const path = require('path');

const filesToProcess = [
  "src/app/dashboard/recruitment/page.js",
  "src/app/dashboard/attendance-leave/page.js",
  "src/app/dashboard/leave-master/page.js",
  "src/app/dashboard/performance-training/page.js",
  "src/app/dashboard/exit/page.js",
  "src/app/dashboard/onboarding/page.js"
];

for (const file of filesToProcess) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let oldContent = content;

    // Fix the syntax error: setDate={(val) => set...({ ..., key: val} />
    // It should be setDate={(val) => set...({ ..., key: val })} />
    // So we look for `val} />` and replace with `val })} />` when it's preceded by `...` and `:` inside a setDate.

    content = content.replace(/setDate=\{\(val\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+):\s*val\s*\}(?!\))([\s]*)\/>/g, 
    (match, setter, spread, key, spaces) => {
        return `setDate={(val) => ${setter}({ ...${spread}, ${key}: val })}${spaces}/>`;
    });

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax errors in ${file}`);
    }
  }
}
