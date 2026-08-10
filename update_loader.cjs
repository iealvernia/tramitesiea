const fs = require('fs'); 
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');
const searchString = `const newEval: Evaluacion1278 = {
          id: \`\${currentTeacher.cedula}__\${selectedAnio}__\${selectedPeriod}\`,`;
const replaceString = `const evalS1 = evaluaciones.find(e => e.cedula === currentTeacher.cedula && Number(e.periodo) === 1 && (e.anio === selectedAnio || e.anio === undefined));
        const newEval: Evaluacion1278 = {
          id: \`\${currentTeacher.cedula}__\${selectedAnio}__\${selectedPeriod}\`,`;
c = c.replace(searchString, replaceString);
const s2 = `compromisosFuncionales: currentSuggestedFunctionals.map(f => ({ 
            ...f,
            contribucion: '',
            criterios: '',
            evidencias: ''
          })),`;
const r2 = `compromisosFuncionales: selectedPeriod === 4 && evalS1 ? evalS1.compromisosFuncionales.map(c => ({...c, puntaje: 0})) : currentSuggestedFunctionals.map(f => ({ 
            ...f,
            contribucion: '',
            criterios: '',
            evidencias: ''
          })),`;
c = c.replace(s2, r2);
const s3 = `compromisosComportamentales: [
            { competencia: COMPORTAMENTALES_OPCIONES[0], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[1], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[2], evidencias: '' }
          ],`;
const r3 = `compromisosComportamentales: selectedPeriod === 4 && evalS1 ? evalS1.compromisosComportamentales.map(c => ({...c, puntaje: 0})) : [
            { competencia: COMPORTAMENTALES_OPCIONES[0], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[1], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[2], evidencias: '' }
          ],`;
c = c.replace(s3, r3);
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Done');
