const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(
  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    generarAnexo6Word(evalDoc, teacher, institutionName, customLogo);
  };
  
  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {,
  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
);

// If the above replace didn't work because of indentation or newlines, let's use regex
c = c.replace(/  const handleExportWordAnexo6 = \(evalDoc: Evaluacion1278, teacher: DocenteEvaluacion\) => {\s+const customLogo = localStorage\.getItem\('iea_custom_logo'\) \|\| '';\s+generarAnexo6Word\(evalDoc, teacher, institutionName, customLogo\);\s+};\s+const handleExportWordAnexo6 = \(evalDoc: Evaluacion1278, teacher: DocenteEvaluacion\) => {/, '  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {');

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
