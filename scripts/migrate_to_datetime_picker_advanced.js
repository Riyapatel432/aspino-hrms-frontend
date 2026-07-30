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

    // Replace <DatePicker ... />
    // It can be multiline.
    content = content.replace(/<DatePicker[\s\S]*?date=\{([\s\S]*?)\}[\s\S]*?setDate=\{([\s\S]*?)\}[\s\S]*?\/>/g, 
    (match, p1, p2) => {
        return `<DateTimePicker type="date" date={${p1.trim()}} setDate={${p2.trim()}} />`;
    });

    // Replace <TimePicker ... />
    content = content.replace(/<TimePicker[\s\S]*?time=\{([\s\S]*?)\}[\s\S]*?setTime=\{([\s\S]*?)\}[\s\S]*?\/>/g, 
    (match, p1, p2) => {
        return `<DateTimePicker type="time" date={${p1.trim()}} setDate={${p2.trim()}} />`;
    });

    if (content.includes('<DateTimePicker') && !content.includes('import { DateTimePicker }')) {
      content = content.replace(/import \{ DatePicker \}[^\n]+\n/, `import { DateTimePicker } from "@/components/ui/date-time-picker";\n`);
    } else if (content.includes('<DateTimePicker')) {
      content = content.replace(/import \{ DatePicker \}[^\n]+\n/, '');
      content = content.replace(/import \{ TimePicker \}[^\n]+\n/, '');
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated to use DateTimePicker (advanced regex) in ${file}`);
    }
  }
}
