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
    
    // Update SelectTrigger className to match GatePass theme
    content = content.replace(/<SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950">/g, '<SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">');
    
    // Replace native <input type="checkbox" ... > with <Checkbox /> ?
    // Wait, GatePass uses <Input /> or standard checkboxes. Let's just fix native text inputs.
    // Replace native <input with Shadcn <Input
    content = content.replace(/<input\b([^>]*)>/g, '<Input$1>');
    
    if (content.includes('<Input') && !content.includes('import { Input }')) {
      const importInput = `import { Input } from "@/components/ui/input";\n`;
      content = content.replace(/import \{ Button \}/, `${importInput}import { Button }`);
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated theme classes and inputs in ${file}`);
    }
  }
}
