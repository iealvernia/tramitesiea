const fs = require('fs');
const lines = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App_restored.tsx', 'utf8').split('\n');

const mainIndex = lines.findIndex(l => l.includes('<main '));

let startMantenimiento1 = -1;
let endMantenimiento2 = -1;

for (let i = mainIndex; i < lines.length; i++) {
  if (lines[i].includes('{activeTab === "novedades" && (')) {
    startMantenimiento1 = i;
    break;
  }
}

for (let i = startMantenimiento1; i < lines.length; i++) {
  if (lines[i].includes('{activeTab === "reportes" && <ReportsPanel')) {
    endMantenimiento2 = i;
    break;
  }
}

console.log('startMantenimiento1:', startMantenimiento1);
console.log('endMantenimiento2:', endMantenimiento2);
