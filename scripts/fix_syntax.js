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
    
    // Find missing closing brace in onValueChange
    // The broken code looks like: onValueChange={(val) => setNewReq({ ...newReq, departmentId: val }>
    // Notice the missing } before >
    content = content.replace(/onValueChange=\{\(val\) => ([^>]+?)(?<!\})\s*>/g, 'onValueChange={(val) => $1}>');
    
    // Specifically, if it ends with `val )>` it should be `val )}}>` ? No!
    // The original was: onChange={(e) => setNewReq({ ...newReq, departmentId: e.target.value })}
    // In my broken replacement, onChgEnd was ` )` because it stopped at the first `}`
    // So it generated: onValueChange={(val) => setNewReq({ ...newReq, departmentId: val )}>
    // Wait, let's look at the actual broken code from the grep output:
    // <Select value={newReq.departmentId} onValueChange={(val) => setNewReq({ ...newReq, departmentId: val }>
    // Wait, the `)` is also missing?! 
    // Let me check grep: onValueChange={(val) => setNewReq({ ...newReq, departmentId: val }>
    // Yes! `val }>` was generated! The `)` is missing and the `}` is missing!
    // Because original was: onChange={(e) => setNewReq({ ...newReq, departmentId: e.target.value })}
    // `([^}]+)` matched `setNewReq({ ...newReq, departmentId: `
    // `e.target.value` matched
    // `([^}]+)` matched ` ` (space)
    // `\}` matched `}`.
    // So `onChgEnd` was just ` `.
    // My replacement: `onValueChange={(val) => \${onChgStart}val\${onChgEnd}}`
    // which evaluated to: `onValueChange={(val) => setNewReq({ ...newReq, departmentId: val }`
    // Wait! Then it appended `>`!
    // But the original still had `)}` after the `}` that was matched!
    // Wait, if it matched `\}` as the first `}`, then the rest of the string `)}` was left in the document as part of `([\s\S]*?)>`?
    // No! `([\s\S]*?)>` matches until the next `>`. So it consumed `)}` and threw it away! Because it was in `afterOnChg`, but I stripped `className` from `afterOnChg`...
    // Let's just fix it by matching the exact broken pattern:
    // `onValueChange={(val) => set([a-zA-Z]+)\(\{ \.\.\.([^,]+), ([a-zA-Z]+): val \}\s*>`
    // Should be: `onValueChange={(val) => set$1({ ...$2, $3: val })}> `
    
    content = content.replace(/onValueChange=\{\(val\) => ([a-zA-Z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([a-zA-Z0-9_]+):\s*val\s*\}\s*>/g, 'onValueChange={(val) => $1({ ...$2, $3: val })}>');

    if (oldContent !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax in ${file}`);
    }
  }
}
