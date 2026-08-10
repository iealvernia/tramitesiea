const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

code = code.replace(/export interface CompromisoComportamental \{\r?\n  competencia: string;\r?\n  evidencias: string;\r?\n\}/g, "export interface CompromisoComportamental \{\n  competencia: string;\n  evidencias: string;\n  puntaje?: number;\n  puntaje2?: number;\n\}");

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Fixed CompromisoComportamental');
