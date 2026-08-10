const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// 1. Fix Labels
code = code.replace(
  /<span>\{p === 1 \? 'S1 \(Concertación\)' : \S\$\{p\} \(Evidencia\)\\}<\/span>/g,
  <span>{p === 1 ? 'S1 (Concertación)' : p === 4 ? 'S4 (Evaluación Final)' : \S\ (Evidencia)\}</span>
);

code = code.replace(
  /selectedPeriod === 1 \? 'Seguimiento 1 \(Concertación\)' : \Seguimiento \$\{selectedPeriod\} \(Evidencia \$\{selectedPeriod\}\)\/g,
  selectedPeriod === 1 ? 'Seguimiento 1 (Concertación)' : selectedPeriod === 4 ? 'Evaluación Final (Anexo 6)' : \Seguimiento \ (Evidencia \)\`
);

code = code.replace(
  /selectedEvalForInspection\.periodo === 1 \? 'Seguimiento 1 \(Concertación\)' : \Seguimiento \$\{selectedEvalForInspection\.periodo\} \(Evidencia \$\{selectedEvalForInspection\.periodo\}\)\/g,
  selectedEvalForInspection.periodo === 1 ? 'Seguimiento 1 (Concertación)' : selectedEvalForInspection.periodo === 4 ? 'Evaluación Final (Anexo 6)' : \Seguimiento \ (Evidencia \)\`
);

// 2. Inject P4 Teacher UI
let p4Code = fs.readFileSync('test_output.txt', 'utf8');
const searchString = '{selectedPeriod >= 2 && activeEvaluacion && (';
const replaceString = p4Code + '\n          {(selectedPeriod === 2 || selectedPeriod === 3) && activeEvaluacion && (';
if (code.includes(searchString)) {
    code = code.replace(searchString, replaceString);
} else {
    console.error('Could not find P4 injection point');
}

// 3. Add Import and handler for Export Anexo 6
const importToAdd = "import { generarAnexo6Word } from '../utils/exportAnexo6';\n";
if (!code.includes("import { generarAnexo6Word }")) {
    code = code.replace("import { generarActaGeneralWord }", "import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';\n" + importToAdd);
}

const functionToAdd =   const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    generarAnexo6Word(evalDoc, teacher, "INSTITUCIÓN EDUCATIVA ALVERNIA", "");
  };\n\n;

if (!code.includes("const handleExportWordAnexo6")) {
    code = code.replace("const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {", functionToAdd + "  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {");
}

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Done!');
