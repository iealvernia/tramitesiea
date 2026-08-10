const fs = require('fs');
let code = fs.readFileSync('scratch/exportAnexo6_original.ts', 'utf8');

code = code.replace(/const COLS = 18;/g, 'const COLS = 22;');

// Replace headers for functional competencies
code = code.replace(
  /merge\(headFunc1, 8, headFunc2, 13\); wsData\[headFunc1\]\[8\] = "Contribución Individual";\s+merge\(headFunc1, 14, headFunc1, 17\); wsData\[headFunc1\]\[14\] = "VALORACIÓN";\s+wsData\[headFunc2\]\[14\] = "Puntaje"; wsData\[headFunc2\]\[15\] = "Prom\."; merge\(headFunc2, 16, headFunc2, 17\); wsData\[headFunc2\]\[16\] = "Pond\.";/,
  `merge(headFunc1, 6, headFunc2, 12); wsData[headFunc1][6] = "Contribución Individual";
  merge(headFunc1, 13, headFunc1, 15); wsData[headFunc1][13] = "Primera valoración";
  merge(headFunc1, 16, headFunc1, 18); wsData[headFunc1][16] = "Segunda valoración";
  merge(headFunc1, 19, headFunc1, 21); wsData[headFunc1][19] = "FINAL";
  wsData[headFunc2][13] = "Puntaje"; wsData[headFunc2][14] = "Prom."; wsData[headFunc2][15] = "Pond.";
  wsData[headFunc2][16] = "Puntaje"; wsData[headFunc2][17] = "Prom."; wsData[headFunc2][18] = "Pond.";
  wsData[headFunc2][19] = "Puntaje"; wsData[headFunc2][20] = "Prom."; wsData[headFunc2][21] = "Pond.";`
);

// Replace functional body ranges
code = code.replace(
  /merge\(row, 2, row, 7\); wsData\[row\]\[2\] = c\.name;\s+merge\(row, 8, row, 13\); wsData\[row\]\[8\] = cf\.contribucion \|\| "";\s+wsData\[row\]\[14\] = formatNum\(cf\.puntaje\);\s+funcSum \+= Number\(cf\.puntaje\) \|\| 0;/,
  `merge(row, 2, row, 5); wsData[row][2] = c.name;
    merge(row, 6, row, 12); wsData[row][6] = cf.contribucion || "";
    wsData[row][13] = formatNum(cf.puntaje);
    wsData[row][16] = formatNum(cf.puntaje2);
    let avg = 0;
    if (cf.puntaje !== undefined && cf.puntaje2 !== undefined && !isNaN(cf.puntaje) && !isNaN(cf.puntaje2)) {
      avg = (Number(cf.puntaje) + Number(cf.puntaje2)) / 2;
    } else {
      avg = (Number(cf.puntaje) || 0) + (Number(cf.puntaje2) || 0);
    }
    wsData[row][19] = formatNum(avg);
    funcSum += avg;
    if (cf.puntaje !== undefined && !isNaN(cf.puntaje)) funcSum1 += Number(cf.puntaje);
    if (cf.puntaje2 !== undefined && !isNaN(cf.puntaje2)) funcSum2 += Number(cf.puntaje2);
    if (cf.puntaje !== undefined && !isNaN(cf.puntaje)) countFunc1++;
    if (cf.puntaje2 !== undefined && !isNaN(cf.puntaje2)) countFunc2++;`
);

// We need to initialize funcSum1, funcSum2, countFunc1, countFunc2
code = code.replace(
  /let funcSum = 0;\s+let countFunc = 0;/,
  `let funcSum = 0;
  let countFunc = 0;
  let funcSum1 = 0, countFunc1 = 0;
  let funcSum2 = 0, countFunc2 = 0;`
);

