const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(/export interface CompromisoFuncional {[\s\S]*?}/, 
`export interface CompromisoFuncional {
  area: string;
  competencia: string;
  peso: number;
  contribucion: string;
  criterios: string[];
  evidencias: string[];
  puntaje?: number;
}`);

c = c.replace(/export interface CompromisoComportamental {[\s\S]*?}/,
`export interface CompromisoComportamental {
  competencia: string;
  criterios: string[];
  evidencias: string[];
  puntaje?: number;
}`);

c = c.replace('evalFechaConcertacion?: string;', `evalFechaConcertacion?: string;
  evalFechaInicio?: string;
  evalFechaFinal?: string;
  evalDiasIncapacidad?: number;
  evalDiasValorados?: number;
  evalCompetenciasMejorar?: string;
  evalEstrategiasMejorar?: string;`);

c = c.replace(/import { generarAnexo5Word } from '\.\.\/utils\/exportAnexo5';\n/, '');
c = c.replace(/import { generarAnexo5Word } from '\.\.\/utils\/exportAnexo5';\r\n/, '');
c = c.replace("import { generarAnexo5Word } from '../utils/exportAnexo5';", "");

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
