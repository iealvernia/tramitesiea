const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');
let updateScript = fs.readFileSync('update_teacher_anexo6.cjs', 'utf8');
let parts = updateScript.split('const replacementLines = `);
let p4Code = parts[1].split('`.split')[0];
code = code.replace(
  '{selectedPeriod >= 2 && activeEvaluacion && (',
  p4Code + '\n{((selectedPeriod === 2 || selectedPeriod === 3)) && activeEvaluacion && ('
);
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Successfuly Injected P4Code');
