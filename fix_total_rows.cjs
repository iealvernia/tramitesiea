const fs = require('fs');
let c = fs.readFileSync('src/components/CajaMenorPanel.tsx', 'utf8');

c = c.replace(
  'const totalRowIng = [{ v: "Total INGRESOS", s: { font: { bold: true } } }];',
  'const totalRowIng: any[] = [{ v: "Total INGRESOS", s: { font: { bold: true } } }];'
);

c = c.replace(
  'const totalRowGas = [{ v: "Total GASTOS", s: { font: { bold: true } } }];',
  'const totalRowGas: any[] = [{ v: "Total GASTOS", s: { font: { bold: true } } }];'
);

fs.writeFileSync('src/components/CajaMenorPanel.tsx', c);
