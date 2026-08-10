const fs = require('fs');
let code = fs.readFileSync('src/utils/exportAnexo6.ts', 'utf8');

// Fix Funcionales merge
code = code.replace(
    comps.forEach((c) => {
      const cf = findComp(c.name);
      const row = addRow();
      wsData[row][0] = c.area + "\\n" + getAreaPorc(c.area);
      merge(row, 2, row, 7); wsData[row][2] = c.name;,
    comps.forEach((c) => {
      const cf = findComp(c.name);
      const row = addRow();
      merge(row, 0, row, 1); wsData[row][0] = c.area + "\\n" + getAreaPorc(c.area);
      merge(row, 2, row, 7); wsData[row][2] = c.name;
);

// Fix Comportamentales merge
code = code.replace(
  for(let i=0; i<3; i++) {
    const cc = evalDoc.compromisosComportamentales[i] || { competencia: "", puntaje: 0, puntaje2: 0 };
    const row = addRow();
    merge(row, 0, row, 12); wsData[row][0] = cc.competencia;,
  for(let i=0; i<3; i++) {
    const cc = evalDoc.compromisosComportamentales[i] || { competencia: "", puntaje: 0, puntaje2: 0 };
    const row = addRow();
    merge(row, 0, row, 7); wsData[row][0] = cc.competencia;
    merge(row, 8, row, 12); wsData[row][8] = cc.evidencias || "";
);

// Fix "CENTRAR LOS PORCENTAJES" by adding center alignment logic for score columns (13,14,15,16,17)
// Wait, I can do this in the cell formatting loop.
code = code.replace(
        if (R === 0) {
            style = { ...NORMAL_CELL, font: { sz: 10, name: 'Arial', bold: false }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        },
        if (R === 0) {
            style = { ...NORMAL_CELL, font: { sz: 10, name: 'Arial', bold: false }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        }
        else if (C >= 13 && C <= 17 && R >= startFuncRow) {
            style = { ...NORMAL_CELL, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        }
);

fs.writeFileSync('src/utils/exportAnexo6.ts', code);
