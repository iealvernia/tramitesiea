
const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const regex = /compromisosFuncionales: newFuncs,[\s\S]*?compromisosComportamentales: newComps,[\s\S]*?evidenciasAnexo2: \[\],[\s\S]*?evidenciasAnexo5: \[\],[\s\S]*?estado: 'Borrador',[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\)[\s\S]*?};[\s\S]*?setActiveEvaluacion\(newEval\);[\s\S]*?\}[\s\S]*?\]\,/;

if (code.match(regex)) {
   console.log('Match found');
} else {
   console.log('Not found');
}

