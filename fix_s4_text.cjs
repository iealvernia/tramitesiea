const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(
  /<span>\{p === 1 \? 'S1 \(Concertaci.*?n\)' : \S\$\{p\} \(Evidencia\)\\}<\/span>/,
  "<span>{p === 1 ? 'S1 (Concertación)' : p === 4 ? 'S4 (Evaluación Final)' : \S\$\{p\} (Evidencia)\}</span>"
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