// Function averages
code = code.replace(
  /const avgFunc = countFunc > 0 \? funcSum \/ countFunc : 0;\s+const ponderadoFunc = avgFunc \* 0\.70;\s+merge\(startFuncRow, 0, startFuncRow \+ 3, 1\);\s+merge\(startFuncRow \+ 4, 0, startFuncRow \+ 5, 1\);\s+merge\(startFuncRow \+ 6, 0, startFuncRow \+ 7, 1\);\s+merge\(startFuncRow, 15, startFuncRow \+ 3, 15\); wsData\[startFuncRow\]\[15\] = formatNum\(avgFunc\);\s+merge\(startFuncRow \+ 4, 15, startFuncRow \+ 5, 15\); wsData\[startFuncRow \+ 4\]\[15\] = formatNum\(avgFunc\);\s+merge\(startFuncRow \+ 6, 15, startFuncRow \+ 7, 15\); wsData\[startFuncRow \+ 6\]\[15\] = formatNum\(avgFunc\);\s+merge\(startFuncRow, 16, startFuncRow \+ 7, 17\); wsData\[startFuncRow\]\[16\] = formatNum\(ponderadoFunc\);/,
  `const avgFunc = countFunc > 0 ? funcSum / countFunc : 0;
  const ponderadoFunc = avgFunc * 0.70;
  const avgFunc1 = countFunc1 > 0 ? funcSum1 / countFunc1 : 0;
  const pondFunc1 = avgFunc1 * 0.70;
  const avgFunc2 = countFunc2 > 0 ? funcSum2 / countFunc2 : 0;
  const pondFunc2 = avgFunc2 * 0.70;
  
  merge(startFuncRow, 0, startFuncRow + 3, 1);
  merge(startFuncRow + 4, 0, startFuncRow + 5, 1);
  merge(startFuncRow + 6, 0, startFuncRow + 7, 1);
  
  merge(startFuncRow, 14, startFuncRow + 7, 14); wsData[startFuncRow][14] = formatNum(avgFunc1);
  merge(startFuncRow, 15, startFuncRow + 7, 15); wsData[startFuncRow][15] = formatNum(pondFunc1);
  merge(startFuncRow, 17, startFuncRow + 7, 17); wsData[startFuncRow][17] = formatNum(avgFunc2);
  merge(startFuncRow, 18, startFuncRow + 7, 18); wsData[startFuncRow][18] = formatNum(pondFunc2);
  merge(startFuncRow, 20, startFuncRow + 7, 20); wsData[startFuncRow][20] = formatNum(avgFunc);
  merge(startFuncRow, 21, startFuncRow + 7, 21); wsData[startFuncRow][21] = formatNum(ponderadoFunc);`
);

// Replace headers for behavioral competencies
code = code.replace(
  /merge\(headComp1, 8, headComp2, 13\); wsData\[headComp1\]\[8\] = "Comportamientos";\s+merge\(headComp1, 14, headComp1, 17\); wsData\[headComp1\]\[14\] = "VALORACIÓN";\s+wsData\[headComp2\]\[14\] = "Puntaje"; wsData\[headComp2\]\[15\] = "Prom\."; merge\(headComp2, 16, headComp2, 17\); wsData\[headComp2\]\[16\] = "Pond\.";/,
  `merge(headComp1, 6, headComp2, 12); wsData[headComp1][6] = "Comportamientos";
  merge(headComp1, 13, headComp1, 15); wsData[headComp1][13] = "Primera valoración";
  merge(headComp1, 16, headComp1, 18); wsData[headComp1][16] = "Segunda valoración";
  merge(headComp1, 19, headComp1, 21); wsData[headComp1][19] = "FINAL";
  wsData[headComp2][13] = "Puntaje"; wsData[headComp2][14] = "Prom."; wsData[headComp2][15] = "Pond.";
  wsData[headComp2][16] = "Puntaje"; wsData[headComp2][17] = "Prom."; wsData[headComp2][18] = "Pond.";
  wsData[headComp2][19] = "Puntaje"; wsData[headComp2][20] = "Prom."; wsData[headComp2][21] = "Pond.";`
);

