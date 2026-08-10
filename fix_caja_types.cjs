const fs = require('fs');
let c = fs.readFileSync('src/components/CajaMenorPanel.tsx', 'utf8');

c = c.replace(
  /const mesesConIngresos = Array\.from\(new Set\(transaccionesDelAno\.filter\(t => t\.tipo_operacion === 'Entrada'\)\.map\(t => t\.mes\)\)\)\.sort\(\(a,b\) => mesesOrder\.indexOf\(a\) - mesesOrder\.indexOf\(b\)\);/g,
  "const mesesConIngresos = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Entrada').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a as string) - mesesOrder.indexOf(b as string)) as string[];"
);

c = c.replace(
  /const mesesConEgresos = Array\.from\(new Set\(transaccionesDelAno\.filter\(t => t\.tipo_operacion === 'Salida'\)\.map\(t => t\.mes\)\)\)\.sort\(\(a,b\) => mesesOrder\.indexOf\(a\) - mesesOrder\.indexOf\(b\)\);/g,
  "const mesesConEgresos = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Salida').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a as string) - mesesOrder.indexOf(b as string)) as string[];"
);

fs.writeFileSync('src/components/CajaMenorPanel.tsx', c);
