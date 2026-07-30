const fs = require('fs');
const path = require('path');

const filesToProcess = [
  "src/app/dashboard/attendance-leave/page.js",
  "src/app/dashboard/onboarding/page.js"
];

for (const file of filesToProcess) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let oldContent = content;

    // We replace `<Input type="checkbox" ... onChange={(e) => set({..., key: e.target.checked})} />`
    
    // First, let's just do a simpler replacement for the inner parts of the <Input tag
    content = content.replace(/<Input\s+type="checkbox"\s+checked=\{([^}]+)\}\s+onChange=\{\(e\)\s*=>\s*([^}]+)e\.target\.checked([^}]+)\}\s+className="([^"]+)"\s*\/>/g, 
    (match, checked, setterStart, setterEnd, className) => {
        // We will remove the gigantic styling classes meant for <Input> if they exist
        // Shadcn <Checkbox> has its own internal styling, so passing className="w-4 h-4 rounded text-sky-500" is fine, but maybe we just use standard className
        // Since Checkbox has its own border and size, we can strip some classes or keep them.
        
        // Wait, the match might be slightly different.
        return `<Checkbox\n  checked={${checked}}\n  onCheckedChange={(checked) => ${setterStart}checked${setterEnd}}\n  className="mt-0.5"\n/>`;
    });

    if (content.includes('<Checkbox') && !content.includes('import { Checkbox }')) {
      content = content.replace(/import \{ Input \}/, `import { Checkbox } from "@/components/ui/checkbox";\nimport { Input }`);
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated checkboxes in ${file}`);
    }
  }
}