// Behavioral body
code = code.replace(
  /merge\(row, 0, row, 7\); wsData\[row\]\[0\] = c\.name;\s+merge\(row, 8, row, 13\); wsData\[row\]\[8\] = cc\.comportamientos \|\| "";\s+wsData\[row\]\[14\] = formatNum\(cc\.puntaje\);\s+compSum \+= Number\(cc\.puntaje\) \|\| 0;/,
  `merge(row, 0, row, 5); wsData[row][0] = c.name;
    merge(row, 6, row, 12); wsData[row][6] = cc.comportamientos || "";
    wsData[row][13] = formatNum(cc.puntaje);
    wsData[row][16] = formatNum(cc.puntaje2);
    let avgC = 0;
    if (cc.puntaje !== undefined && cc.puntaje2 !== undefined && !isNaN(cc.puntaje) && !isNaN(cc.puntaje2)) {
      avgC = (Number(cc.puntaje) + Number(cc.puntaje2)) / 2;
    } else {
      avgC = (Number(cc.puntaje) || 0) + (Number(cc.puntaje2) || 0);
    }
    wsData[row][19] = formatNum(avgC);
    compSum += avgC;
    if (cc.puntaje !== undefined && !isNaN(cc.puntaje)) compSum1 += Number(cc.puntaje);
    if (cc.puntaje2 !== undefined && !isNaN(cc.puntaje2)) compSum2 += Number(cc.puntaje2);
    if (cc.puntaje !== undefined && !isNaN(cc.puntaje)) countComp1++;
    if (cc.puntaje2 !== undefined && !isNaN(cc.puntaje2)) countComp2++;`
);

// We need to initialize compSum1, compSum2, countComp1, countComp2
code = code.replace(
  /let compSum = 0;\s+let countComp = 0;/,
  `let compSum = 0;
  let countComp = 0;
  let compSum1 = 0, countComp1 = 0;
  let compSum2 = 0, countComp2 = 0;`
);

// Behavior averages
code = code.replace(
  /const avgComp = countComp > 0 \? compSum \/ countComp : 0;\s+const ponderadoComp = avgComp \* 0\.30;\s+merge\(startCompRow, 15, startCompRow \+ 2, 15\); wsData\[startCompRow\]\[15\] = formatNum\(avgComp\);\s+merge\(startCompRow, 16, startCompRow \+ 2, 17\); wsData\[startCompRow\]\[16\] = formatNum\(ponderadoComp\);/,
  `const avgComp = countComp > 0 ? compSum / countComp : 0;
  const ponderadoComp = avgComp * 0.30;
  const avgComp1 = countComp1 > 0 ? compSum1 / countComp1 : 0;
  const pondComp1 = avgComp1 * 0.30;
  const avgComp2 = countComp2 > 0 ? compSum2 / countComp2 : 0;
  const pondComp2 = avgComp2 * 0.30;
  
  merge(startCompRow, 14, startCompRow + 2, 14); wsData[startCompRow][14] = formatNum(avgComp1);
  merge(startCompRow, 15, startCompRow + 2, 15); wsData[startCompRow][15] = formatNum(pondComp1);
  merge(startCompRow, 17, startCompRow + 2, 17); wsData[startCompRow][17] = formatNum(avgComp2);
  merge(startCompRow, 18, startCompRow + 2, 18); wsData[startCompRow][18] = formatNum(pondComp2);
  merge(startCompRow, 20, startCompRow + 2, 20); wsData[startCompRow][20] = formatNum(avgComp);
  merge(startCompRow, 21, startCompRow + 2, 21); wsData[startCompRow][21] = formatNum(ponderadoComp);`
);

