import React, { useState, useMemo } from 'react';
import { FileDown, Calendar, School, Users, History, AlertCircle, FilePlus, Search, Clock, ChevronDown, ChevronUp, SlidersHorizontal, Info, FileSpreadsheet } from 'lucide-react';
import { Employee, Novedad, SEDES_OPCIONES } from '../types';
// @ts-ignore
import XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

interface ReportsPanelProps {
  employees: Employee[];
  novedades: Novedad[];
}

export default function ReportsPanel({ employees, novedades }: ReportsPanelProps) {
  // Filters state
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthValue = String(new Date().getMonth() + 1).padStart(2, '0'); // Colombian format is standard

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('TODAS');

  // Year options list
  const yearOptions = useMemo(() => {
    const years = new Set<string>([currentYearStr]);
    novedades.forEach(n => {
      const year = n.fechaInicio.substring(0, 4);
      if (year && year.length === 4) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [novedades, currentYearStr]);

  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Helper dictionary for easy employee access
  const employeesDict = useMemo(() => {
    const dict: Record<string, Employee> = {};
    employees.forEach(emp => {
      dict[emp.cedula] = emp;
    });
    return dict;
  }, [employees]);

  // Filtered novedades based on month, year, and optionally Sede
  const filteredNovedades = useMemo(() => {
    return novedades.filter(n => {
      const startYear = n.fechaInicio.substring(0, 4);
      const startMonth = n.fechaInicio.substring(5, 7);
      
      const yearMatch = startYear === selectedYear;
      const monthMatch = startMonth === selectedMonth;
      const sedeMatch = selectedSedeFilter === 'TODAS' || n.sedeNovedad === selectedSedeFilter;

      return yearMatch && monthMatch && sedeMatch;
    });
  }, [novedades, selectedYear, selectedMonth, selectedSedeFilter]);

  // Metric computations
  const stats = useMemo(() => {
    const totalPermisos = filteredNovedades.length;
    
    // Group by Sede counts
    const countBySede: Record<string, number> = {};
    SEDES_OPCIONES.forEach(s => { countBySede[s] = 0; });
    
    // Unique employees who requested permissions
    const uniqueEmployeesMap = new Set<string>();

    // Count by leave type
    const countByType: Record<string, number> = {};

    filteredNovedades.forEach(n => {
      // Sede count
      countBySede[n.sedeNovedad] = (countBySede[n.sedeNovedad] || 0) + 1;
      
      // Unique employees count
      uniqueEmployeesMap.add(n.empleadoId);

      // Leave type count
      countByType[n.claseNovedad] = (countByType[n.claseNovedad] || 0) + 1;
    });

    let maxSede = 'Ninguna';
    let maxSedeCount = -1;
    Object.entries(countBySede).forEach(([sede, ct]) => {
      if (ct > maxSedeCount && ct > 0) {
        maxSedeCount = ct;
        maxSede = sede;
      }
    });

    let maxType = 'Ninguna';
    let maxTypeCount = -1;
    Object.entries(countByType).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        maxType = type;
      }
    });

    return {
      totalPermisos,
      uniqueEmployees: uniqueEmployeesMap.size,
      maxSede,
      maxSedeCount: maxSedeCount > 0 ? maxSedeCount : 0,
      maxType,
      countBySede
    };
  }, [filteredNovedades]);

  // List of teachers (docentes/directivos) with permissions for the specific report "Permisos por Docente por Sede"
  const docetesReportRows = useMemo(() => {
    return filteredNovedades.map((n, idx) => {
      const emp = employeesDict[n.empleadoId];
      return {
        id: n.id,
        item: idx + 1,
        nombre: emp ? emp.nombre : 'Empleado no registrado',
        cedula: n.empleadoId,
        cargo: emp ? emp.cargo : 'No aplica',
        areaDesempeno: emp ? emp.areaDesempeno : 'No aplica',
        sedeNovedad: n.sedeNovedad,
        claseNovedad: n.claseNovedad,
        fechaInicio: n.fechaInicio.replace('T', ' '),
        fechaFin: n.fechaFin.replace('T', ' '),
        soporte: `${n.documentoSoporteTipo}-${n.documentoSoporteNo || 'Sin número'}`
      };
    });
  }, [filteredNovedades, employeesDict]);

  const activeMonthLabel = meses.find(m => m.value === selectedMonth)?.label || 'Mes';
  // Excel Exporter
  const handleExportExcel = (onlyWithPermissions: boolean = false) => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary matrix per Sede
    const summaryData = SEDES_OPCIONES.map((sede) => ({
      'SEDE': SedeFormat(sede),
      'Permisos Solicitados': stats.countBySede[sede] || 0,
    }));
    
    // We will build a beautiful summary text block
    const summaryRowsList = [
      ["INSTITUCION EDUCATIVA ALVERNIA", ""],
      ["REPORTE MENSUAL DE NOVEDADES POR SEDE", ""],
      [`PERIODO: ${activeMonthLabel.toUpperCase()} DE ${selectedYear}`, ""],
      ["", ""],
      ["SEDE / ANEXO DE LA INSTITUCIÓN", "CANTIDAD DE PERMISOS / NOVEDADES REGISTRADAS"]
    ];

    summaryData.forEach(d => {
      summaryRowsList.push([d['SEDE'], String(d['Permisos Solicitados'])]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRowsList);

    // Merges for the title info on sheet 1
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];

    wsSummary['!cols'] = [
      { wch: 45 },
      { wch: 50 }
    ];

    // Explicitly enable gridlines on sheet 1
    wsSummary['!views'] = [{ showGridLines: true }];
    wsSummary['!showGridLines'] = true;
    wsSummary['!showGrid'] = 1;

    // Apply Styles to Sheet 1 (Summary)
    Object.keys(wsSummary).forEach(key => {
      if (key.startsWith('!')) return;
      const cell = wsSummary[key];
      if (!cell) return;

      const match = key.match(/^([A-Z]+)([0-9]+)$/);
      if (!match) return;

      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10);

      cell.s = {
        font: { name: 'Calibri', sz: 10, color: { rgb: "000000" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "BFBFBF" } },
          bottom: { style: "thin", color: { rgb: "BFBFBF" } },
          left: { style: "thin", color: { rgb: "BFBFBF" } },
          right: { style: "thin", color: { rgb: "BFBFBF" } }
        }
      };

      if (rowNum <= 3) {
        cell.s.fill = { fgColor: { rgb: "DFEDF4" } };
        cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: "1E3A8A" } };
        cell.s.alignment = { horizontal: "center", vertical: "center" };
      } else if (rowNum === 5) {
        cell.s.fill = { fgColor: { rgb: "D9E1F2" } };
        cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: "1F2937" } };
        cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      } else {
        if (colLetter === 'B') {
          cell.s.alignment = { horizontal: "center", vertical: "center" };
        } else {
          cell.s.alignment = { horizontal: "left", vertical: "center" };
        }
      }
    });

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen por Sede');

    // Sheet 2: Complete Detailed Report matching the user's image exactly!
    const excelRows: any[] = [];

    // General Informational Headers for a high-quality report at the top of the table
    excelRows.push([
      "INSTITUCION EDUCATIVA ALVERNIA - CERTIFICADO MENSUAL DE SEGUIMIENTO Y CONTROL",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ]);
    excelRows.push([
      onlyWithPermissions
        ? "REPORTE DE DOCENTES QUE SOLICITARON PERMISOS O LICENCIAS POR SEDE"
        : "REPORTE GENERAL DE CONSOLIDADO MENSUAL DE NOVEDADES DEL PERSONAL (DOCENTES - DIRECTIVOS - ADMINISTRATIVOS)",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ]);
    excelRows.push([
      `PERIODO EVALUADO: ${activeMonthLabel.toUpperCase()} DE ${selectedYear}   |   SEDE REPORTE: ${SedeFormat(selectedSedeFilter).toUpperCase()}   |   EXTRACTO: ${new Date().toLocaleDateString('es-CO')}`,
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ]);
    excelRows.push([
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ]); // Spacer row

    // Double Header row starts here (at rowIndex = 4)
    // Header Row 1 (rowNum = 5)
    excelRows.push([
      "ITEM",
      "NOMBRE Y APELLIDOS",
      "CEDULA DEL FUNCIONARIO",
      "CARGO",
      "DONDE SE PRESENTÓ LA NOVEDAD",
      "Dificil Acceso",
      "H/A",
      "H/L",
      "AREA DE DESEMPEÑO",
      "CLASE DE NOVEDAD (Seleccione una opción)",
      "Tipo de Nombramiento",
      "OBLIGATORIO para la clase de novedad (Presentación del personal a laborar)",
      "", // merged column
      "FECHA INICIO DE LA NOVEDAD",
      "", // merged column
      "", // merged column
      "FECHA FINAL DE LA NOVEDAD",
      "", // merged column
      "", // merged column
      "DOCUMENTO QUE LO SOPORTA",
      "", // merged column
      ""  // merged column
    ]);

    // Header Row 2 (at rowIndex = 5, rowNum = 6)
    excelRows.push([
      "", // merged with index 4,0
      "", // merged with index 4,1
      "", // merged with index 4,2
      "", // merged with index 4,3
      "", // merged with index 4,4
      "", // merged with index 4,5
      "Aula",
      "Aula",
      "", // merged with index 4,8
      "", // merged with index 4,9
      "", // merged with index 4,10
      "Está laborando normalmente",
      "Se le asignó carga académica",
      "DIA",
      "MES",
      "AÑO",
      "DIA",
      "MES",
      "AÑO",
      "Tipo",
      "No.",
      "Fecha (dd/mm/aaaa)"
    ]);

    // Format support document tipo label to be clear
    const getSoporteTipoLabel = (tipo: string) => {
      switch (tipo) {
        case 'R': return 'R - Resolución';
        case 'D': return 'D - Decreto';
        case 'A': return 'A - Acta';
        case 'I': return 'I - Incapacidad';
        case 'P': return 'P - Permiso';
        case 'O': return 'O - Oficio';
        default: return tipo ? `${tipo} - Soporte` : '';
      }
    };

     // Filter relevant employees: all active ones belonging to Sede, plus inactive ones who had a processed permission
    const allRelevantEmployees = employees.filter(emp => {
      const belongsToSede = selectedSedeFilter === 'TODAS' || emp.sedeTrabajo === selectedSedeFilter;
      const hasNoveltyThisPeriod = filteredNovedades.some(n => n.empleadoId === emp.cedula);

      if (onlyWithPermissions) {
        return belongsToSede && hasNoveltyThisPeriod;
      }

      if (emp.activo && belongsToSede) {
        return true;
      }
      if (hasNoveltyThisPeriod && belongsToSede) {
        return true;
      }
      return false;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));

    let itemCount = 1;

    allRelevantEmployees.forEach((emp) => {
      // Find logged permissions for this user this month
      const empNovelties = filteredNovedades.filter(n => n.empleadoId === emp.cedula);

      if (empNovelties.length === 0) {
        // Person with no active novelty this month -> listed with "No presenta Novedad"
        excelRows.push([
          itemCount++,                                         // ITEM
          emp.nombre.toUpperCase(),                            // NOMBRE Y APELLIDOS
          emp.cedula,                                          // CEDULA DEL FUNCIONARIO
          emp.cargo,                                           // CARGO
          SedeFormat(emp.sedeTrabajo),                         // SEDE DONDE SE PRESENTO LA NOVEDAD
          emp.dificilAcceso || 'No',                           // Dificil Acceso
          emp.horasAula || 0,                                  // H/A Aula
          emp.horasLibres || 0,                                // H/L Aula
          emp.areaDesempeno || 'No Aplica',                    // AREA DE DESEMPENO
          'No presenta Novedad',                               // CLASE DE NOVEDAD
          emp.tipoNombramiento || '',                          // Tipo de Nombramiento
          '',                                                  // Está laborando normalmente
          '',                                                  // Se le asignó carga académica
          '',                                                  // Start DIA
          '',                                                  // Start MES
          '',                                                  // Start AÑO
          '',                                                  // End DIA
          '',                                                  // End MES
          '',                                                  // End AÑO
          '',                                                  // Support Document Tipo
          '',                                                  // Support Document No
          ''                                                   // Support Document Fecha
        ]);
      } else {
        // Double loop if multiple novelties exist for same person in selected month
        empNovelties.forEach((n) => {
          let startDia = '', startMes = '', startAno = '';
          if (n.fechaInicio && n.fechaInicio.length >= 10) {
            startAno = n.fechaInicio.substring(0, 4);
            startMes = String(parseInt(n.fechaInicio.substring(5, 7), 10));
            startDia = String(parseInt(n.fechaInicio.substring(8, 10), 10));
          }

          let endDia = '', endMes = '', endAno = '';
          if (n.fechaFin && n.fechaFin.length >= 10) {
            endAno = n.fechaFin.substring(0, 4);
            endMes = String(parseInt(n.fechaFin.substring(5, 7), 10));
            endDia = String(parseInt(n.fechaFin.substring(8, 10), 10));
          }

          let docFechaFormatted = '';
          if (n.documentoSoporteFecha && n.documentoSoporteFecha.length >= 10) {
            const docAno = n.documentoSoporteFecha.substring(0, 4);
            const docMes = String(parseInt(n.documentoSoporteFecha.substring(5, 7), 10));
            const docDia = String(parseInt(n.documentoSoporteFecha.substring(8, 10), 10));
            docFechaFormatted = `${docDia}/${docMes}/${docAno}`;
          }

          excelRows.push([
            itemCount++,                                         // ITEM
            emp.nombre.toUpperCase(),                            // NOMBRE Y APELLIDOS
            emp.cedula,                                          // CEDULA DEL FUNCIONARIO
            emp.cargo,                                           // CARGO
            SedeFormat(n.sedeNovedad || emp.sedeTrabajo),        // SEDE DONDE SE PRESENTO LA NOVEDAD
            emp.dificilAcceso || 'No',                           // Dificil Acceso
            emp.horasAula || 0,                                  // H/A Aula
            emp.horasLibres || 0,                                // H/L Aula
            emp.areaDesempeno || 'No Aplica',                    // AREA DE DESEMPENO
            n.claseNovedad || 'No presenta Novedad',             // CLASE DE NOVEDAD
            emp.tipoNombramiento || '',                          // Tipo de Nombramiento
            n.estaLaborandoNormalmente || '',                     // Está laborando normalmente
            n.seLeAsignoCargaAcademica || '',                    // Se le asignó carga académica
            startDia,                                            // Start DIA
            startMes,                                            // Start MES
            startAno,                                            // Start AÑO
            endDia,                                              // End DIA
            endMes,                                              // End MES
            endAno,                                              // End AÑO
            getSoporteTipoLabel(n.documentoSoporteTipo),         // Support Document Tipo
            n.documentoSoporteNo || '',                          // Support Document No
            docFechaFormatted                                    // Support Document Fecha
          ]);
        });
      }
    });

    const wsDetailed = XLSX.utils.aoa_to_sheet(excelRows);

    // Beautiful Cell Merges according to standard double-header layout, shifted by 4 rows of title offset
    wsDetailed['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } },  // Title Row 1 Merged across all cols
      { s: { r: 1, c: 0 }, e: { r: 1, c: 21 } },  // Title Row 2 Merged across all cols
      { s: { r: 2, c: 0 }, e: { r: 2, c: 21 } },  // Info Row 3 Merged across all cols

      { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },  // ITEM
      { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },  // NOMBRE Y APELLIDOS
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },  // CEDULA
      { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },  // CARGO
      { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },  // SEDE / DONDE SE PRESENTO
      { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } },  // Dificil Acceso
      { s: { r: 4, c: 8 }, e: { r: 5, c: 8 } },  // AREA DE DESEPEÑO
      { s: { r: 4, c: 9 }, e: { r: 5, c: 9 } },  // CLASE DE NOVEDAD
      { s: { r: 4, c: 10 }, e: { r: 5, c: 10 } }, // Tipo de Nombramiento
      { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } }, // OBLIGATORIO para ... (horizontal merge)
      { s: { r: 4, c: 13 }, e: { r: 4, c: 15 } }, // FECHA INICIO (horizontal merge)
      { s: { r: 4, c: 16 }, e: { r: 4, c: 18 } }, // FECHA FINAL (horizontal merge)
      { s: { r: 4, c: 19 }, e: { r: 4, c: 21 } }  // DOCUMENTO QUE LO SOPORTA (horizontal merge)
    ];

    // Perfect fit column widths for columns 1 to 22
    wsDetailed['!cols'] = [
      { wch: 6 },  // ITEM
      { wch: 35 }, // NOMBRE Y APELLIDOS
      { wch: 16 }, // CEDULA DEL FUNCIONARIO
      { wch: 26 }, // CARGO En la planilla
      { wch: 25 }, // SEDE DONDE SE PRESENTO LA NOVEDAD
      { wch: 10 }, // Dificil Acceso
      { wch: 8 },  // H/A
      { wch: 8 },  // H/L
      { wch: 25 }, // AREA DE DESEMPEÑO
      { wch: 32 }, // CLASE DE NOVEDAD
      { wch: 18 }, // Tipo de Nombramiento
      { wch: 22 }, // Está laborando normalmente
      { wch: 22 }, // Se le asignó carga académica
      { wch: 6 },  // Start DIA
      { wch: 6 },  // Start MES
      { wch: 8 },  // Start AÑO
      { wch: 6 },  // End DIA
      { wch: 6 },  // End MES
      { wch: 8 },  // End AÑO
      { wch: 15 }, // Doc Tipo
      { wch: 12 }, // Doc No
      { wch: 16 }  // Doc Fecha
    ];

    // Explicitly enable gridlines on sheet 2
    wsDetailed['!views'] = [{ showGridLines: true }];
    wsDetailed['!showGridLines'] = true;
    wsDetailed['!showGrid'] = 1;

    // Apply beautiful styling to Sheet 2 (Detailed Report) with explicit cell grid borders and colors!
    Object.keys(wsDetailed).forEach(key => {
      if (key.startsWith('!')) return;
      const cell = wsDetailed[key];
      if (!cell) return;

      const match = key.match(/^([A-Z]+)([0-9]+)$/);
      if (!match) return;

      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10);

      // Default Style for all cells
      cell.s = {
        font: { name: 'Calibri', sz: 9, color: { rgb: "000000" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "BFBFBF" } },
          bottom: { style: "thin", color: { rgb: "BFBFBF" } },
          left: { style: "thin", color: { rgb: "BFBFBF" } },
          right: { style: "thin", color: { rgb: "BFBFBF" } }
        }
      };

      if (rowNum <= 3) {
        // Title banner (Rows 1 to 3) -> Beautiful corporate blue-teal banner
        cell.s.fill = { fgColor: { rgb: "DFEDF4" } };
        cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: "1E3A8A" } };
        cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      } else if (rowNum === 4) {
        // Empty spacer row -> keep standard blank style without heavy borders
        cell.s.border = {};
      } else if (rowNum === 5 || rowNum === 6) {
        // Table Headers (Rows 5 & 6) -> Custom elegant color blocks matching user's screenshots!
        let headerBgColor = "D9E1F2"; // Default elegant soft blue-lavender

        if (colLetter === 'L' || colLetter === 'M') {
          headerBgColor = "FCE4D6"; // Soft Salmon-Peach
        } else if (colLetter === 'N' || colLetter === 'O' || colLetter === 'P' || colLetter === 'Q' || colLetter === 'R' || colLetter === 'S') {
          headerBgColor = "FFF2CC"; // Soft Cream-Yellow
        } else if (colLetter === 'T' || colLetter === 'U' || colLetter === 'V') {
          headerBgColor = "E2EFDA"; // Soft Mint-Green
        }

        cell.s.fill = { fgColor: { rgb: headerBgColor } };
        cell.s.font = { name: 'Calibri', sz: 9, bold: true, color: { rgb: "1F2937" } };
        cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        cell.s.border = {
          top: { style: "medium", color: { rgb: "595959" } },
          bottom: { style: "medium", color: { rgb: "595959" } },
          left: { style: "thin", color: { rgb: "BFBFBF" } },
          right: { style: "thin", color: { rgb: "BFBFBF" } }
        };
      } else {
        // Data Rows (Row 7+)
        // Horizontal Alignments
        if (
          colLetter === 'A' || 
          colLetter === 'C' || 
          colLetter === 'F' || 
          colLetter === 'G' || 
          colLetter === 'H' || 
          colLetter === 'N' || 
          colLetter === 'O' || 
          colLetter === 'P' || 
          colLetter === 'Q' || 
          colLetter === 'R' || 
          colLetter === 'S' || 
          colLetter === 'T' || 
          colLetter === 'U' || 
          colLetter === 'V'
        ) {
          cell.s.alignment = { horizontal: "center", vertical: "center" };
        } else {
          cell.s.alignment = { horizontal: "left", vertical: "center" };
        }

        // Slight text styles for items
        if (colLetter === 'B') {
          cell.s.font = { name: 'Calibri', sz: 9, bold: true }; // Bold names
        } else if (colLetter === 'J') {
          // Highlight active novelties
          const isNovelty = cell.v && cell.v !== 'No presenta Novedad' && cell.v !== '';
          if (isNovelty) {
            cell.s.font = { name: 'Calibri', sz: 9, bold: true, color: { rgb: "9C0006" } }; // Dark red text
            cell.s.fill = { fgColor: { rgb: "FFC7CE" } }; // Soft red fill
          }
        }
      }
    });

    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Reporte de Permisos Docentes');

    // Save File
    const nameSuffix = onlyWithPermissions ? 'Solo_Docentes_Con_Permiso' : 'Permisos_Alvernia';
    XLSX.writeFile(wb, `Reporte_${nameSuffix}_${activeMonthLabel}_${selectedYear}.xlsx`);
  };

  const SedeFormat = (sedeName: string) => {
    if (sedeName === 'COL ALVERNIA' || sedeName === 'IE ALVERNIA') return 'IE ALVERNIA';
    return sedeName;
  };

  // PDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter'
    });

    const primaryColor = [37, 99, 235]; // Blue 600

    // Frame styling & Header
    doc.setFillColor(248, 250, 252); // soft slate border
    doc.rect(5, 5, 269, 205, 'F');
    
    // Header banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(10, 10, 259, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INSTITUCION EDUCATIVA ALVERNIA', 15, 18);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('SISTEMA CRM - GESTIÓN DE PERMISOS Y NOVEDADES DEL PERSONAL', 15, 24);
    doc.text(`Expedido el: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`, 200, 18);
    
    // Meta descriptions
    doc.setTextColor(15, 23, 42); // slate 900
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('REPORTE GENERAL DE SOLICITUD DE PERMISOS Y ASISTENCIA', 12, 45);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Año Seleccionado: ${selectedYear}`, 12, 51);
    doc.text(`Mes del Reporte: ${activeMonthLabel}`, 12, 56);
    doc.text(`Filtro de Sede: ${selectedSedeFilter}`, 12, 61);

    // Summary counters table
    const summaryHeaders = [['SEDE O SUBSEDE', 'NÚMERO DE PERMISOS E INCIDENTES EN ESTE PERIODO']];
    const summaryRows = SEDES_OPCIONES.map(sede => [
      SedeFormat(sede),
      `${stats.countBySede[sede] || 0} novedad(es)`
    ]);
    summaryRows.push(['TOTAL INSTITUCIONAL', `${stats.totalPermisos} registros procesados`]);

    autoTable(doc, {
      head: summaryHeaders,
      body: summaryRows,
      startY: 68,
      margin: { left: 12, right: 12 },
      styles: { fontSize: 8, font: 'Helvetica' },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 } }
    });

    // Page Break or append teachers list in same document
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DETALLE DE PERMISOS SOLICITADOS POR DOCENTES Y PERSONAL ADMINISTRATIVO', 12, currentY);

    const detailedHeaders = [[
      'No.',
      'Nombre Completo',
      'Cédula',
      'Cargo',
      'Sede Presentó',
      'Clase de Novedad',
      'Fecha Inicio',
      'Fecha Fin',
      'Soporte'
    ]];

    const detailedRows = docetesReportRows.map(row => [
      row.item,
      row.nombre,
      row.cedula,
      row.cargo.substring(0, 30),
      row.sedeNovedad,
      row.claseNovedad.substring(0, 25),
      row.fechaInicio.substring(0, 10) + ' ' + row.fechaInicio.substring(11, 16),
      row.fechaFin.substring(0, 10) + ' ' + row.fechaFin.substring(11, 16),
      row.soporte
    ]);

    autoTable(doc, {
      head: detailedHeaders,
      body: detailedRows,
      startY: currentY + 4,
      margin: { left: 12, right: 12 },
      styles: { fontSize: 7.5, font: 'Helvetica' },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 
        1: { fontStyle: 'bold', cellWidth: 45 },
        3: { cellWidth: 40 },
        5: { cellWidth: 35 }
      }
    });

    // Signatures footer
    const finalTableY = (doc as any).lastAutoTable.finalY + 15;
    if (finalTableY < 190) {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(15, finalTableY + 15, 80, finalTableY + 15);
      doc.line(180, finalTableY + 15, 245, finalTableY + 15);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Firma Rector / Directivo', 30, finalTableY + 19);
      doc.text('Firma Encargado de Talento Humano', 190, finalTableY + 19);
    }

    doc.save(`Reporte_Permisos_I.E._Alvernia_${activeMonthLabel}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-6" id="reports-panel">
      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap gap-4 items-end shadow-sm" id="reports-filters-bar">
        
        <div className="flex-1 min-w-[140px] space-y-1.5" id="filter-year-wrapper">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Año Escolar
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white pr-4 pl-9 py-2 rounded-xl text-slate-700 text-sm border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              id="select-report-year"
            >
              {yearOptions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[140px] space-y-1.5" id="filter-month-wrapper">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Mes de Novedad
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white pr-4 pl-9 py-2 rounded-xl text-slate-700 text-sm border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              id="select-report-month"
            >
              {meses.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[160px] space-y-1.5" id="filter-sede-wrapper">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Filtrar por Sede
          </label>
          <div className="relative">
            <School className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedSedeFilter}
              onChange={(e) => setSelectedSedeFilter(e.target.value)}
              className="w-full bg-white pr-4 pl-9 py-2 rounded-xl text-slate-700 text-sm border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              id="select-report-sede"
            >
              <option value="TODAS">TODAS LAS SEDES</option>
              {SEDES_OPCIONES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap" id="report-action-buttons">
          <button
            onClick={() => handleExportExcel(false)}
            className="flex-1 sm:flex-initial py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium border border-blue-100 cursor-pointer text-xs h-[38px]"
            id="btn-export-excel"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            Consolidado General (Excel)
          </button>

          <button
            onClick={() => handleExportExcel(true)}
            className="flex-1 sm:flex-initial py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium border border-emerald-200 cursor-pointer text-xs h-[38px]"
            title="Descargar solo docentes que solicitaron permisos por Sede"
            id="btn-export-only-permissions-excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Solo Docentes con Permisos (Excel)
          </button>
          
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors font-semibold shadow-sm cursor-pointer text-xs h-[38px]"
            id="btn-export-pdf"
          >
            <FileDown className="w-4 h-4" />
            Generar PDF Oficial
          </button>
        </div>

      </div>

      {/* Metrics breakdown board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="report-metrics-grid">
        <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 flex flex-col justify-between" id="metric-permisos-totales">
          <div className="p-2 bg-blue-100/50 rounded-xl text-blue-700 w-fit mb-3">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPermisos}</p>
            <p className="text-slate-500 text-xs font-semibold">Permisos en {activeMonthLabel} de {selectedYear}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm" id="metric-empleados-solicitantes">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700 w-fit mb-3">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.uniqueEmployees}</p>
            <p className="text-slate-500 text-xs font-semibold">Docentes / Servidores con novedades</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm" id="metric-sede-max-novedades">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700 w-fit mb-3">
            <School className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-base font-bold text-blue-700 truncate" title={SedeFormat(stats.maxSede)}>
              {SedeFormat(stats.maxSede)}
            </p>
            <p className="text-slate-500 text-xs font-semibold truncate">
              Sede concurrida ({stats.maxSedeCount} novedades)
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm" id="metric-tipo-frecuente">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700 w-fit mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 truncate" title={stats.maxType}>
              {stats.maxType}
            </p>
            <p className="text-slate-500 text-xs font-semibold">Incidencia más reportada</p>
          </div>
        </div>
      </div>

      {/* Graphical layout bar counts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="charts-distribution-section">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
          <School className="w-4 h-4 text-blue-600" />
          Distribución de Permisos y Licencias por Sede ({activeMonthLabel} {selectedYear})
        </h3>
        
        <div className="space-y-4" id="distribution-meters">
          {SEDES_OPCIONES.map(sede => {
            const count = stats.countBySede[sede] || 0;
            const percentage = stats.totalPermisos > 0 ? (count / stats.totalPermisos) * 100 : 0;
            return (
              <div key={sede} className="space-y-1.5" id={`meter-row-${sede.replace(/\s+/g, '-')}`}>
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>{SedeFormat(sede)}</span>
                  <span className="font-bold text-slate-800">{count} novedad(es) ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(3, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Docentes / Funcionarios report details */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="teachers-detailed-report-block">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-base" id="report-grid-title">
              Docentes que solicitaron Permisos por Sede
            </h3>
            <p className="text-xs text-slate-500">
              Registros correspondientes a <span className="font-semibold text-blue-700">{activeMonthLabel} de {selectedYear}</span>
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-750 font-bold px-2.5 py-1 rounded-full border border-blue-100">
            {docetesReportRows.length} resultados encontrados
          </span>
        </div>

        {docetesReportRows.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl" id="empty-state-report">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
            <p className="text-slate-600 font-medium text-sm">No hay reportes de permisos en este periodo</p>
            <p className="text-slate-450 text-xs">Intenta modificando los filtros de mes y año o ingresando nuevos permisos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl" id="table-report-block">
            <table className="w-full text-left border-collapse text-xs" id="table-report-docentes">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3">No.</th>
                  <th className="p-3">Docente / Funcionario</th>
                  <th className="p-3">Cédula</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Área de Desempeño</th>
                  <th className="p-3">Sede Novedad</th>
                  <th className="p-3">Clase Novedad</th>
                  <th className="p-3">Desde</th>
                  <th className="p-3">Hasta</th>
                  <th className="p-3">Soporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {docetesReportRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-400">{row.item}</td>
                    <td className="p-3 font-semibold text-slate-900">{row.nombre}</td>
                    <td className="p-3 font-mono text-slate-500">{row.cedula}</td>
                    <td className="p-3 font-medium text-slate-600">{row.cargo}</td>
                    <td className="p-3 text-slate-500">{row.areaDesempeno}</td>
                    <td className="p-3 font-semibold text-blue-750">{SedeFormat(row.sedeNovedad)}</td>
                    <td className="p-3 text-red-700/80 font-semibold">{row.claseNovedad}</td>
                    <td className="p-3 whitespace-nowrap">{row.fechaInicio}</td>
                    <td className="p-3 whitespace-nowrap">{row.fechaFin}</td>
                    <td className="p-3 font-mono">
                      <span className="bg-slate-50 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                        {row.soporte}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
