const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

let updateScript = fs.readFileSync('update_teacher_anexo6.cjs', 'utf8');
let p4Code = updateScript.split('const replacementLines = \')[1].split('\;\n\nconst lines')[0];

const searchString = '{selectedPeriod >= 2 && activeEvaluacion && (';
const replaceString = p4Code + '\n          {(selectedPeriod === 2 || selectedPeriod === 3) && activeEvaluacion && (';

code = code.replace(searchString, replaceString);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Successfully injected P4 Code');
