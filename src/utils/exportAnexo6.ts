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
  
  const addRow = (height?: number) => {
    wsData.push(new Array(COLS).fill(''));
    return wsData.length - 1;
  };

  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  };

  const BORDER_ALL = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const BORDER_MEDIUM = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
  const HEADER_STYLE = { font: { bold: true, sz: 9, name: 'Arial' }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  const GRAY_BG = { fill: { fgColor: { rgb: "D9D9D9" } } };
  const DARK_GRAY_BG = { fill: { fgColor: { rgb: "BFBFBF" } } };
  const YELLOW_BG = { fill: { fgColor: { rgb: "FFFFCC" } } };
  const BLUE_BG = { fill: { fgColor: { rgb: "CCFFFF" } } };
  const GREEN_BG = { fill: { fgColor: { rgb: "E2EFDA" } } };
  const RED_BG = { fill: { fgColor: { rgb: "FF0000" } }, font: { color: { rgb: "FFFFFF" }, bold: true } };
  
  const SECTION_HEADER = { ...HEADER_STYLE, ...DARK_GRAY_BG, border: BORDER_MEDIUM };
  const SUB_SECTION = { ...HEADER_STYLE, ...GRAY_BG, border: BORDER_ALL };
  const NORMAL_CELL = { font: { sz: 9, name: 'Arial' }, alignment: { vertical: 'center', wrapText: true }, border: BORDER_ALL };
  const YELLOW_CELL = { ...NORMAL_CELL, ...YELLOW_BG };
  const BLUE_CELL = { ...NORMAL_CELL, ...BLUE_BG, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  const GREEN_CELL = { ...NORMAL_CELL, ...GREEN_BG };

  let r = 0;
  const emptyRowIndices: number[] = [];

  // Header
  r = addRow();
  merge(r, 1, r, 17);
  wsData[r][1] = "REPÚBLICA DE COLOMBIA\nMINISTERIO DE EDUCACI�N NACIONAL\nEVALUACI�N ANUAL DE DESEMPE�O LABORAL\nPROTOCOLO PARA LA EVALUACI�N DE DOCENTES\nANEXO 6";
  
  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // I. IDENTIFICACI�N
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "I. IDENTIFICACI�N";
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "A. EVALUADO";
  
  r = addRow();
  merge(r, 0, r, 2); merge(r, 3, r, 4); merge(r, 5, r, 5); merge(r, 6, r, 9); merge(r, 10, r, 12); merge(r, 13, r, 17);
  wsData[r][0] = "Tipo de identificación"; wsData[r][3] = "CC"; wsData[r][5] = "No."; wsData[r][6] = teacher.cedula; wsData[r][10] = "Nombres y apellidos"; wsData[r][13] = teacher.nombre;

  r = addRow();
  merge(r, 0, r, 2); merge(r, 3, r, 11); merge(r, 12, r, 13); merge(r, 14, r, 15); merge(r, 16, r, 16); merge(r, 17, r, 17);
  wsData[r][0] = "Establecimiento Educativo"; wsData[r][3] = institutionName; wsData[r][12] = "Código DANE"; wsData[r][16] = "Zona";

  r = addRow();
  merge(r, 0, r, 2); merge(r, 3, r, 6); merge(r, 7, r, 8); merge(r, 9, r, 12); merge(r, 13, r, 14); merge(r, 15, r, 17);
  wsData[r][0] = "Entidad territorial certificada"; wsData[r][7] = "Municipio Localidad"; wsData[r][13] = "Cargo"; wsData[r][15] = teacher.cargo;

  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "B. EVALUADOR";
  r = addRow();
  merge(r, 0, r, 2); merge(r, 3, r, 4); merge(r, 5, r, 5); merge(r, 6, r, 9); merge(r, 10, r, 12); merge(r, 13, r, 17);
  wsData[r][0] = "Tipo de identificación"; wsData[r][3] = "CC"; wsData[r][5] = "No."; wsData[r][6] = rectorCedula; wsData[r][10] = "Nombres y apellidos"; wsData[r][13] = rectorName;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // II. VALORACI�N DE LAS COMPETENCIAS
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "II. VALORACI�N DE LAS COMPETENCIAS";
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "CATEGORÍAS PARA LA EVALUACI�N DE DESEMPE�O: No Satisfactorio (1-59); Satisfactorio (60-89); Sobresaliente (90-100)";

  r = addRow();
  merge(r, 0, r, 1); merge(r, 2, r, 3); merge(r, 4, r, 5); merge(r, 6, r, 8); merge(r, 9, r, 11); merge(r, 12, r, 14); merge(r, 15, r, 17);
  wsData[r][0] = "Año escolar"; wsData[r][2] = evalDoc.anio; wsData[r][4] = "Fecha inicio"; wsData[r][6] = evalDoc.evalFechaInicio || ""; wsData[r][9] = "Fecha final"; wsData[r][12] = evalDoc.evalFechaFinal || ""; wsData[r][15] = "# días licencias incapacidades";
  
  const rDiasTotal = addRow();
  merge(rDiasTotal, 0, rDiasTotal, 3); wsData[rDiasTotal][0] = "Fecha concertación"; merge(rDiasTotal, 4, rDiasTotal, 6);
  merge(rDiasTotal, 7, rDiasTotal, 8); wsData[rDiasTotal][7] = "Fecha valoración"; merge(rDiasTotal, 9, rDiasTotal, 11);
  merge(rDiasTotal, 12, rDiasTotal, 15); wsData[rDiasTotal][12] = "# TOTAL DÍAS VALORADOS"; merge(rDiasTotal, 16, rDiasTotal, 17); wsData[rDiasTotal][16] = evalDoc.evalDiasValorados || 0;

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // A. FUNCIONALES
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "A. COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES (70%)";
  const headFunc1 = addRow(); const headFunc2 = addRow();
  merge(headFunc1, 0, headFunc2, 1); wsData[headFunc1][0] = "Área de gestión";
  merge(headFunc1, 2, headFunc2, 7); wsData[headFunc1][2] = "Competencia";
  merge(headFunc1, 8, headFunc2, 12); wsData[headFunc1][8] = "Contribución Individual";
  merge(headFunc1, 13, headFunc1, 17); wsData[headFunc1][13] = "VALORACI�N";
  wsData[headFunc2][13] = "Puntaje"; merge(headFunc2, 14, headFunc2, 15); wsData[headFunc2][14] = "Prom."; merge(headFunc2, 16, headFunc2, 17); wsData[headFunc2][16] = "Pond.";

  const formatNum = (num: number | undefined) => typeof num === "number" && !isNaN(num) ? num.toFixed(1) : "0.0";
  const findComp = (name: string) => evalDoc.compromisosFuncionales.find(c => c.competencia.trim().toLowerCase() === name.toLowerCase()) || { contribucion: "", puntaje: 0, puntaje2: 0, porcentaje: undefined };
  const isOrientador = evalDoc.compromisosFuncionales.some(c => c.competencia.toLowerCase().includes('orientador') || c.competencia.toLowerCase().includes('orientación'));
  
  const comps = isOrientador ? [
    { area: "Académica", name: "Dominio profesional de la orientación escolar" }, { area: "Académica", name: "Planeación y organización de la orientación escolar" },
    { area: "Académica", name: "Pedagógica y didáctica" }, { area: "Académica", name: "Evaluación y seguimiento de los procesos de orientación" },
    { area: "Administrativa", name: "Uso de recursos" }, { area: "Administrativa", name: "Seguimiento de procesos" },
    { area: "Comunitaria", name: "Comunicación institucional" }, { area: "Comunitaria", name: "Interacción con la comunidad y el entorno" }
  ] : [
    { area: "Académica", name: "Dominio curricular" }, { area: "Académica", name: "Planeación y organización académica" },
    { area: "Académica", name: "Pedagógica y didáctica" }, { area: "Académica", name: "Evaluación del aprendizajes" },
    { area: "Administrativa", name: "Uso de recursos" }, { area: "Administrativa", name: "Seguimiento de procesos" },
    { area: "Comunitaria", name: "Comunicación institucional" }, { area: "Comunitaria", name: "Interacción comunidad / entorno" }
  ];

  let funcSum = 0;
  let countFunc = 0;
  let funcSum1 = 0, countFunc1 = 0;
  let funcSum2 = 0, countFunc2 = 0;
  const startFuncRow = wsData.length;
  
  const getAreaPorc = (area: string) => {
    const sum = evalDoc.compromisosFuncionales.filter(c => c.area === area).reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
    return sum > 0 ? sum + "%" : "%";
  };
  
  comps.forEach((c) => {
    const cf = findComp(c.name);
    const row = addRow();
    merge(row, 0, row, 1); wsData[row][0] = c.area + "\n" + getAreaPorc(c.area);
    merge(row, 2, row, 7); wsData[row][2] = c.name + "\n" + "Peso: " + (cf.porcentaje !== undefined ? cf.porcentaje : (c.area === 'Académica' ? 12.5 : 5.0)) + "%";
    merge(row, 8, row, 12); wsData[row][8] = cf.contribucion || "";
    wsData[row][13] = formatNum(cf.puntaje);
    
    
    let avgScore = Number(cf.puntaje) || 0;
    
    funcSum += avgScore;
    countFunc++;
  });
  
  const avgFunc = countFunc > 0 ? funcSum / countFunc : 0;
  const ponderadoFunc = avgFunc * 0.70;
  
  // Merging columns for Area, Prom and Pond
  merge(startFuncRow, 0, startFuncRow + 3, 1);
  merge(startFuncRow + 4, 0, startFuncRow + 5, 1);
  merge(startFuncRow + 6, 0, startFuncRow + 7, 1);
  
  merge(startFuncRow, 14, startFuncRow + 3, 15); wsData[startFuncRow][14] = formatNum(avgFunc);
  merge(startFuncRow + 4, 14, startFuncRow + 5, 15); wsData[startFuncRow + 4][14] = formatNum(avgFunc); 
  merge(startFuncRow + 6, 14, startFuncRow + 7, 15); wsData[startFuncRow + 6][14] = formatNum(avgFunc);
  
  merge(startFuncRow, 16, startFuncRow + 7, 17); wsData[startFuncRow][16] = formatNum(ponderadoFunc);

  const rSub = addRow();
  merge(rSub, 0, rSub, 1); wsData[rSub][0] = "70%";
  merge(rSub, 2, rSub, 15); wsData[rSub][2] = "Subtotal competencias funcionales";
  merge(rSub, 16, rSub, 17); wsData[rSub][16] = formatNum(ponderadoFunc);

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // B. COMPORTAMENTALES
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "B. COMPETENCIAS COMPORTAMENTALES (30%)";
  const headComp1 = addRow(); const headComp2 = addRow();
  merge(headComp1, 0, headComp2, 12); wsData[headComp1][0] = "Competencia";
  merge(headComp1, 13, headComp1, 17); wsData[headComp1][13] = "VALORACI�N";
  wsData[headComp2][13] = "Puntaje"; merge(headComp2, 14, headComp2, 15); wsData[headComp2][14] = "Prom."; merge(headComp2, 16, headComp2, 17); wsData[headComp2][16] = "Pond.";

  let compSum = 0;
  let countComp = 0;
  let compSum1 = 0, countComp1 = 0;
  let compSum2 = 0, countComp2 = 0;
  const startCompRow = wsData.length;
  for(let i=0; i<3; i++) {
    const cc = evalDoc.compromisosComportamentales[i] || { competencia: "", puntaje: 0, puntaje2: 0, evidencias: "" } as any;
    const row = addRow();
    merge(row, 0, row, 7); wsData[row][0] = cc.competencia + "\n" + "Peso: 10%";
    merge(row, 8, row, 12); wsData[row][8] = cc.evidencias || "";
    wsData[row][13] = formatNum(cc.puntaje);
    
    
    let avgScore = Number(cc.puntaje) || 0;
    compSum += avgScore;
    if(cc.competencia) countComp++;
  }
  const avgComp = countComp > 0 ? compSum / countComp : (compSum / 3);
  const ponderadoComp = avgComp * 0.30;
  
  merge(startCompRow, 14, startCompRow + 2, 15); wsData[startCompRow][14] = formatNum(avgComp);
  merge(startCompRow, 16, startCompRow + 2, 17); wsData[startCompRow][16] = formatNum(ponderadoComp);

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  
  // C. TOTAL
  const puntajeTotal = ponderadoFunc + ponderadoComp;
  r = addRow(); merge(r, 0, r, 13); wsData[r][0] = "C. RESULTADO TOTAL (100%)"; merge(r, 14, r, 17); wsData[r][14] = "FINAL";
  r = addRow(); merge(r, 0, r, 13); wsData[r][0] = "CALIFICACI�N TOTAL = Σ PONDERACI�N PROMEDIOS"; merge(r, 14, r, 17); wsData[r][14] = formatNum(puntajeTotal);

  const esSobresaliente = puntajeTotal >= 90;
  const esSatisfactorio = puntajeTotal >= 60 && puntajeTotal < 90;
  const esNoSatisfactorio = puntajeTotal < 60;

  r = addRow();
  merge(r, 0, r, 8); wsData[r][0] = "VALORACI�N FINAL DEL DESEMPE�O";
  merge(r, 9, r, 11); wsData[r][9] = "NO SATISFACTORIO " + (esNoSatisfactorio ? "[X]" : "[ ]");
  merge(r, 12, r, 14); wsData[r][12] = "SATISFACTORIO " + (esSatisfactorio ? "[X]" : "[ ]");
  merge(r, 15, r, 17); wsData[r][15] = "SOBRESALIENTE " + (esSobresaliente ? "[X]" : "[ ]");

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);

  // III. PERFIL
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "III. PERFIL DE COMPETENCIAS DEL DOCENTE";
  const compNames = Array(3).fill("0").map((def, i) => evalDoc.compromisosComportamentales[i]?.competencia || def);
  const allCompsX = [...comps.map(c=>c.name), ...compNames];
  const allCompsScores = [...comps.map(c=>Number(findComp(c.name).puntaje)||0), ...Array(3).fill(0).map((_, i) => Number(evalDoc.compromisosComportamentales[i]?.puntaje)||0)];
  
  const chartStartRow = wsData.length;
  for (let i = 10; i >= 1; i--) {
      const yRow = addRow();
      wsData[yRow][0] = (i * 10).toString();
      for (let j = 0; j < allCompsScores.length; j++) {
          if (allCompsScores[j] >= (i * 10)) wsData[yRow][2 + j] = "��";
      }
      wsData[yRow][13] = puntajeTotal >= (i*10) ? "��" : "";
  }
  const xLabelRow = addRow(110);
  wsData[xLabelRow][0] = "0";
  for (let j = 0; j < allCompsX.length; j++) {
      wsData[xLabelRow][2 + j] = allCompsX[j];
  }
  wsData[xLabelRow][13] = "Puntaje final";

  const xCatRow = addRow(30);
  merge(xCatRow, 2, xCatRow, 9); wsData[xCatRow][2] = "COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES";
  merge(xCatRow, 10, xCatRow, 12); wsData[xCatRow][10] = "COMPETENCIAS";
  wsData[xCatRow][13] = "TOTAL";

  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  
  // IV & V
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "IV. CONSTANCIA DE NOTIFICACI�N";
  r = addRow(40); merge(r, 0, r, 17); wsData[r][0] = `En la fecha ___________________ se le notifica a ${teacher.nombre} el resultado total de la Evaluación Anual de Desempeño de Docentes y Directivos Docentes correspondiente al año escolar ${evalDoc.anio}. Se le entrega copia del protocolo y se le informa que ante el mismo proceden los recursos de reposición y apelación, dentro de los diez (10) días hábiles siguientes a esta notificación, ante el evaluador o su inmediato superior jerárquico, según sea el caso.`;
  
  r = addRow(30); merge(r, 0, r, 8); wsData[r][0] = "Nombre completo del docente evaluado:\n" + teacher.nombre; merge(r, 9, r, 17); wsData[r][9] = "Nombre completo del evaluador:\n" + rectorName;
  r = addRow(50); merge(r, 0, r, 8); wsData[r][0] = "Firma y número de documento del docente evaluado:\n\n________________________________\nC.C. " + teacher.cedula; merge(r, 9, r, 17); wsData[r][9] = "Firma y número de documento del evaluador:" + (!isAprobado ? " (Pendiente)" : "") + "\n\n________________________________\nC.C. " + (isAprobado ? rectorCedula : "_______________");
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "Ciudad, fecha y hora:";
  
  r = addRow(); merge(r, 0, r, 17); emptyRowIndices.push(r);
  r = addRow(); merge(r, 0, r, 17); wsData[r][0] = "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL";
  r = addRow(); merge(r, 0, r, 8); wsData[r][0] = "Competencias objeto de mejoramiento, priorizadas con base en los puntajes finales."; merge(r, 9, r, 17); wsData[r][9] = "Estrategias y acciones específicas de mejoramiento. Pueden ser nuevas o continuación de las anteriores";
  r = addRow(100); merge(r, 0, r, 8); wsData[r][0] = evalDoc.evalCompetenciasMejorar || ""; merge(r, 9, r, 17); wsData[r][9] = evalDoc.evalEstrategiasMejorar || "";
  
  r = addRow(30); merge(r, 0, r, 8); wsData[r][0] = "Nombre completo del docente evaluado:\n" + teacher.nombre; merge(r, 9, r, 17); wsData[r][9] = "Nombre completo del evaluador:\n" + rectorName;
  r = addRow(50); merge(r, 0, r, 8); wsData[r][0] = "Firma y número de documento del docente evaluado:\n\n________________________________\nC.C. " + teacher.cedula; merge(r, 9, r, 17); wsData[r][9] = "Firma y número de documento del evaluador:" + (!isAprobado ? " (Pendiente)" : "") + "\n\n________________________________\nC.C. " + (isAprobado ? rectorCedula : "_______________");

  // === APPLY STYLES ===
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = merges;
  
  const colWidths = new Array(COLS).fill({ wch: 7 });
  colWidths[0] = { wch: 11 };
  ws['!cols'] = colWidths;

  for (let R = 0; R < wsData.length; ++R) {
    for (let C = 0; C < COLS; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      
      const val = ws[cellAddress].v;
      const valStr = String(val);
      let style: any = { ...NORMAL_CELL };

      if (R === 0) {
          style = { ...NORMAL_CELL, font: { sz: 10, name: 'Arial', bold: false }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      }
      else if (C >= 13 && C <= 17 && (R >= startFuncRow && R <= startFuncRow + 7 || R >= startCompRow && R <= startCompRow + 2)) {
          style = { ...NORMAL_CELL, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      }
      else if (valStr === "I. IDENTIFICACI�N" || valStr === "A. EVALUADO" || valStr === "B. EVALUADOR" ||
          valStr === "II. VALORACI�N DE LAS COMPETENCIAS" ||
          valStr === "A. COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES (70%)" ||
          valStr === "B. COMPETENCIAS COMPORTAMENTALES (30%)" ||
          valStr === "C. RESULTADO TOTAL (100%)" || valStr === "FINAL" ||
          valStr === "III. PERFIL DE COMPETENCIAS DEL DOCENTE" ||
          valStr === "IV. CONSTANCIA DE NOTIFICACI�N" ||
          valStr === "V. PLAN DE DESARROLLO PERSONAL Y PROFESIONAL") {
          style = { ...SECTION_HEADER };
      }
      else if (valStr === "Tipo de identificación" || valStr === "No." || valStr === "Establecimiento Educativo" ||
               valStr === "Código DANE" || valStr === "Zona" || valStr === "Entidad territorial certificada" ||
               valStr === "Municipio Localidad" || valStr === "Cargo" || valStr === "Año escolar" ||
               valStr === "Fecha inicio" || valStr === "Fecha final" || valStr === "# días licencias incapacidades" ||
               valStr === "Área de gestión" || valStr === "Competencia" || valStr === "Contribución Individual" ||
               valStr === "VALORACI�N" || valStr === "1ra Val." || valStr === "2da Val." || valStr === "Puntaje" || valStr === "Prom." || valStr === "Pond." ||
               valStr === "Subtotal competencias funcionales" || valStr === "CALIFICACI�N TOTAL = Σ PONDERACI�N PROMEDIOS" ||
               valStr === "VALORACI�N FINAL DEL DESEMPE�O" || valStr.includes("NO SATISFACTORIO") || valStr.includes("SOBRESALIENTE") ||
               valStr.includes("Competencias objeto de mejoramiento") || valStr === "Fecha concertación" || valStr === "Fecha valoración") {
          style = { ...SUB_SECTION };
      }
      else if (R >= 2 && R <= 9 && (C === 3 || C === 6 || C === 13 || C === 17 )) {
          if (valStr !== "No." && valStr !== "CC" && valStr !== "Nombres y apellidos") style = { ...YELLOW_CELL };
      }
      else if (R >= 10 && R <= 12 && (C === 2 || C === 6 || C === 12 || C === 19)) {
          style = { ...YELLOW_CELL };
      }
      
      if (R >= chartStartRow && R <= chartStartRow + 9 && valStr === "��") {
          style = { ...NORMAL_CELL, fill: { fgColor: { rgb: "4F81BD" } }, font: { color: { rgb: "4F81BD" } } };
      }
      if (R === xLabelRow) {
          style = { ...NORMAL_CELL, alignment: { textRotation: 90, vertical: 'bottom', horizontal: 'center' } };
      }
      if (valStr === "COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES" || valStr === "COMPETENCIAS" || valStr === "TOTAL") {
          style = { ...NORMAL_CELL, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, font: { sz: 8 } };
      }
      
      if (valStr === "# TOTAL DÍAS VALORADOS") style = { ...SUB_SECTION, font: { bold: true, sz: 8 } };
      
      if (valStr === "70%" || valStr === "30%") style = { ...RED_BG, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER_ALL };

      if (R >= startFuncRow && R < startFuncRow + 8) {
          if (C >= 0 && C <= 1) style = { ...YELLOW_CELL, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
          if (C >= 8 && C <= 12) style = { ...GREEN_CELL };
          if (C >= 13 && C <= 17) style = { ...BLUE_CELL };
      }
      if (R >= startCompRow && R < startCompRow + 3) {
          if (C >= 0 && C <= 12) style = { ...YELLOW_CELL };
          if (C >= 13 && C <= 17) style = { ...BLUE_CELL };
      }
      
      const vStr = String(wsData[R][0]);
      if (vStr.includes("Competencias objeto de mejoramiento")) {
          if (R === r - 3 && C >= 0 && C <= 10) style = { ...GREEN_CELL };
          if (R === r - 3 && C >= 11 && C <= 17) style = { ...GREEN_CELL };
      }
      if (R === r - 2 && C >= 0 && C <= 10) style = { ...GREEN_CELL };
      if (R === r - 2 && C >= 11 && C <= 17) style = { ...GREEN_CELL };

      if (emptyRowIndices.includes(R)) {
          // Just draw left and right outer borders to connect the tables
          style = { ...style, border: { left: {style: 'thin', color: {rgb: '000000'}}, right: {style: 'thin', color: {rgb: '000000'}} } };
      }

      // Center numbers in columns 14 to 17 (Puntaje, Prom, Pond)
      if (C >= 13 && C <= 17 && (valStr === "0.0" || (!isNaN(parseFloat(valStr)) && parseFloat(valStr).toString() === valStr || valStr.match(/^\d+\.\d+$/)))) {
          style = { ...style, alignment: { ...style.alignment, horizontal: 'center' } };
      }

      ws[cellAddress].s = style;
    }
    
    // Empty row styling
    if (emptyRowIndices.includes(R)) {
        ws['!rows'] = ws['!rows'] || [];
        ws['!rows'][R] = { hpt: 4 };
    }
    
    if (R === 0) {
        ws['!rows'] = ws['!rows'] || [];
        ws['!rows'][R] = { hpt: 70 }; // taller header
    }
    
    // Manual row heights for specific text-heavy fields
    if (R === 8) {
        ws['!rows'] = ws['!rows'] || [];
        ws['!rows'][R] = { hpt: 24 }; // B. Evaluador (Nombres largos)
    }
    if (R === 12) {
        ws['!rows'] = ws['!rows'] || [];
        ws['!rows'][R] = { hpt: 26 }; // # dias licencias incapacidades
    }
    
    // Auto row heights
    ws['!rows'] = ws['!rows'] || [];
    if (wsData[R][0] && String(wsData[R][0]).includes("En la fecha")) {
        ws['!rows'][R] = { hpt: 60 };
    }
    
    // Auto row height for long contribucion individual or behaviors
    if (R >= startFuncRow && R < startFuncRow + 8) {
        const textLen = String(wsData[R][8]).length;
        if (textLen > 40) ws['!rows'][R] = { hpt: Math.max(15, Math.ceil(textLen / 40) * 15) };
    }
    if (R >= startCompRow && R < startCompRow + 3) {
        const textLen = String(wsData[R][0]).length;
        if (textLen > 60) ws['!rows'][R] = { hpt: Math.max(15, Math.ceil(textLen / 60) * 15) };
    }
    if (String(wsData[R][0]).length > 100 && !String(wsData[R][0]).includes("En la fecha")) {
        const textLen = String(wsData[R][0]).length;
        ws['!rows'][R] = { hpt: Math.max(15, Math.ceil(textLen / 100) * 15) };
    }
  }

  // Page setup for printing in Letter Size Landscape
  ws['!pageSetup'] = { paperSize: 1, orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };
  
  // Slight reduction in default col width to better fit Letter size
  if (ws['!cols']) {
      ws['!cols'] = ws['!cols'].map(c => ({ wch: c.wch === 7 ? 6 : c.wch }));
      ws['!cols'][0] = { wch: 10 };
  }

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

