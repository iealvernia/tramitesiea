const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// Add import
const importToAdd = "import { generarAnexo6Word } from '../utils/exportAnexo6';\n";
if (!code.includes("import { generarAnexo6Word }")) {
    code = code.replace("import { generarActaGeneralWord }", "import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';\n" + importToAdd);
}

// Add handleExportWordAnexo6
const functionToAdd =   const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    generarAnexo6Word(evalDoc, teacher, "INSTITUCIÓN EDUCATIVA ALVERNIA", "");
  };\n\n;

if (!code.includes("const handleExportWordAnexo6")) {
    code = code.replace("const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {", functionToAdd + "  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {");
}

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Added handleExportWordAnexo6');
