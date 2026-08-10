const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

code = code.replace(
  'selectedPeriod >= 2 && activeEvaluacion && (',
  `\${fs.readFileSync('update_teacher_anexo6.cjs', 'utf8').split('const replacementLines = \\`')[1].split('\\`.split')[0]}
          {(selectedPeriod === 2 || selectedPeriod === 3) && activeEvaluacion && (`
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Teacher Period 4 UI Injected');
