const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

code = code.replace(
  /<span>\{p === 1 \? 'S1 \\(Concertaci\\u00f3n\\)' : `S\$\\p}\\(\\Evidencia\\)`\}</span>/g,
  `<span>{p === 1 ? 'S1 (Concertaci\u00f3n)' : p === 4 ? 'S4 (Evaluaci\u00f3n Final)' : \`S\${p} (Evidencia)\`}</span>`
);

code = code.replace(
  /selectedPeriod === 1 \? 'Seguimiento 1 \\(Concertaci\u00f3n\\)' : `Seguimiento \$\\selectedPeriod} \\(Evidencia \$\\selectedPeriod}\\)`/g,
  `selectedPeriod === 1 ? 'Seguimiento 1 (Concertaci\u00f3n)' : selectedPeriod === 4 ? 'Evaluaci\u00f3n Final (Anexo 6)' : \`Seguimiento \${selectedPeriod} (Evidencia \${selectedPeriod})\`'
);

code = code.replace(
  /selectedEvalForInspection.periodo === 1 \? 'Seguimiento 1 \\(Concertaci\\u00f3n\\)' : `Seguimiento \$\|selectedEvalForInspection.periodo} \\(Evidencia \$\\selectedEvalForInspection.periodo}\\)`/ig,
  `selectedEvalForInspection.periodo === 1 ? 'Seguimiento 1 (Concertaci\u00f3n)' : selectedEvalForInspection.periodo === 4 ? 'Evaluaci\u00f3n Final (Anexo 6)' : \`Seguimiento \${selectedEvalForInspection.periodo} (Evidencia ${selectedEvalForInspection.periodo})\`a
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Replaced labels');