// Results section
code = code.replace(
  /merge\(r, 0, r \+ 1, 13\); wsData\[r\]\[0\] = "C\. RESULTADO TOTAL \(100\%\)";\s+merge\(r, 14, r, 15\); wsData\[r\]\[14\] = "Subtotal competencias funcionales";\s+merge\(r, 16, r, 17\); wsData\[r\]\[16\] = formatNum\(ponderadoFunc\);\s+merge\(r \+ 1, 14, r \+ 1, 15\); wsData\[r \+ 1\]\[14\] = "Subtotal competencias comportamentales";\s+merge\(r \+ 1, 16, r \+ 1, 17\); wsData\[r \+ 1\]\[16\] = formatNum\(ponderadoComp\);\s+r \+= 2;\s+merge\(r, 0, r, 13\); wsData\[r\]\[0\] = "CALIFICACIÓN TOTAL = ∑ PONDERACIÓN PROMEDIOS";\s+merge\(r, 14, r, 17\); wsData\[r\]\[14\] = formatNum\(ponderadoFunc \+ ponderadoComp\);/,
  `merge(r, 0, r + 1, 12); wsData[r][0] = "C. RESULTADO TOTAL (100%)";
  merge(r, 13, r, 14); wsData[r][13] = "Subtotal competencias funcionales";
  wsData[r][15] = formatNum(pondFunc1);
  merge(r, 16, r, 17); wsData[r][16] = "Subtotal funcionales";
  wsData[r][18] = formatNum(pondFunc2);
  merge(r, 19, r, 20); wsData[r][19] = "Subtotal funcionales";
  wsData[r][21] = formatNum(ponderadoFunc);

  merge(r + 1, 13, r + 1, 14); wsData[r + 1][13] = "Subtotal competencias comportamentales";
  wsData[r + 1][15] = formatNum(pondComp1);
  merge(r + 1, 16, r + 1, 17); wsData[r + 1][16] = "Subtotal comportamentales";
  wsData[r + 1][18] = formatNum(pondComp2);
  merge(r + 1, 19, r + 1, 20); wsData[r + 1][19] = "Subtotal comportamentales";
  wsData[r + 1][21] = formatNum(ponderadoComp);
  
  r += 2;
  merge(r, 0, r, 14); wsData[r][0] = "CALIFICACIÓN TOTAL = ∑ PONDERACIÓN PROMEDIOS";
  wsData[r][15] = formatNum(pondFunc1 + pondComp1);
  merge(r, 16, r, 17); wsData[r][16] = "CALIFICACIÓN TOTAL";
  wsData[r][18] = formatNum(pondFunc2 + pondComp2);
  merge(r, 19, r, 20); wsData[r][19] = "CALIFICACIÓN TOTAL";
  wsData[r][21] = formatNum(ponderadoFunc + ponderadoComp);`
);

// Escala rating section
code = code.replace(
  /merge\(r, 0, r, 2\); wsData\[r\]\[0\] = "VALORACIÓN FINAL DEL DESEMPEÑO";\s+merge\(r, 3, r, 6\); wsData\[r\]\[3\] = "NO SATISFACTORIO";\s+merge\(r, 7, r, 13\); wsData\[r\]\[7\] = "SATISFACTORIO";\s+merge\(r, 14, r, 17\); wsData\[r\]\[14\] = "SOBRESALIENTE";\s+r\+\+;\s+merge\(r, 3, r, 6\); wsData\[r\]\[3\] = "Puntajes entre 1 y 59";\s+merge\(r, 7, r, 13\); wsData\[r\]\[7\] = "Puntajes entre 60 y 89";\s+merge\(r, 14, r, 17\); wsData\[r\]\[14\] = "Puntajes entre 90 y 100";\s+r\+\+;\s+const total = ponderadoFunc \+ ponderadoComp;\s+let isNoSat = total >= 1 && total <= 59;\s+let isSat = total >= 60 && total <= 89;\s+let isSob = total >= 90 && total <= 100;\s+merge\(r, 3, r, 6\); wsData\[r\]\[3\] = isNoSat \? "X" : "";\s+merge\(r, 7, r, 13\); wsData\[r\]\[7\] = isSat \? "X" : "";\s+merge\(r, 14, r, 17\); wsData\[r\]\[14\] = isSob \? "X" : "";/,
  `merge(r, 0, r, 4); wsData[r][0] = "VALORACIÓN FINAL DEL DESEMPEÑO";
  merge(r, 5, r, 9); wsData[r][5] = "NO SATISFACTORIO";
  merge(r, 10, r, 15); wsData[r][10] = "SATISFACTORIO";
  merge(r, 16, r, 21); wsData[r][16] = "SOBRESALIENTE";
  r++;
  merge(r, 5, r, 9); wsData[r][5] = "Puntajes entre 1 y 59";
  merge(r, 10, r, 15); wsData[r][10] = "Puntajes entre 60 y 89";
  merge(r, 16, r, 21); wsData[r][16] = "Puntajes entre 90 y 100";
  r++;
  const total = ponderadoFunc + ponderadoComp;
  let isNoSat = total >= 1 && total <= 59;
  let isSat = total >= 60 && total <= 89;
  let isSob = total >= 90 && total <= 100;
  merge(r, 5, r, 9); wsData[r][5] = isNoSat ? "X" : "";
  merge(r, 10, r, 15); wsData[r][10] = isSat ? "X" : "";
  merge(r, 16, r, 21); wsData[r][16] = isSob ? "X" : "";`
);

