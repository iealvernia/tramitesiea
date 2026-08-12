const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(
  'const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && e.observacionesAdmin?.trim());',
  'const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && ((e.historialRetroalimentacion && e.historialRetroalimentacion.length > 0) || e.observacionesAdmin?.trim()));'
);

c = c.replace(
  'const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && e.observacionesAdmin?.trim());',
  'const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && ((e.historialRetroalimentacion && e.historialRetroalimentacion.length > 0) || e.observacionesAdmin?.trim()));'
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c, 'utf8');
console.log('Fixed teacherEvals filter logic');
