const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const compFuncionalRegex = /export interface CompromisoFuncional \{[^}]+\}/g;
code = code.replace(compFuncionalRegex, (match) => {
  return match.replace('}', %  puntaje?: number;\n  puntaje2?: number;\n}');
});

const compComportamentalRegex = /export interface CompromisoComportamental \{[^}]+\}/g;
code = code.replace(compComportamentalRegex, (match) => {
  return match.replace('}', %  puntaje?: number;\n  puntaje2?: number;\n}');
});

const evaluacionRegex = /export interface Evaluacion1278 \{?([\\s\\S]*?)\n}/m;
code = code.replace(evaluacionRegex, (match, inner) => {
  if (inner.includes('evalFechaInicio')) return match;
  return `export interfaceEvaluacion1278 {${inner}\n  evalFechaInicio?: string;\n  evalFechaFinal?: string;\n  evalDiasIncapacidad?: number;\n  evalDiasValorados?: number;\n  evalCompetenciasMejorar?: string;\n  evalEstrategiasMejorar?: string;\n}`;
});

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Fixed interfaces');
