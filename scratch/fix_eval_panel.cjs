const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// 1. Labels
code = code.replace(/<span>\{p === 1 \? 'S1 \\(Concertaci(ó|o)n\\)' : `S\$\{p\} \\(Evidencia\\)`\}<\/span>/g, "<span>{p === 1 ? 'S1 (Concertación)' : p === 4 ? 'Anexo 6 (Eval. Final)' : `S${p} (Evidencia)`}</span>");

code = code.replace(/selectedPeriod === 1 \? 'Seguimiento 1 \\(Concertaci(ó|o)n\\)' : `Seguimiento \$\{selectedPeriod\} \\(Evidencia \$\{selectedPeriod\}\\)`/g, "selectedPeriod === 1 ? 'Seguimiento 1 (Concertación)' : selectedPeriod === 4 ? 'Evaluación Final (Anexo 6)' : `Seguimiento ${selectedPeriod} (Evidencia ${selectedPeriod})`");

code = code.replace(/selectedEvalForInspection\.periodo === 1 \? 'Seguimiento 1 \\(Concertaci(ó|o)n\\)' : `Seguimiento \$\{selectedEvalForInspection\.periodo\} \\(Evidencia \$\{selectedEvalForInspection\.periodo\}\\)`/g, "selectedEvalForInspection.periodo === 1 ? 'Seguimiento 1 (Concertación)' : selectedEvalForInspection.periodo === 4 ? 'Evaluación Final (Anexo 6)' : `Seguimiento ${selectedEvalForInspection.periodo} (Evidencia ${selectedEvalForInspection.periodo})`");

// 2. P4 Teacher UI
let p4Code = fs.readFileSync('test_output.txt', 'utf8');
const searchString = '{selectedPeriod >= 2 && activeEvaluacion && (';
const replaceString = p4Code + '\n          {(selectedPeriod === 2 || selectedPeriod === 3) && activeEvaluacion && (';
if (code.includes(searchString)) {
    code = code.replace(searchString, replaceString);
} else {
    console.error('Could not find P4 injection point');
}

// 3. Export import & function
const importToAdd = "import { generarAnexo6Word } from '../utils/exportAnexo6';\n";
if (!code.includes("import { generarAnexo6Word }")) {
    code = code.replace("import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';", "import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';\n" + importToAdd);
}

const functionToAdd = `  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {\n    generarAnexo6Word(evalDoc, teacher, "INSTITUCIÓN EDUCATIVA ALVERNIA", "");\n  };\n\n`;
if (!code.includes('const handleExportWordAnexo6')) {
    code = code.replace("const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {", functionToAdd + "  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {");
}

// 4. Interfaces
code = code.replace(/criterios: string;\r?\n  evidencias: string;\r?\n  porcentaje\?: number;\r?\n\}/g, "criterios: string;\n  evidencias: string;\n  porcentaje?: number;\n  puntaje?: number;\n  puntaje2?: number;\n}");
code = code.replace(/criterios: string;\r?\n  evidencias: string;\r?\n\}/g, "criterios: string;\n  evidencias: string;\n  puntaje?: number;\n  puntaje2?: number;\n}");
code = code.replace(/comportamientos: string;\r?\n  evidencias: string;\r?\n\}/g, "comportamientos: string;\n  evidencias: string;\n  puntaje?: number;\n  puntaje2?: number;\n}");
code = code.replace(/  evaluadorNombre\?: string;\r?\n\}/g, "  evaluadorNombre?: string;\n  evalFechaInicio?: string;\n  evalFechaFinal?: string;\n  evalDiasIncapacidad?: number;\n  evalDiasValorados?: number;\n  evalCompetenciasMejorar?: string;\n  evalEstrategiasMejorar?: string;\n}");
code = code.replace(/  evaluadorCedula: string;\r?\n  fechaConcertacion: string;/g, "  evaluadorCedula: string;\n  evalFechaInicio?: string;\n  evalFechaFinal?: string;\n  evalDiasIncapacidad?: number;\n  evalDiasValorados?: number;\n  evalCompetenciasMejorar?: string;\n  evalEstrategiasMejorar?: string;\n  fechaConcertacion: string;");

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('All changes applied successfully');
