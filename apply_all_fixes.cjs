const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// 1. Labels
code = code.replace(/<span>\{p === 1 \? 'S1 \(Concertación\)' : \S\\\$\{p\} \(Evidencia\)\\}<\/span>/g, "<span>{p === 1 ? 'S1 (Concertación)' : p === 4 ? 'Anexo 6 (Eval. Final)' : \S\ (Evidencia)\}</span>");

code = code.replace(/selectedPeriod === 1 \? 'Seguimiento 1 \(Concertación\)' : \Seguimiento \\\$\{selectedPeriod\} \(Evidencia \\\$\{selectedPeriod\}\)\/g, "selectedPeriod === 1 ? 'Seguimiento 1 (Concertación)' : selectedPeriod === 4 ? 'Evaluación Final (Anexo 6)' : \Seguimiento \ (Evidencia \)\");

code = code.replace(/selectedEvalForInspection\.periodo === 1 \? 'Seguimiento 1 \(Concertación\)' : \Seguimiento \\\$\{selectedEvalForInspection\.periodo\} \(Evidencia \\\$\{selectedEvalForInspection\.periodo\}\)\/g, "selectedEvalForInspection.periodo === 1 ? 'Seguimiento 1 (Concertación)' : selectedEvalForInspection.periodo === 4 ? 'Evaluación Final (Anexo 6)' : \Seguimiento \ (Evidencia \)\");

// 2. P4 Teacher UI
let p4Code = fs.readFileSync('test_output.txt', 'utf8');
const searchString = '{selectedPeriod >= 2 && activeEvaluacion && (';
const replaceString = p4Code + '\n          {(selectedPeriod === 2 || selectedPeriod === 3) && activeEvaluacion && (';
code = code.replace(searchString, replaceString);

// 3. Export import & function
if (!code.includes('import { generarAnexo6Word }')) {
    code = code.replace("import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';", "import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';\nimport { generarAnexo6Word } from '../utils/exportAnexo6';");
}

const functionToAdd =   const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    generarAnexo6Word(evalDoc, teacher, "INSTITUCIÓN EDUCATIVA ALVERNIA", "");
  };\n\n;
if (!code.includes('const handleExportWordAnexo6')) {
    code = code.replace("const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {", functionToAdd + "  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {");
}

// 4. Interfaces
code = code.replace(/criterios: string;\n  evidencias: string;\n\}/g, "criterios: string;\n  evidencias: string;\n  puntaje?: number;\n  puntaje2?: number;\n}");
code = code.replace(/comportamientos: string;\n  evidencias: string;\n\}/g, "comportamientos: string;\n  evidencias: string;\n  puntaje?: number;\n  puntaje2?: number;\n}");
code = code.replace(/  evaluadorNombre\?: string;\n\}/g, "  evaluadorNombre?: string;\n  evalFechaInicio?: string;\n  evalFechaFinal?: string;\n  evalDiasIncapacidad?: number;\n  evalDiasValorados?: number;\n  evalCompetenciasMejorar?: string;\n  evalEstrategiasMejorar?: string;\n}");

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('All changes applied successfully');
