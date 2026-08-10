const fs = require('fs');
let lines = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8').split('\n');

lines.splice(6188, 11);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', lines.join('\n'));
