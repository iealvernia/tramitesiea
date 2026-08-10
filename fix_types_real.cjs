const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
/export interface CompromisoFuncional \{[\s\S]*?porcentaje\?: number;\n\}/g,
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

fs.writeFileSync('src/types.ts', code);
console.log('Fixed interfaces in src/types.ts');
