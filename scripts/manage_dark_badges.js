const fs = require('fs');
const path = require('path');

const colors = ['emerald', 'red', 'amber', 'blue', 'sky', 'slate', 'gray', 'purple', 'indigo'];

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let oldContent = content;

      colors.forEach(color => {
        // Fix background colors (50 or 100)
        // Match bg-color-50 or bg-color-100 that is NOT followed by dark:bg-
        const bgRegex = new RegExp(`bg-${color}-(?:50|100)(?!\\s+dark:bg-)`, 'g');
        content = content.replace(bgRegex, `$& dark:bg-${color}-500/10`);

        // Fix text colors (600, 700, 800)
        // Match text-color-600 or 700 or 800 that is NOT followed by dark:text-
        const textRegex = new RegExp(`text-${color}-(?:600|700|800)(?!\\s+dark:text-)`, 'g');
        content = content.replace(textRegex, `$& dark:text-${color}-400`);

        // Fix border colors (50, 100, 200)
        const borderRegex = new RegExp(`border-${color}-(?:50|100|200)(?!\\s+dark:border-)`, 'g');
        content = content.replace(borderRegex, `$& dark:border-${color}-500/20`);
      });

      if (oldContent !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Added dark badge classes to ${fullPath.replace(__dirname, '')}`);
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
