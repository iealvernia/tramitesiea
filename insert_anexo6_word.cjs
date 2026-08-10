const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const targetFunction = `  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {`;

const newFunction = `
  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const institutionName = localStorage.getItem('iea_institution_name') || 'INSTITUCIÓN EDUCATIVA';
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
    const rectorName = localStorage.getItem('iea_rector_name') || evalDoc.evaluadorNombre || '';
    const rectorCedula = localStorage.getItem('iea_rector_cedula') || evalDoc.evaluadorCedula || '';
    
    // Funcionales
    const acadCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Académica');
    const adminCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Administrativa');
    const comunCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Comunitaria');
    
    let sumFunc = 0; let countFunc = 0;
    const formatCompFunc = (area: string, comp: CompromisoFuncional | undefined) => {
      if (!comp) return '';
      const p1 = Number(comp.puntaje)||0; const p2 = Number(comp.puntaje2)||0;
      const prom = comp.puntaje && comp.puntaje2 ? (p1+p2)/2 : (p1+p2);
      sumFunc += prom; countFunc++;
      return \`
        <tr>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt;"><b>\${area}</b><br/>\${comp.competencia}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt;">\${comp.contribucion}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${p1.toFixed(1)}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${p2.toFixed(1)}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${prom.toFixed(1)}</td>
        </tr>
      \`;
    };

    let tableFuncs = '';
    acadCompromisos.forEach(c => tableFuncs += formatCompFunc('Académica', c));
    adminCompromisos.forEach(c => tableFuncs += formatCompFunc('Administrativa', c));
    comunCompromisos.forEach(c => tableFuncs += formatCompFunc('Comunitaria', c));
    
    const avgFunc = countFunc > 0 ? sumFunc/countFunc : 0;
    const pondFunc = avgFunc * 0.70;

    // Comportamentales
    let sumComp = 0; let countComp = 0;
    let tableComps = '';
    for(let i=0; i<3; i++) {
        const comp = evalDoc.compromisosComportamentales[i];
        if(!comp) continue;
        const p1 = Number(comp.puntaje)||0; const p2 = Number(comp.puntaje2)||0;
        const prom = comp.puntaje && comp.puntaje2 ? (p1+p2)/2 : (p1+p2);
        sumComp += prom; countComp++;
        tableComps += \`
        <tr>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt;">\${comp.competencia}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt;">\${comp.evidencias || ''}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${p1.toFixed(1)}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${p2.toFixed(1)}</td>
          <td style="border: 1pt solid #000; padding: 4px; font-size: 8pt; text-align: center;">\${prom.toFixed(1)}</td>
        </tr>
      \`;
    }
    const avgComp = countComp > 0 ? sumComp/countComp : 0;
    const pondComp = avgComp * 0.30;
    
    const finalScore = pondFunc + pondComp;
    let evalCat = "No Satisfactorio";
    if (finalScore >= 60 && finalScore < 90) evalCat = "Satisfactorio";
    if (finalScore >= 90) evalCat = "Sobresaliente";

    const htmlContent = \`
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Anexo 6 - Evaluación Final</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 { size: 11.0in 8.5in; mso-page-orientation: landscape; margin: 0.5in; }
          div.Section1 { page: Section1; font-family: Arial, sans-serif; font-size: 9pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          td, th { border: 1pt solid black; padding: 4px; font-size: 9pt; }
          .gray { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .dark-gray { background-color: #d9d9d9; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table style="border: none;">
            <tr>
              <td style="border: none; width: 15%; text-align: center;">
                \${customLogo ? \\\`<img src="\${customLogo}" width="70" />\\\` : ''}
              </td>
              <td style="border: none; width: 85%; text-align: center; font-weight: bold; font-size: 11pt;">
                REPÚBLICA DE COLOMBIA<br/>
                MINISTERIO DE EDUCACIÓN NACIONAL<br/>
                EVALUACIÓN ANUAL DE DESEMPEÑO LABORAL<br/>
                PROTOCOLO PARA LA EVALUACIÓN DE DOCENTES<br/>
                ANEXO 6
              </td>
            </tr>
          </table>

          <table style="margin-top: 10px;">
            <tr><td colspan="7" class="dark-gray">I. IDENTIFICACIÓN</td></tr>
            <tr><td colspan="7" class="gray">A. EVALUADO</td></tr>
            <tr>
              <td colspan="2"><b>Tipo de identificación</b></td>
              <td><b>CC</b></td>
              <td><b>No.</b> \${teacher.cedula}</td>
              <td colspan="3"><b>Nombres y apellidos</b>: \${teacher.nombre}</td>
            </tr>
            <tr>
              <td colspan="2"><b>Establecimiento Educativo</b></td>
              <td colspan="3">\${institutionName}</td>
              <td><b>Código DANE</b>: </td>
              <td><b>Zona</b>: Urbana</td>
            </tr>
            <tr><td colspan="7" class="gray">B. EVALUADOR</td></tr>
            <tr>
              <td colspan="2"><b>Tipo de identificación</b></td>
              <td><b>CC</b></td>
              <td><b>No.</b> \${rectorCedula}</td>
              <td colspan="3"><b>Nombres y apellidos</b>: \${rectorName}</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="6" class="dark-gray">II. VALORACIÓN DE LAS COMPETENCIAS</td></tr>
            <tr>
              <td><b>Año escolar</b>: \${evalDoc.anio}</td>
              <td><b>Fecha inicio</b>: \${evalDoc.evalFechaInicio||''}</td>
              <td><b>Fecha final</b>: \${evalDoc.evalFechaFinal||''}</td>
              <td><b>Fecha concertación</b>: </td>
              <td><b>Fecha valoración</b>: </td>
              <td><b>TOTAL DÍAS VALORADOS</b>: \${evalDoc.evalDiasValorados||0}</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="6" class="dark-gray">A. COMPETENCIAS FUNCIONALES Y CONTRIBUCIONES INDIVIDUALES (70%)</td></tr>
            <tr class="gray">
              <td rowspan="2" style="width: 20%;">Área de gestión / Competencia</td>
              <td rowspan="2" style="width: 50%;">Contribución Individual</td>
              <td colspan="3" style="width: 20%;">VALORACIÓN</td>
              <td rowspan="2" style="width: 10%;">Pond.</td>
            </tr>
            <tr class="gray">
              <td>1ra Val.</td><td>2da Val.</td><td>Prom.</td>
            </tr>
            \${tableFuncs}
            <tr>
              <td colspan="2" style="text-align: right; font-weight: bold;">TOTAL VALORACIÓN DE COMPETENCIAS FUNCIONALES</td>
              <td colspan="3" style="text-align: center; font-weight: bold;">\${avgFunc.toFixed(1)}</td>
              <td style="text-align: center; font-weight: bold;">\${pondFunc.toFixed(1)}</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="6" class="dark-gray">B. COMPETENCIAS COMPORTAMENTALES (30%)</td></tr>
            <tr class="gray">
              <td rowspan="2" style="width: 20%;">Competencia</td>
              <td rowspan="2" style="width: 50%;">Criterios y Evidencias</td>
              <td colspan="3" style="width: 20%;">VALORACIÓN</td>
              <td rowspan="2" style="width: 10%;">Pond.</td>
            </tr>
            <tr class="gray">
              <td>1ra Val.</td><td>2da Val.</td><td>Prom.</td>
            </tr>
            \${tableComps}
            <tr>
              <td colspan="2" style="text-align: right; font-weight: bold;">TOTAL VALORACIÓN DE COMPETENCIAS COMPORTAMENTALES</td>
              <td colspan="3" style="text-align: center; font-weight: bold;">\${avgComp.toFixed(1)}</td>
              <td style="text-align: center; font-weight: bold;">\${pondComp.toFixed(1)}</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="2" class="dark-gray">C. RESULTADO TOTAL (100%)</td></tr>
            <tr>
              <td style="width: 80%; text-align: right; font-weight: bold;">PUNTUACIÓN TOTAL DEL DESEMPEÑO (70% + 30%)</td>
              <td style="width: 20%; text-align: center; font-weight: bold; font-size: 11pt;">\${finalScore.toFixed(1)}</td>
            </tr>
            <tr>
              <td style="text-align: right; font-weight: bold;">ESCALA DE CALIFICACIÓN DE DESEMPEÑO</td>
              <td style="text-align: center; font-weight: bold; font-size: 11pt;">\${evalCat}</td>
            </tr>
          </table>
          <br/>
          <table style="border: none;">
             <tr>
               <td style="border: none; text-align: center; width: 50%;">
                 \${activeRectorSignature ? \\\`<img src="\${activeRectorSignature}" width="150" /><br/>\\\` : '<br/><br/><br/>'}
                 _________________________________________<br/>
                 <b>Firma del Evaluador</b><br/>
                 \${rectorName}<br/>
                 CC \${rectorCedula}
               </td>
               <td style="border: none; text-align: center; width: 50%;">
                 <br/><br/><br/>
                 _________________________________________<br/>
                 <b>Firma del Evaluado</b><br/>
                 \${teacher.nombre}<br/>
                 CC \${teacher.cedula}
               </td>
             </tr>
          </table>
        </div>
      </body>
      </html>
    \`;

    downloadWordBlob(htmlContent, \`Anexo6_Evaluacion_\${teacher.nombre.replace(/\\s+/g, '_')}.doc\`);
  };
` + targetFunction;

c = c.replace(targetFunction, newFunction);
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Anexo 6 Word HTML injection successful');
