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

    // Replace <DatePicker date={...} setDate={...} />
    content = content.replace(/<DatePicker\s+date=\{([^}]+)\}\s+setDate=\{([^}]+)\}\s*\/>/g, 
    (match, p1, p2) => {
        return `<DateTimePicker type="date" date={${p1}} setDate={${p2}} />`;
    });

    // Replace <TimePicker time={...} setTime={...} />
    content = content.replace(/<TimePicker\s+time=\{([^}]+)\}\s+setTime=\{([^}]+)\}\s*\/>/g, 
    (match, p1, p2) => {
        return `<DateTimePicker type="time" date={${p1}} setDate={${p2}} />`;
    });
    
    // Replace <TimePicker time={...} setTime={...} /> (multiline if any)
    content = content.replace(/<TimePicker\s+time=\{([^}]+)\}\s+setTime=\{([^]+?)\}\s*\/>/g, 
    (match, p1, p2) => {
        return `<DateTimePicker type="time" date={${p1}} setDate={${p2}} />`;
    });

    if (content.includes('<DateTimePicker') && !content.includes('import { DateTimePicker }')) {
      content = content.replace(/import \{ DatePicker \}[^\n]+\n/, `import { DateTimePicker } from "@/components/ui/date-time-picker";\n`);
    } else if (content.includes('<DateTimePicker')) {
      content = content.replace(/import \{ DatePicker \}[^\n]+\n/, '');
      content = content.replace(/import \{ TimePicker \}[^\n]+\n/, '');
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated to use DateTimePicker in ${file}`);
    }
  }
}
