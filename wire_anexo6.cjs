const fs = require('fs'); 
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace('import { checkIsHabilitated }', "import { generarAnexo6Word } from '../utils/exportAnexo6';\nimport { checkIsHabilitated }");

const searchFunc = '  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {';
const replaceFunc = `  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    generarAnexo6Word(evalDoc, teacher, institutionName, customLogo);
  };
  
  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {`;
c = c.replace(searchFunc, replaceFunc);
c = c.split('window.handleExportWordAnexo6?.').join('handleExportWordAnexo6');

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Wired up Anexo 6 Export');
