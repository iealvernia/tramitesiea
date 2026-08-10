const fs = require('fs');
let lines = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8').split('\n');

lines[5222] = "                      <span>{p === 1 ? 'S1 (Concertaci\\u00f3n)' : p === 4 ? 'S4 (Evaluaci\\u00f3n Final)' : \\S\ (Evidencia)\\}</span>";

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', lines.join('\n'));
