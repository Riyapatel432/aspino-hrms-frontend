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

    // We can replace the <Input type="date"... block
    // <Input[\s\S]*?type="date"[\s\S]*?value=\{([^}]+)\}[\s\S]*?onChange=\{\(e\) => ([^=]+)\(\{[\s]*\.\.\.([^,]+),[\s]*([a-zA-Z0-9_]+):[\s]*e\.target\.value[\s]*\}\)\}[\s\S]*?\/>
    
    // Simpler regex for date
    content = content.replace(/<Input\s+type="date"(?:[\s\S]*?)value=\{([^}]+)\}(?:[\s\S]*?)onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)\}(?:[\s\S]*?)\/>/g, 
    (match, val, setter, spread, key) => {
        return `<DatePicker date={${val}} setDate={(val) => ${setter}({ ...${spread}, ${key}: val })} />`;
    });
    
    // For attributes in different order e.g. type="date" comes after
    content = content.replace(/<Input\s+(?:[^>]*?)type="date"(?:[^>]*?)value=\{([^}]+)\}(?:[^>]*?)onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)\}(?:[^>]*?)\/>/g, 
    (match, val, setter, spread, key) => {
        return `<DatePicker date={${val}} setDate={(val) => ${setter}({ ...${spread}, ${key}: val })} />`;
    });
    
    // Let's use a very generic replace because order of attributes changes.
    // It's safer to just match `<Input` until `/>` if it contains `type="date"`
    
    let regexDate = /<Input([^>]*?)type="date"([^>]*?)\/>/g;
    content = content.replace(regexDate, (match) => {
        let valMatch = match.match(/value=\{([^}]+)\}/);
        let onChangeMatch = match.match(/onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)\}/);
        if (valMatch && onChangeMatch) {
            return `<DatePicker date={${valMatch[1]}} setDate={(val) => ${onChangeMatch[1]}({ ...${onChangeMatch[2]}, ${onChangeMatch[3]}: val })} />`;
        }
        return match;
    });
    
    let regexDate2 = /<Input([^>]*?)\/>/g;
    content = content.replace(regexDate2, (match) => {
        if(match.includes('type="date"')) {
            let valMatch = match.match(/value=\{([^}]+)\}/);
            let onChangeMatch = match.match(/onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)\}/);
            if (valMatch && onChangeMatch) {
                return `<DatePicker date={${valMatch[1]}} setDate={(val) => ${onChangeMatch[1]}({ ...${onChangeMatch[2]}, ${onChangeMatch[3]}: val })} />`;
            }
        }
        if(match.includes('type="time"')) {
            let valMatch = match.match(/value=\{([^}]+)\}/);
            let onChangeMatch = match.match(/onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*e\.target\.value\s*\}\)\}/);
            if (valMatch && onChangeMatch) {
                return `<TimePicker time={${valMatch[1]}} setTime={(val) => ${onChangeMatch[1]}({ ...${onChangeMatch[2]}, ${onChangeMatch[3]}: val })} />`;
            }
        }
        return match;
    });

    if (content.includes('<DatePicker') && !oldContent.includes('<DatePicker')) {
      content = content.replace(/import \{ Input \}/, `import { DatePicker } from "@/components/ui/date-picker";\nimport { Input }`);
    }

    if (content.includes('<TimePicker') && !oldContent.includes('<TimePicker')) {
      content = content.replace(/import \{ Input \}/, `import { TimePicker } from "@/components/ui/time-picker";\nimport { Input }`);
    }

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated Date/Time Pickers in ${file}`);
    }
  }
}
