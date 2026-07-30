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

    // DatePicker Replacement
    // Looks for: <Input type="date" required value={...} onChange={(e) => set...({ ..., date: e.target.value })} />
    // It could be multiline. So let's use regex that matches standard inputs.
    content = content.replace(/<Input([^>]*?)type="date"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\) => ([^=]+)=\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)([^}]*)\}([^>]*?)\/>/g, 
    (match, p1, p2, val, p4, setter, spread, key, p8, p9) => {
        return `<DatePicker date={${val}} setDate={(val) => ${setter}={ ...${spread}, ${key}: val })${p8}} />`;
    });

    // Handle generic date input
    content = content.replace(/<Input([^>]*?)type="date"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\) => ([^(]+)\(e\.target\.value\)\}([^>]*?)\/>/g, 
    (match, p1, p2, val, p4, setter, p6) => {
        return `<DatePicker date={${val}} setDate={${setter}} />`;
    });

    // TimePicker Replacement
    content = content.replace(/<Input([^>]*?)type="time"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\) => ([^=]+)=\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)([^}]*)\}([^>]*?)\/>/g, 
    (match, p1, p2, val, p4, setter, spread, key, p8, p9) => {
        return `<TimePicker time={${val}} setTime={(val) => ${setter}={ ...${spread}, ${key}: val })${p8}} />`;
    });

    // Handle generic time input
    content = content.replace(/<Input([^>]*?)type="time"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\) => ([^(]+)\(e\.target\.value\)\}([^>]*?)\/>/g, 
    (match, p1, p2, val, p4, setter, p6) => {
        return `<TimePicker time={${val}} setTime={${setter}} />`;
    });

    // Make sure we inject imports if they are needed
    if (content.includes('<DatePicker') && !content.includes('DatePicker')) {
      // Actually regex condition above prevents this, let's just do simple checks
      const importDate = `import { DatePicker } from "@/components/ui/date-picker";\n`;
      content = content.replace(/import \{ Input \}/, `${importDate}import { Input }`);
    }

    if (content.includes('<TimePicker') && !content.includes('TimePicker')) {
      const importTime = `import { TimePicker } from "@/components/ui/time-picker";\n`;
      content = content.replace(/import \{ Input \}/, `${importTime}import { Input }`);
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated Date/Time Pickers in ${file}`);
    }
  }
}
