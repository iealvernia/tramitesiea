const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

code = code.replace(
/export interface CompromisoFuncional \[\ls\S]*?porcentaje\?: number;\n\}/g,
`export interface CompromisoFuncional {
  competencia: string;
  area: 'Acad\u00e9mica' | 'Administrativa' | 'Comunitaria';
  contribucion: string;
  criterios: string;
  evidencias: string;
  porcentaje?: number;
  puntaje?: number;
  puntaje2?: number;
}`
);

code = code.replace(
/export interface CompromisoComportamental \{[\s\S]*?evidencias: string;\n\}/g,
`export interface CompromisoComportamental {
  competencia: string;
  evidencias: string;
  puntaje?: number;
  puntaje2?: number;
}`
);

code = code.replace(
/portfolioPdfName\?: string;\n\}/g,
`portfolioPdfName?: string;
  evalFechaInicio?: string;
  evalFechaFinal?: string;
  evalDiasIncapacidad?: number;
  evalDiasValorados?: number;
  evalCompetenciasMejorar?: string;
  evalEstrategiasMejorar?: string;
}`
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Fixed interfaces in EvaluacionDocentePanel.tsx');
