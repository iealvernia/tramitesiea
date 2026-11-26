import * as XLSX from 'xlsx-js-style';
import { DocenteEvaluacion } from '../types';
import { Evaluacion1278 } from '../components/EvaluacionDocentePanel';

export const generarAnexo6Word = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion, institutionName: string, customLogo: string) => {
  generarAnexo6Excel(evalDoc, teacher, institutionName);
};

export const generarAnexo6Excel = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion, institutionName: string) => {
  const rectorName = localStorage.getItem('iea_rector_name') || evalDoc.evaluadorNombre || '';
  const rectorCedula = localStorage.getItem('iea_rector_cedula') || evalDoc.evaluadorCedula || '';
  const isAprobado = evalDoc.estado === 'Aprobado';

  const wb = XLSX.utils.book_new();
  const COLS = 18;
  const wsData: any[][] = [];
  const merges: XLSX.Range[] = [];
  const rowHeights: { [key: number]: number } = {};
  
  const addRow = (height?: number) => {
    wsData.push(new Array(COLS).fill(''));
    const index = wsData.length - 1;
    if (height) rowHeights[index] = height;
    return index;
  };

  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 === r2 && c1 === c2) return;
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  };

  const BORDER_ALL = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const BORDER_MEDIUM = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
  const HEADER_STYLE = { font: { bold: true, sz: 9, name: 'Arial' }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  const GRAY_BG = { fill: { patternType: 'solid', fgColor: { rgb: "D9D9D9" } } };
  const DARK_GRAY_BG = { fill: { patternType: 'solid', fgColor: { rgb: "BFBFBF" } } };
  const YELLOW_BG = { fill: { patternType: 'solid', fgColor: { rgb: "FFFFCC" } } };
  const BLUE_BG = { fill: { patternType: 'solid', fgColor: { rgb: "CCFFFF" } } };
  const GREEN_BG = { fill: { patternType: 'solid', fgColor: { rgb: "E2EFDA" } } };
  const RED_BG = { fill: { patternType: 'solid', fgColor: { rgb: "FF0000" } }, font: { color: { rgb: "FFFFFF" }, bold: true, sz: 9, name: 'Arial' } };
  
  const SECTION_HEADER = { ...HEADER_STYLE, ...DARK_GRAY_BG, border: BORDER_MEDIUM };
  const SUB_SECTION = { ...HEADER_STYLE, ...GRAY_BG, border: BORDER_ALL };
  const NORMAL_CELL = { font: { sz: 9, name: 'Arial' }, alignment: { vertical: 'center', wrapText: true }, border: BORDER_ALL };
  const YELLOW_CELL = { ...NORMAL_CELL, ...YELLOW_BG };
  const BLUE_CELL = { ...NORMAL_CELL, ...BLUE_BG, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  const BLUE_NUM_CELL = { ...BLUE_CELL, font: { sz: 9, name: 'Arial', bold: true }, numFmt: '0.0' };
  const GREEN_CELL = { ...NORMAL_CELL, ...GREEN_BG };

  let r = 0;
  const emptyRowIndices: number[] = [];

  // Header
  r = addRow(70);
  merge(r, 0, r, 17);
  wsData[r][0] = "REPÚBLICA DE COLOMBIA\nMINISTERIO DE EDUCACIÓN NACIONAL\nEVALUACIÓN ANUAL DE DESEMPEÑO LABORAL\nPROTOCOLO PARA LA EVALUACIÓN DE DOCENTES\nANEXO 6";
  
  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // I. IDENTIFICACIÓN
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "I. IDENTIFICACIÓN";
  r = addRow(22); merge(r, 0, r, 17); wsData[r][0] = "A. EVALUADO";
  
  r = addRow(24);
  merge(r, 0, r, 2); merge(r, 3, r, 4); merge(r, 6, r, 9); merge(r, 10, r, 12); merge(r, 13, r, 17);
  wsData[r][0] = "Tipo de identificación"; wsData[r][3] = "CC"; wsData[r][5] = "No."; wsData[r][6] = teacher.cedula; wsData[r][10] = "Nombres y apellidos"; wsData[r][13] = teacher.nombre;

  r = addRow(22);
  merge(r, 0, r, 2); merge(r, 3, r, 11); merge(r, 12, r, 13); merge(r, 14, r, 15);
  wsData[r][0] = "Establecimiento Educativo"; wsData[r][3] = institutionName; wsData[r][12] = "Código DANE"; wsData[r][16] = "Zona";

  r = addRow(22);
  merge(r, 0, r, 2); merge(r, 3, r, 6); merge(r, 7, r, 8); merge(r, 9, r, 12); merge(r, 13, r, 14); merge(r, 15, r, 17);
  wsData[r][0] = "Entidad territorial certificada"; wsData[r][7] = "Municipio Localidad"; wsData[r][13] = "Cargo"; wsData[r][15] = teacher.cargo;

  r = addRow(22); merge(r, 0, r, 17); wsData[r][0] = "B. EVALUADOR";
  r = addRow(24);
  merge(r, 0, r, 2); merge(r, 3, r, 4); merge(r, 6, r, 9); merge(r, 10, r, 12); merge(r, 13, r, 17);
  wsData[r][0] = "Tipo de identificación"; wsData[r][3] = "CC"; wsData[r][5] = "No."; wsData[r][6] = rectorCedula; wsData[r][10] = "Nombres y apellidos"; wsData[r][13] = rectorName;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // II. VALORACIÓN DE LAS COMPETENCIAS
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "II. VALORACIÓN DE LAS COMPETENCIAS";
  r = addRow(22); merge(r, 0, r, 17); wsData[r][0] = "CATEGORÍAS PARA LA EVALUACIÓN DE DESEMPEÑO: No Satisfactorio (1-59); Satisfactorio (60-89); Sobresaliente (90-100)";

  r = addRow(28);
  merge(r, 0, r, 1); wsData[r][0] = "Año escolar"; merge(r, 2, r, 3); wsData[r][2] = evalDoc.anio;
  merge(r, 4, r, 5); wsData[r][4] = "Fecha inicio"; merge(r, 6, r, 7); wsData[r][6] = evalDoc.evalFechaInicio || "";
  merge(r, 8, r, 9); wsData[r][8] = "Fecha final"; merge(r, 10, r, 11); wsData[r][10] = evalDoc.evalFechaFinal || "";
  merge(r, 12, r, 15); wsData[r][12] = "# días licencias incapacidades";
  merge(r, 16, r, 17); wsData[r][16] = evalDoc.evalDiasIncapacidad !== undefined && evalDoc.evalDiasIncapacidad !== null ? evalDoc.evalDiasIncapacidad : 0;
  
  const rDiasTotal = addRow(28);
  merge(rDiasTotal, 0, rDiasTotal, 2); wsData[rDiasTotal][0] = "Fecha concertación";
  merge(rDiasTotal, 3, rDiasTotal, 5); wsData[rDiasTotal][3] = evalDoc.fechaConcertacion || "";
  merge(rDiasTotal, 6, rDiasTotal, 8); wsData[rDiasTotal][6] = "Fecha valoración";
  merge(rDiasTotal, 9, rDiasTotal, 11); wsData[rDiasTotal][9] = evalDoc.evalFechaFinal || "";
  merge(rDiasTotal, 12, rDiasTotal, 15); wsData[rDiasTotal][12] = "# TOTAL DÍAS VALORADOS";
  merge(rDiasTotal, 16, rDiasTotal, 17); wsData[rDiasTotal][16] = evalDoc.evalDiasValorados !== undefined && evalDoc.evalDiasValorados !== null ? evalDoc.evalDiasValorados : 0;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // A. FUNCIONALES
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "A. COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES (70%)";
  const headFunc1 = addRow(22); const headFunc2 = addRow(20);
  merge(headFunc1, 0, headFunc2, 1); wsData[headFunc1][0] = "Área de gestión";
  merge(headFunc1, 2, headFunc2, 7); wsData[headFunc1][2] = "Competencia";
  merge(headFunc1, 8, headFunc2, 12); wsData[headFunc1][8] = "Contribución Individual";
  merge(headFunc1, 13, headFunc1, 17); wsData[headFunc1][13] = "VALORACIÓN";
  wsData[headFunc2][13] = "Puntaje"; merge(headFunc2, 14, headFunc2, 15); wsData[headFunc2][14] = "Prom."; merge(headFunc2, 16, headFunc2, 17); wsData[headFunc2][16] = "Pond.";

  const round1 = (num: number | undefined) => typeof num === "number" && !isNaN(num) ? Math.round(num * 10) / 10 : 0;
  const fmtPct = (p: number) => (Math.abs(p - Math.round(p)) < 0.05 ? Math.round(p).toString() : p.toFixed(1)) + " %";
  
  const cleanStr = (s: string) => 
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const findComp = (name: string, index?: number) => {
    if (!evalDoc.compromisosFuncionales || evalDoc.compromisosFuncionales.length === 0) {
      return { competencia: name, contribucion: "", puntaje: 0, puntaje2: 0, porcentaje: undefined, area: 'Académica' as const };
    }
    // 1. Exact match
    let found = evalDoc.compromisosFuncionales.find(c => c.competencia?.trim().toLowerCase() === name.toLowerCase());
    if (found) return found;

    // 2. Normalized clean match
    const cName = cleanStr(name);
    found = evalDoc.compromisosFuncionales.find(c => {
      const cComp = cleanStr(c.competencia);
      return cComp === cName || cComp.includes(cName) || cName.includes(cComp);
    });
    if (found) return found;

    // 3. Fallback by index
    if (index !== undefined && evalDoc.compromisosFuncionales[index]) {
      return evalDoc.compromisosFuncionales[index];
    }

    return { competencia: name, contribucion: "", puntaje: 0, puntaje2: 0, porcentaje: undefined, area: 'Académica' as const };
  };

  const isOrientador = (evalDoc.compromisosFuncionales || []).some(c => 
    (c.competencia || '').toLowerCase().includes('orientador') || 
    (c.competencia || '').toLowerCase().includes('orientación')
  );
  
  const comps = isOrientador ? [
    { area: "Académica", name: "Dominio profesional de la orientación escolar" },
    { area: "Académica", name: "Planeación y organización de la orientación escolar" },
    { area: "Académica", name: "Pedagógica y didáctica" },
    { area: "Académica", name: "Evaluación y seguimiento de los procesos de orientación" },
    { area: "Administrativa", name: "Uso de recursos" },
    { area: "Administrativa", name: "Seguimiento de procesos" },
    { area: "Comunitaria", name: "Comunicación institucional" },
    { area: "Comunitaria", name: "Interacción con la comunidad y el entorno" }
  ] : [
    { area: "Académica", name: "Dominio curricular" },
    { area: "Académica", name: "Planeación y organización" },
    { area: "Académica", name: "Pedagógica y didáctica" },
    { area: "Académica", name: "Evaluación del aprendizaje" },
    { area: "Administrativa", name: "Uso de recursos" },
    { area: "Administrativa", name: "Seguimiento de procesos" },
    { area: "Comunitaria", name: "Comunicación institucional" },
    { area: "Comunitaria", name: "Comunidad y entorno" }
  ];

  let funcSumAcad = 0, countAcad = 0, areaPctAcad = 0, pondAcad = 0;
  let funcSumAdmin = 0, countAdmin = 0, areaPctAdmin = 0, pondAdmin = 0;
  let funcSumComun = 0, countComun = 0, areaPctComun = 0, pondComun = 0;
  const startFuncRow = wsData.length;
  const funcScoresArr: number[] = [];
  const funcNamesArr: string[] = [];
  
  comps.forEach((c, index) => {
    const cf = findComp(c.name, index);
    const row = addRow();
    const peso = cf.porcentaje !== undefined && cf.porcentaje !== null ? Number(cf.porcentaje) : (c.area === 'Académica' ? 12.5 : 5.0);
    const score = Number(cf.puntaje) || 0;
    const compDisplayName = cf.competencia || c.name;

    funcNamesArr.push(compDisplayName);
    funcScoresArr.push(score);

    merge(row, 2, row, 7); wsData[row][2] = compDisplayName + "\n" + "Peso: " + peso + "%";
    merge(row, 8, row, 12); wsData[row][8] = cf.contribucion || "";
    wsData[row][13] = round1(score);
    
    if (c.area === 'Académica') {
      funcSumAcad += score;
      countAcad++;
      areaPctAcad += peso;
      pondAcad += score * (peso / 100);
    } else if (c.area === 'Administrativa') {
      funcSumAdmin += score;
      countAdmin++;
      areaPctAdmin += peso;
      pondAdmin += score * (peso / 100);
    } else {
      funcSumComun += score;
      countComun++;
      areaPctComun += peso;
      pondComun += score * (peso / 100);
    }

    const contribText = cf.contribucion || "";
    const compLines = Math.ceil(compDisplayName.length / 32) + 1;
    const contribLines = contribText.length > 0 ? Math.ceil(contribText.length / 35) : 1;
    const maxLines = Math.max(2, compLines, contribLines);
    rowHeights[row] = Math.max(36, maxLines * 16 + 6);
  });
  
  // Per-area Prom. (weighted average within area so Prom. * Area% === Pond. always holds!)
  const avgAcad = areaPctAcad > 0 ? pondAcad / (areaPctAcad / 100) : (countAcad > 0 ? funcSumAcad / countAcad : 0);
  const avgAdmin = areaPctAdmin > 0 ? pondAdmin / (areaPctAdmin / 100) : (countAdmin > 0 ? funcSumAdmin / countAdmin : 0);
  const avgComun = areaPctComun > 0 ? pondComun / (areaPctComun / 100) : (countComun > 0 ? funcSumComun / countComun : 0);

  const pondAcadR = round1(pondAcad);
  const pondAdminR = round1(pondAdmin);
  const pondComunR = round1(pondComun);
  const ponderadoFunc = round1(pondAcad + pondAdmin + pondComun);
  const totalFuncPct = areaPctAcad + areaPctAdmin + areaPctComun;

  // Set Area labels using exact accumulated percentages
  wsData[startFuncRow][0] = "Académica\n" + fmtPct(areaPctAcad);
  wsData[startFuncRow + 4][0] = "Administrativa\n" + fmtPct(areaPctAdmin);
  wsData[startFuncRow + 6][0] = "Comunitaria\n" + fmtPct(areaPctComun);
  
  // Merging columns for Area (0-1), Prom (14-15) and Pond (16-17) per management area (exact MEN Anexo 6 structure)
  merge(startFuncRow, 0, startFuncRow + 3, 1);
  merge(startFuncRow + 4, 0, startFuncRow + 5, 1);
  merge(startFuncRow + 6, 0, startFuncRow + 7, 1);
  
  merge(startFuncRow, 14, startFuncRow + 3, 15); wsData[startFuncRow][14] = round1(avgAcad);
  merge(startFuncRow + 4, 14, startFuncRow + 5, 15); wsData[startFuncRow + 4][14] = round1(avgAdmin); 
  merge(startFuncRow + 6, 14, startFuncRow + 7, 15); wsData[startFuncRow + 6][14] = round1(avgComun);
  
  merge(startFuncRow, 16, startFuncRow + 3, 17); wsData[startFuncRow][16] = pondAcadR;
  merge(startFuncRow + 4, 16, startFuncRow + 5, 17); wsData[startFuncRow + 4][16] = pondAdminR;
  merge(startFuncRow + 6, 16, startFuncRow + 7, 17); wsData[startFuncRow + 6][16] = pondComunR;

  const rSub = addRow(24);
  merge(rSub, 0, rSub, 1); wsData[rSub][0] = fmtPct(totalFuncPct);
  merge(rSub, 2, rSub, 15); wsData[rSub][2] = "Subtotal competencias funcionales";
  merge(rSub, 16, rSub, 17); wsData[rSub][16] = ponderadoFunc;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // B. COMPORTAMENTALES
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "B. COMPETENCIAS COMPORTAMENTALES (30%)";
  const headComp1 = addRow(22); const headComp2 = addRow(20);
  merge(headComp1, 0, headComp2, 12); wsData[headComp1][0] = "Competencia";
  merge(headComp1, 13, headComp1, 17); wsData[headComp1][13] = "VALORACIÓN";
  wsData[headComp2][13] = "Puntaje"; merge(headComp2, 14, headComp2, 15); wsData[headComp2][14] = "Prom."; merge(headComp2, 16, headComp2, 17); wsData[headComp2][16] = "Pond.";

  let compSum = 0;
  let countComp = 0;
  const startCompRow = wsData.length;
  const compNamesArr: string[] = [];
  const compScoresArr: number[] = [];

  for (let i = 0; i < 3; i++) {
    const cc = (evalDoc.compromisosComportamentales || [])[i] || { competencia: "", puntaje: 0, puntaje2: 0, evidencias: "" } as any;
    const row = addRow();
    const score = Number(cc.puntaje) || 0;
    const compDisplayName = cc.competencia || `Competencia Comportamental #${i+1}`;
    compNamesArr.push(compDisplayName);
    compScoresArr.push(score);

    merge(row, 0, row, 7); wsData[row][0] = compDisplayName + "\n" + "Peso: 10%";
    merge(row, 8, row, 12); wsData[row][8] = cc.evidencias || "";
    wsData[row][13] = round1(score);
    
    compSum += score;
    countComp++;

    const evidText = cc.evidencias || "";
    const compLines = Math.ceil(compDisplayName.length / 38) + 1;
    const evidLines = evidText.length > 0 ? Math.ceil(evidText.length / 36) : 1;
    const maxLines = Math.max(2, compLines, evidLines);
    rowHeights[row] = Math.max(48, maxLines * 16 + 8);
  }
  const avgComp = countComp > 0 ? compSum / countComp : 0;
  const ponderadoComp = round1(avgComp * 0.30);
  
  merge(startCompRow, 14, startCompRow + 2, 15); wsData[startCompRow][14] = round1(avgComp);
  merge(startCompRow, 16, startCompRow + 2, 17); wsData[startCompRow][16] = ponderadoComp;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  
  // C. TOTAL
  const puntajeTotal = round1(ponderadoFunc + ponderadoComp);
  const rTotalHead = addRow(24); merge(rTotalHead, 0, rTotalHead, 13); wsData[rTotalHead][0] = "C. RESULTADO TOTAL (100%)"; merge(rTotalHead, 14, rTotalHead, 17); wsData[rTotalHead][14] = "FINAL";
  const rTotalVal = addRow(24); merge(rTotalVal, 0, rTotalVal, 13); wsData[rTotalVal][0] = "CALIFICACIÓN TOTAL = Σ PONDERACIÓN PROMEDIOS"; merge(rTotalVal, 14, rTotalVal, 17); wsData[rTotalVal][14] = puntajeTotal;

  const esSobresaliente = puntajeTotal >= 90;
  const esSatisfactorio = puntajeTotal >= 60 && puntajeTotal < 90;
  const esNoSatisfactorio = puntajeTotal < 60;

  r = addRow(24);
  merge(r, 0, r, 8); wsData[r][0] = "VALORACIÓN FINAL DEL DESEMPEÑO";
  merge(r, 9, r, 11); wsData[r][9] = "NO SATISFACTORIO " + (esNoSatisfactorio ? "[X]" : "[ ]");
  merge(r, 12, r, 14); wsData[r][12] = "SATISFACTORIO " + (esSatisfactorio ? "[X]" : "[ ]");
  merge(r, 15, r, 17); wsData[r][15] = "SOBRESALIENTE " + (esSobresaliente ? "[X]" : "[ ]");

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // III. PERFIL DE COMPETENCIAS DEL DOCENTE (High-resolution 20-step visual bar chart: 100 down to 5)
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "III. PERFIL DE COMPETENCIAS DEL DOCENTE";
  const allCompsX = [...funcNamesArr, ...compNamesArr, "Puntaje final"];
  const allCompsScores = [...funcScoresArr, ...compScoresArr, puntajeTotal];

  // Row showing exact numeric value above each bar
  const chartScoreRow = addRow(20);
  merge(chartScoreRow, 0, chartScoreRow, 1); wsData[chartScoreRow][0] = "Puntaje";
  for (let j = 0; j < allCompsScores.length; j++) {
    wsData[chartScoreRow][2 + j] = round1(allCompsScores[j]);
  }
  merge(chartScoreRow, 14, chartScoreRow, 17); wsData[chartScoreRow][14] = "REFERENCIA DE PERFIL";

  const chartStartRow = wsData.length;
  const CHART_STEPS = 20; // 100, 95, 90, ..., 5
  const chartEndRow = chartStartRow + CHART_STEPS - 1;
  for (let step = CHART_STEPS; step >= 1; step--) {
    const level = step * 5;
    const yRow = addRow(12);
    merge(yRow, 0, yRow, 1);
    wsData[yRow][0] = level % 10 === 0 ? level.toString() : "";
    for (let j = 0; j < allCompsScores.length; j++) {
      const s = allCompsScores[j];
      // Fill bar cell if score reaches this 5-point band (rounding to nearest 5, minimum 1 band if score > 0)
      if (s > 0 && (s >= level - 2 || (level === 5 && s > 0))) {
        wsData[yRow][2 + j] = ""; // Styled with solid fill + crisp white side borders below
      }
    }
  }

  // Merge legend box on cols 14..17 across chart rows (no overlapping merges!)
  merge(chartStartRow, 14, chartStartRow + 3, 17);
  wsData[chartStartRow][14] = "■ Funcionales (70%)\nBarras azul acero";
  merge(chartStartRow + 4, 14, chartStartRow + 7, 17);
  wsData[chartStartRow + 4][14] = "■ Comportamentales (30%)\nBarras azul claro";
  merge(chartStartRow + 8, 14, chartStartRow + 11, 17);
  wsData[chartStartRow + 8][14] = "■ Puntaje Final (100%)\nBarra azul oscuro";
  merge(chartStartRow + 12, 14, chartStartRow + 15, 17);
  wsData[chartStartRow + 12][14] = "■ Por mejorar (< 60)\nBarra roja alerta";
  merge(chartStartRow + 16, 14, chartEndRow, 17);
  wsData[chartStartRow + 16][14] = `NIVEL FINAL:\n${esSobresaliente ? 'SOBRESALIENTE' : esSatisfactorio ? 'SATISFACTORIO' : 'NO SATISFACTORIO'} (${puntajeTotal.toFixed(1)})`;

  const xLabelRow = addRow(125);
  merge(xLabelRow, 0, xLabelRow, 1); wsData[xLabelRow][0] = "0";
  for (let j = 0; j < allCompsX.length; j++) {
    wsData[xLabelRow][2 + j] = allCompsX[j];
  }
  merge(xLabelRow, 14, xLabelRow, 17); wsData[xLabelRow][14] = "Escala:\n90-100 Sobresaliente\n60-89 Satisfactorio\n1-59 No Satisfactorio";

  const xCatRow = addRow(30);
  merge(xCatRow, 0, xCatRow, 1); wsData[xCatRow][0] = "";
  merge(xCatRow, 2, xCatRow, 9); wsData[xCatRow][2] = "COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES";
  merge(xCatRow, 10, xCatRow, 12); wsData[xCatRow][10] = "COMPETENCIAS COMPORTAMENTALES";
  wsData[xCatRow][13] = "TOTAL";
  merge(xCatRow, 14, xCatRow, 17); wsData[xCatRow][14] = "";

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  
  // IV & V
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "IV. CONSTANCIA DE NOTIFICACIÓN";
  r = addRow(65); merge(r, 0, r, 17); wsData[r][0] = `En la fecha ___________________ se le notifica a ${teacher.nombre} el resultado total de la Evaluación Anual de Desempeño de Docentes y Directivos Docentes correspondiente al año escolar ${evalDoc.anio}. Se le entrega copia del protocolo y se le informa que ante el mismo proceden los recursos de reposición y apelación, dentro de los diez (10) días hábiles siguientes a esta notificación, ante el evaluador o su inmediato superior jerárquico, según sea el caso.`;
  
  r = addRow(30); merge(r, 0, r, 8); wsData[r][0] = "Nombre completo del docente evaluado:\n" + teacher.nombre; merge(r, 9, r, 17); wsData[r][9] = "Nombre completo del evaluador:\n" + rectorName;
  r = addRow(50); merge(r, 0, r, 8); wsData[r][0] = "Firma y número de documento del docente evaluado:\n\n________________________________\nC.C. " + teacher.cedula; merge(r, 9, r, 17); wsData[r][9] = "Firma y número de documento del evaluador:" + (!isAprobado ? " (Pendiente)" : "") + "\n\n________________________________\nC.C. " + (isAprobado ? rectorCedula : "_______________");
  r = addRow(22); merge(r, 0, r, 17); wsData[r][0] = "Ciudad, fecha y hora:";
  
  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  r = addRow(24); merge(r, 0, r, 17); wsData[r][0] = "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL";
  const rPlanHead = addRow(42); merge(rPlanHead, 0, rPlanHead, 8); wsData[rPlanHead][0] = "Competencias objeto de mejoramiento, priorizadas con base en los puntajes finales."; merge(rPlanHead, 9, rPlanHead, 17); wsData[rPlanHead][9] = "Estrategias y acciones específicas de mejoramiento. Pueden ser nuevas o continuación de las anteriores";
  const planMaxLen = Math.max(String(evalDoc.evalCompetenciasMejorar || "").length, String(evalDoc.evalEstrategiasMejorar || "").length);
  const planHeight = Math.max(100, Math.ceil(planMaxLen / 45) * 16 + 20);
  const rPlanContent = addRow(planHeight); merge(rPlanContent, 0, rPlanContent, 8); wsData[rPlanContent][0] = evalDoc.evalCompetenciasMejorar || ""; merge(rPlanContent, 9, rPlanContent, 17); wsData[rPlanContent][9] = evalDoc.evalEstrategiasMejorar || "";
  
  r = addRow(30); merge(r, 0, r, 8); wsData[r][0] = "Nombre completo del docente evaluado:\n" + teacher.nombre; merge(r, 9, r, 17); wsData[r][9] = "Nombre completo del evaluador:\n" + rectorName;
  r = addRow(50); merge(r, 0, r, 8); wsData[r][0] = "Firma y número de documento del docente evaluado:\n\n________________________________\nC.C. " + teacher.cedula; merge(r, 9, r, 17); wsData[r][9] = "Firma y número de documento del evaluador:" + (!isAprobado ? " (Pendiente)" : "") + "\n\n________________________________\nC.C. " + (isAprobado ? rectorCedula : "_______________");

  // === APPLY STYLES ===
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = merges;
  
  const colWidths = new Array(COLS).fill({ wch: 6 });
  colWidths[0] = { wch: 10 };
  colWidths[1] = { wch: 6 };
  for (let c = 2; c <= 7; c++) colWidths[c] = { wch: 6 };
  for (let c = 8; c <= 12; c++) colWidths[c] = { wch: 8 };
  colWidths[13] = { wch: 8 };
  colWidths[14] = { wch: 6 };
  colWidths[15] = { wch: 6 };
  colWidths[16] = { wch: 6 };
  colWidths[17] = { wch: 6 };
  ws['!cols'] = colWidths;

  const rowsMeta: any[] = [];

  for (let R = 0; R < wsData.length; ++R) {
    if (emptyRowIndices.includes(R)) {
      rowsMeta[R] = { hpt: 4 };
    } else if (rowHeights[R]) {
      rowsMeta[R] = { hpt: rowHeights[R] };
    }

    for (let C = 0; C < COLS; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      
      const val = ws[cellAddress].v;
      const valStr = String(val);
      let style: any = { ...NORMAL_CELL };

      if (R === 0) {
          style = { ...NORMAL_CELL, font: { sz: 10, name: 'Arial', bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      }
      else if (C >= 13 && C <= 17 && (R >= startFuncRow && R <= startFuncRow + 7 || R >= startCompRow && R <= startCompRow + 2)) {
          style = { ...NORMAL_CELL, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      }
      else if (valStr === "I. IDENTIFICACIÓN" || valStr === "A. EVALUADO" || valStr === "B. EVALUADOR" ||
          valStr === "II. VALORACIÓN DE LAS COMPETENCIAS" ||
          valStr === "A. COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES (70%)" ||
          valStr === "B. COMPETENCIAS COMPORTAMENTALES (30%)" ||
          valStr === "C. RESULTADO TOTAL (100%)" || valStr === "FINAL" ||
          valStr === "III. PERFIL DE COMPETENCIAS DEL DOCENTE" ||
          valStr === "IV. CONSTANCIA DE NOTIFICACIÓN" ||
          valStr === "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL") {
          style = { ...SECTION_HEADER };
      }
      else if (valStr === "Tipo de identificación" || valStr === "No." || valStr === "Establecimiento Educativo" ||
               valStr === "Código DANE" || valStr === "Zona" || valStr === "Entidad territorial certificada" ||
               valStr === "Municipio Localidad" || valStr === "Cargo" || valStr === "Año escolar" ||
               valStr === "Fecha inicio" || valStr === "Fecha final" || valStr === "# días licencias incapacidades" ||
               valStr === "Área de gestión" || valStr === "Competencia" || valStr === "Contribución Individual" ||
               valStr === "VALORACIÓN" || valStr === "1ra Val." || valStr === "2da Val." || valStr === "Puntaje" || valStr === "Prom." || valStr === "Pond." ||
               valStr === "Subtotal competencias funcionales" || valStr === "CALIFICACIÓN TOTAL = Σ PONDERACIÓN PROMEDIOS" ||
               valStr === "VALORACIÓN FINAL DEL DESEMPEÑO" || valStr.includes("NO SATISFACTORIO") || valStr.includes("SOBRESALIENTE") ||
               valStr.includes("Competencias objeto de mejoramiento") || valStr === "Fecha concertación" || valStr === "Fecha valoración") {
          style = { ...SUB_SECTION };
      }
      else if (R >= 2 && R <= 9 && (C === 3 || C === 6 || C === 13 || C === 17 )) {
          if (valStr !== "No." && valStr !== "CC" && valStr !== "Nombres y apellidos") style = { ...YELLOW_CELL };
      }
      else if (R >= 10 && R <= 12 && (C === 2 || C === 6 || C === 12)) {
          style = { ...YELLOW_CELL };
      }

      if (valStr === "# TOTAL DÍAS VALORADOS") style = { ...SUB_SECTION, font: { bold: true, sz: 8, name: 'Arial' } };
      
      if (R === rSub && C >= 0 && C <= 1) {
          style = { ...RED_BG, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER_ALL };
      }
      if (R === rSub && C >= 16 && C <= 17) {
          style = { ...BLUE_NUM_CELL, border: BORDER_MEDIUM };
          ws[cellAddress].z = '0.0';
      }
      if (R === rTotalVal && C >= 14 && C <= 17) {
          style = { ...BLUE_NUM_CELL, font: { sz: 11, name: 'Arial', bold: true }, border: BORDER_MEDIUM };
          ws[cellAddress].z = '0.0';
      }

      if (R >= startFuncRow && R < startFuncRow + 8) {
          if (C >= 0 && C <= 1) style = { ...YELLOW_CELL, font: { sz: 9, name: 'Arial', bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
          if (C >= 8 && C <= 12) style = { ...GREEN_CELL };
          if (C >= 13 && C <= 17) {
            style = { ...BLUE_NUM_CELL };
            if (ws[cellAddress].t === 'n') ws[cellAddress].z = '0.0';
          }
      }
      if (R >= startCompRow && R < startCompRow + 3) {
          if (C >= 0 && C <= 12) style = { ...YELLOW_CELL };
          if (C >= 13 && C <= 17) {
            style = { ...BLUE_NUM_CELL };
            if (ws[cellAddress].t === 'n') ws[cellAddress].z = '0.0';
          }
      }

      // === III. PERFIL DE COMPETENCIAS DEL DOCENTE (BAR CHART STYLING) ===
      if (R === chartScoreRow) {
          if (C >= 0 && C <= 1) {
            style = { ...SUB_SECTION, font: { sz: 8, name: 'Arial', bold: true } };
          } else if (C >= 2 && C <= 13) {
            const sc = allCompsScores[C - 2] || 0;
            const txtColor = sc < 60 ? "C00000" : (C === 13 ? "1F4E78" : "1E3A8A");
            style = {
              font: { sz: 8, name: 'Arial', bold: true, color: { rgb: txtColor } },
              alignment: { horizontal: 'center', vertical: 'center' },
              fill: { patternType: 'solid', fgColor: { rgb: "F1F5F9" } },
              border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin', color: { rgb: 'CBD5E1' } }, right: { style: 'thin', color: { rgb: 'CBD5E1' } } },
              numFmt: '0.0'
            };
            if (ws[cellAddress].t === 'n') ws[cellAddress].z = '0.0';
          } else {
            style = { ...SUB_SECTION, font: { sz: 8, name: 'Arial', bold: true } };
          }
      }
      else if (R >= chartStartRow && R <= chartEndRow) {
          const bandIndex = R - chartStartRow; // 0 = level 100, 19 = level 5
          const level = (CHART_STEPS - bandIndex) * 5;
          const isBottomRow = R === chartEndRow;
          const isMajorLine = level % 10 === 0;

          if (C >= 0 && C <= 1) {
            style = {
              font: { sz: 8, name: 'Arial', bold: isMajorLine },
              alignment: { horizontal: 'right', vertical: 'center' },
              fill: { patternType: 'solid', fgColor: { rgb: "FFFFFF" } },
              border: {
                left: C === 0 ? { style: 'thin', color: { rgb: '000000' } } : undefined,
                right: C === 1 ? { style: 'medium', color: { rgb: '000000' } } : undefined,
                bottom: isBottomRow ? { style: 'medium', color: { rgb: '000000' } } : undefined
              }
            };
          } else if (C >= 2 && C <= 13) {
            const s = allCompsScores[C - 2] || 0;
            const isFilled = s > 0 && (s >= level - 2 || (level === 5 && s > 0));
            const prevLevel = level + 5;
            const isAboveFilled = R > chartStartRow && s > 0 && (s >= prevLevel - 2);
            const isTopOfBar = isFilled && !isAboveFilled;

            if (isFilled) {
              const barRgb = s < 60 ? "E06666" : (C === 13 ? "1F4E78" : (C >= 10 ? "5B9BD5" : "4F81BD"));
              style = {
                fill: { patternType: 'solid', fgColor: { rgb: barRgb } },
                border: {
                  left: { style: 'medium', color: { rgb: 'FFFFFF' } },
                  right: { style: 'medium', color: { rgb: 'FFFFFF' } },
                  top: isTopOfBar ? { style: 'thin', color: { rgb: '0F172A' } } : undefined,
                  bottom: isBottomRow ? { style: 'medium', color: { rgb: '000000' } } : undefined
                }
              };
            } else {
              style = {
                fill: { patternType: 'solid', fgColor: { rgb: "FFFFFF" } },
                border: {
                  top: isMajorLine ? { style: 'dotted', color: { rgb: 'BFBFBF' } } : undefined,
                  bottom: isBottomRow ? { style: 'medium', color: { rgb: '000000' } } : undefined,
                  right: C === 13 ? { style: 'thin', color: { rgb: 'CBD5E1' } } : undefined
                }
              };
            }
          } else {
            // Legend box on cols 14..17
            let legendBg = "F8FAFC";
            let legendFontColor = "1E293B";
            if (bandIndex < 4) { legendBg = "E8F0FA"; legendFontColor = "1F4E78"; }
            else if (bandIndex < 8) { legendBg = "EBF5FB"; legendFontColor = "2E75B6"; }
            else if (bandIndex < 12) { legendBg = "E2E8F0"; legendFontColor = "0F172A"; }
            else if (bandIndex < 16) { legendBg = "FDEDEC"; legendFontColor = "991B1B"; }
            else {
              legendBg = esSobresaliente ? "DCFCE7" : esSatisfactorio ? "DBEAFE" : "FEE2E2";
              legendFontColor = esSobresaliente ? "166534" : esSatisfactorio ? "1E40AF" : "991B1B";
            }
            style = {
              font: { sz: 8, name: 'Arial', bold: true, color: { rgb: legendFontColor } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              fill: { patternType: 'solid', fgColor: { rgb: legendBg } },
              border: BORDER_ALL
            };
          }
      }
      else if (R === xLabelRow) {
          if (C >= 0 && C <= 1) {
            style = { ...NORMAL_CELL, font: { sz: 8, name: 'Arial', bold: true }, alignment: { horizontal: 'right', vertical: 'top' } };
          } else if (C >= 2 && C <= 13) {
            style = { ...NORMAL_CELL, font: { sz: 8, name: 'Arial', bold: C === 13 }, alignment: { textRotation: 90, vertical: 'bottom', horizontal: 'center', wrapText: true } };
          } else {
            style = { ...NORMAL_CELL, font: { sz: 7.5, name: 'Arial' }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, fill: { patternType: 'solid', fgColor: { rgb: "F8FAFC" } } };
          }
      }
      else if (R === xCatRow) {
          style = { ...SUB_SECTION, font: { sz: 8, name: 'Arial', bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      }
      
      if (R === rPlanHead || R === rPlanContent) {
          style = { ...GREEN_CELL };
      }

      if (emptyRowIndices.includes(R)) {
          style = {
            ...style,
            border: {
              left: C === 0 ? { style: 'thin', color: { rgb: '000000' } } : undefined,
              right: C === COLS - 1 ? { style: 'thin', color: { rgb: '000000' } } : undefined
            }
          };
      }

      ws[cellAddress].s = style;
    }
  }

  ws['!rows'] = rowsMeta;
  ws['!pageSetup'] = { paperSize: 1, orientation: 'landscape' };

  XLSX.utils.book_append_sheet(wb, ws, "Anexo 6");
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Anexo_6_Evaluacion_${teacher.cedula}_${evalDoc.anio}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
