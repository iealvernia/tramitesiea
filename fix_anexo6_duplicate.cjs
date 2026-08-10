const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(
`  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    generarAnexo6Word(evalDoc, teacher, institutionName, customLogo);
  };
  
  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {`,
`  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {`
);

c = c.replace(
`\${customLogo ? \\\`<img src="\${customLogo}" width="70" />\\\` : ''}`,
`\${customLogo ? '<img src="' + customLogo + '" width="70" />' : ''}`
);

c = c.replace(
`\${activeRectorSignature ? \\\`<img src="\${activeRectorSignature}" width="150" /><br/>\\\` : '<br/><br/><br/>'}`,
`\${activeRectorSignature ? '<img src="' + activeRectorSignature + '" width="150" /><br/>' : '<br/><br/><br/>'}`
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
