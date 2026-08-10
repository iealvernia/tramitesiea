const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(/\{\[1, 2, 3\]\.map\(p => \{/g, '{[1, 2, 3, 4].map(p => {');

c = c.replace(
  /<span>\{p === 1 \? 'S1 \(Concertaci[óo\uFFFD]n\)' : \S\$\{p\} \(Evidencia\)\\}<\/span>/,
  "<span>{p === 1 ? 'S1 (Concertación)' : p === 4 ? 'S4 (Evaluación Final)' : S\ (Evidencia)}</span>"
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