// III. Perfil de competencias
code = code.replace(
  /merge\(r, 0, r, 17\); wsData\[r\]\[0\] = "III. PERFIL DE COMPETENCIAS DEL DOCENTE";\s+r\+\+;\s+merge\(r, 0, r, 17\); wsData\[r\]\[0\] = "Competencias objeto de mejoramiento";\s+r\+\+;\s+merge\(r, 0, r \+ 3, 8\); wsData\[r\]\[0\] = evalDoc.evalCompetenciasMejorar \|\| "";\s+merge\(r, 9, r \+ 3, 17\); wsData\[r\]\[9\] = evalDoc.evalEstrategiasMejorar \|\| "";\s+r \+= 4;/,
  `merge(r, 0, r, 21); wsData[r][0] = "III. PERFIL DE COMPETENCIAS DEL DOCENTE";
  r++;
  merge(r, 0, r, 21); wsData[r][0] = "Competencias objeto de mejoramiento";
  r++;
  merge(r, 0, r + 3, 10); wsData[r][0] = evalDoc.evalCompetenciasMejorar || "";
  merge(r, 11, r + 3, 21); wsData[r][11] = evalDoc.evalEstrategiasMejorar || "";
  r += 4;`
);

// Notice signatures, etc
code = code.replace(
  /merge\(r, 0, r, 17\); wsData\[r\]\[0\] = "IV. CONSTANCIA DE NOTIFICACIÓN";\s+r\+\+;\s+merge\(r, 0, r, 3\); wsData\[r\]\[0\] = "En la fecha";\s+merge\(r, 4, r, 8\); wsData\[r\]\[4\] = "";\s+merge\(r, 9, r, 17\); wsData\[r\]\[9\] = "se notifica al evaluado el resultado de la evaluación";\s+r\+\+;\s+merge\(r, 0, r, 8\); wsData\[r\]\[0\] = "\n\n\n\n\n________________________________________\nFirma del Evaluador";\s+merge\(r, 9, r, 17\); wsData\[r\]\[9\] = "\n\n\n\n\n________________________________________\nFirma del Evaluado";\s+r\+\+;\s+merge\(r, 0, r, 17\); wsData\[r\]\[0\] = "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL";/,
  `merge(r, 0, r, 21); wsData[r][0] = "IV. CONSTANCIA DE NOTIFICACIÓN";
  r++;
  merge(r, 0, r, 3); wsData[r][0] = "En la fecha";
  merge(r, 4, r, 10); wsData[r][4] = "";
  merge(r, 11, r, 21); wsData[r][11] = "se notifica al evaluado el resultado de la evaluación";
  r++;
  merge(r, 0, r, 10); wsData[r][0] = "\\n\\n\\n\\n\\n________________________________________\\nFirma del Evaluador";
  merge(r, 11, r, 21); wsData[r][11] = "\\n\\n\\n\\n\\n________________________________________\\nFirma del Evaluado";
  r++;
  merge(r, 0, r, 21); wsData[r][0] = "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL";`
);

// Global styling replacements where 17 was the max col index
code = code.replace(/C >= 13 && C <= 17/g, "C >= 13 && C <= 21");
code = code.replace(/C === 3 \|\| C === 6 \|\| C === 13 \|\| C === 16 \|\| C === 17/g, "C === 3 || C === 6 || C === 13 || C === 17 || C === 21");
code = code.replace(/C === 2 \|\| C === 6 \|\| C === 12 \|\| C === 15/g, "C === 2 || C === 6 || C === 12 || C === 19");
code = code.replace(/rDiasTotal && C === 16/g, "rDiasTotal && C === 19");
code = code.replace(/C === 13 \|\| C === 14/g, "C >= 13 && C <= 21"); // BLUE_CELL
code = code.replace(/C >= 9 && C <= 17/g, "C >= 11 && C <= 21");
code = code.replace(/C >= 0 && C <= 8/g, "C >= 0 && C <= 10");
code = code.replace(/C >= 14 && C <= 17/g, "C >= 13 && C <= 21"); // center numbers

fs.writeFileSync('scratch/exportAnexo6_modified.ts', code);
console.log('Done!');
