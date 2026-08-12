const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');
c = c.replace('<div className="flex items-center justify-end gap-3 pt-2"><div className="flex items-center justify-end gap-3 pt-2">', '<div className="flex items-center justify-end gap-3 pt-2">');
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c, 'utf8');
console.log('Fixed duplicate div');
