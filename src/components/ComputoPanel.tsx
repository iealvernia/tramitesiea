import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Search, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  History, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Employee, Novedad, SEDES_OPCIONES } from '../types';
// @ts-ignore
import XLSX from 'xlsx-js-style';

interface ComputoPanelProps {
  employees: Employee[];
  novedades: Novedad[];
  hasPermission?: (modulo: string, accion?: "VIEW" | "MODIFICAR" | "ELIMINAR") => boolean;
}

export default function ComputoPanel({ employees, novedades, hasPermission }: ComputoPanelProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const now = new Date();
  
  // Calculate default current month
  const defaultAnalisisMonth = String(now.getMonth() + 1).padStart(2, '0');
  const defaultAnalisisYear = String(now.getFullYear());

  const [analisisMonth, setAnalisisMonth] = useState<string>(defaultAnalisisMonth);
  const [analisisYear, setAnalisisYear] = useState<string>(defaultAnalisisYear);
  const [analisisSearch, setAnalisisSearch] = useState<string>('');
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  // Helper dictionary of employees indexed by Cédula
  const employeesDict = useMemo(() => {
    const dict: Record<string, Employee> = {};
    employees.forEach(e => {
      dict[e.cedula] = e;
    });
    return dict;
  }, [employees]);

  // Year options list
  const yearOptions = useMemo(() => {
    const years = new Set<string>([currentYearStr]);
    novedades.forEach(n => {
      if (n.fechaInicio) {
        years.add(n.fechaInicio.substring(0, 4));
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
    { value: '12', label: 'Diciembre' }
  ];

  // Helper to format Spanish datetimes for display
  const formatDetailedDateTime = (str: string) => {
    if (!str) return '';
    const datePart = str.substring(0, 10);
    const timePart = str.substring(11, 16);
    const [year, month, day] = datePart.split('-');
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIndex = parseInt(month, 10) - 1;
    const monthStr = monthNames[mIndex] || month;

    return `${day} de ${monthStr} de ${year} (${timePart})`;
  };

  // Helper to parse and calculate duration in days and hours
  const getDurationInDays = (fechaInicioStr: string, fechaFinStr: string): { days: number; hours: number; label: string } => {
    if (!fechaInicioStr || !fechaFinStr) return { days: 0, hours: 0, label: '0 días' };
    const start = new Date(fechaInicioStr);
    const end = new Date(fechaFinStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { days: 0, hours: 0, label: '0 días' };
    }
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) {
      return { days: 0, hours: 0, label: '0 días' };
    }

    const diffHours = diffMs / (1000 * 60 * 60);

    // If it's the exact same calendar day
    const isSameDay = start.getFullYear() === end.getFullYear() &&
                      start.getMonth() === end.getMonth() &&
                      start.getDate() === end.getDate();

    if (isSameDay) {
      // Si el permiso en el mismo día es de 6 o más horas, se cuenta como un día completo (1.0 día)
      if (diffHours >= 6) {
        return { days: 1, hours: diffHours, label: '1 día' };
      }
      
      // Si es menor a 6 horas, se cuenta estrictamente por horas, usando jornada base de 8 horas
      const roundedDays = Math.round((diffHours / 8) * 10) / 10;
      const hourLabel = diffHours === 1 ? '1 hora' : `${Math.round(diffHours * 10) / 10} horas`;
      return { 
        days: roundedDays, 
        hours: diffHours, 
        label: `${hourLabel}` 
      };
    } else {
      // Days difference + 1 to include start day
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const calendarDays = Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { days: calendarDays, hours: diffHours, label: calendarDays === 1 ? '1 día' : `${calendarDays} días` };
    }
  };

  // Filtered novelties for calculations module
  const analisisNovedades = useMemo(() => {
    return novedades.filter(n => {
      if (!n.fechaInicio) return false;
      const year = n.fechaInicio.substring(0, 4);
      const month = n.fechaInicio.substring(5, 7);
      return year === analisisYear && month === analisisMonth;
    });
  }, [novedades, analisisMonth, analisisYear]);

  // Grouped and sorted teachers with calculated sum of days in selected month
  const teachersWithPermissions = useMemo(() => {
    const grouped: Record<string, typeof analisisNovedades> = {};
    analisisNovedades.forEach(n => {
      if (!grouped[n.empleadoId]) {
        grouped[n.empleadoId] = [];
      }
      grouped[n.empleadoId].push(n);
    });

    const result = Object.entries(grouped).map(([cedula, novs]) => {
      const emp = employeesDict[cedula];
      
      const novsWithDuration = novs.map(n => {
        const duration = getDurationInDays(n.fechaInicio, n.fechaFin);
        return {
          ...n,
          calculatedDays: duration.days,
          calculatedHours: duration.hours,
          durationLabel: duration.label
        };
      });

      const totalDays = novsWithDuration.reduce((acc, curr) => acc + curr.calculatedDays, 0);

      return {
        id: cedula,
        nombre: emp ? emp.nombre : 'Empleado no registrado',
        cargo: emp ? emp.cargo : 'No registrado',
        sede: emp ? emp.sedeTrabajo : 'No registrada',
        activo: emp ? (emp.activo ? 'ACTIVO' : 'INACTIVO') : 'N/A',
        cedula,
        totalDays,
        novelties: novsWithDuration
      };
    });

    return result.sort((a, b) => b.totalDays - a.totalDays);
  }, [analisisNovedades, employeesDict]);

  // Filter results of the interactive calculation module
  const filteredAnalysisTeachers = useMemo(() => {
    if (!analisisSearch.trim()) return teachersWithPermissions;
    const query = analisisSearch.toLowerCase();
    return teachersWithPermissions.filter(t => 
      t.nombre.toLowerCase().includes(query) || 
      t.cedula.includes(query) || 
      t.sede.toLowerCase().includes(query)
    );
  }, [teachersWithPermissions, analisisSearch]);

  const activeMonthLabel = meses.find(m => m.value === analisisMonth)?.label || 'Mes';

  // Excel Exporter of accumulations per month per teacher/sede
  const handleExportAccumulationsExcel = () => {
    const wb = XLSX.utils.book_new();

    // Setup headers
    const reportTitle = "REPORTE DE DÍAS DE PERMISO ACUMULADOS POR MES Y SEDE DE DOCENTES";
    const periodLabel = `PERIODO EVALUADO: ${activeMonthLabel.toUpperCase()} DE ${analisisYear}`;

    const excelRows = [
      ["INSTITUCIÓN EDUCATIVA ALVERNIA", "", "", "", "", "", ""],
      [reportTitle, "", "", "", "", "", ""],
      [periodLabel, "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      [
        "CÉDULA", 
        "NOMBRE DEL FUNCIONARIO", 
        "CARGO", 
        "SEDE DE TRABAJO", 
        "ESTADO ASISTENCIAL", 
        "CANTIDAD NOVEDADES", 
        "TOTAL DÍAS ACUMULADOS"
      ]
    ];

    // Populate data rows
    teachersWithPermissions.forEach(t => {
      excelRows.push([
        t.cedula,
        t.nombre.toUpperCase(),
        t.cargo.toUpperCase(),
        SedeFormat(t.sede).toUpperCase(),
        t.activo,
        String(t.novelties.length),
        String(t.totalDays.toFixed(1))
      ]);
    });

    // Add corporate total metrics summary row at the bottom if there is data
    if (teachersWithPermissions.length > 0) {
      const sumAllDays = teachersWithPermissions.reduce((acc, curr) => acc + curr.totalDays, 0);
      excelRows.push(["", "", "", "", "", "", ""]);
      excelRows.push([
        "TOTAL ACUMULADO DEL MES GENERAL", 
        "", 
        "", 
        "", 
        "", 
        `${teachersWithPermissions.length} Docentes procesados`, 
        `${sumAllDays.toFixed(1)} días totales`
      ]);
    }

    const wsAcc = XLSX.utils.aoa_to_sheet(excelRows);

    // Merge ranges for elegant headers
    wsAcc['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Title 2
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Periode label
    ];

    // Explicit widths for columns
    wsAcc['!cols'] = [
      { wch: 15 }, // Cedula
      { wch: 35 }, // Nombre
      { wch: 35 }, // Cargo
      { wch: 25 }, // Sede
      { wch: 20 }, // Estado
      { wch: 20 }, // Cant novedades
      { wch: 22 }  // Dias acumulados
    ];

    // Show Grid lines
    wsAcc['!views'] = [{ showGridLines: true }];
    wsAcc['!showGridLines'] = true;
    wsAcc['!showGrid'] = 1;

    // Apply styles
    Object.keys(wsAcc).forEach(key => {
      if (key.startsWith('!')) return;
      const cell = wsAcc[key];
      if (!cell) return;

      const match = key.match(/^([A-Z]+)([0-9]+)$/);
      if (!match) return;

      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10);

      // Default cell styles
      cell.s = {
        font: { name: 'Calibri', sz: 10, color: { rgb: "333333" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } }
        }
      };

      if (rowNum <= 3) {
        // Top general banner header
        cell.s.fill = { fgColor: { rgb: "EDF2F7" } };
        cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: "1A365D" } };
        cell.s.alignment = { horizontal: "center", vertical: "center" };
      } else if (rowNum === 5) {
        // Table Columns headers
        cell.s.fill = { fgColor: { rgb: "1E3A8A" } }; // Slate blue
        cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.alignment = { horizontal: "center", vertical: "center" };
      } else {
        // Body cells styling
        if (colLetter === 'A' || colLetter === 'E' || colLetter === 'F' || colLetter === 'G') {
          cell.s.alignment = { horizontal: "center", vertical: "center" };
        } else {
          cell.s.alignment = { horizontal: "left", vertical: "center" };
        }

        // Highlight total days column in light red/amber for visibility
        if (colLetter === 'G' && rowNum > 5) {
          cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: "991B1B" } };
          cell.s.fill = { fgColor: { rgb: "FEF2F2" } };
        }
      }

      // Highlight custom total row
      if (teachersWithPermissions.length > 0 && rowNum === excelRows.length) {
        cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
        cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: "0F172A" } };
      }
    });

    XLSX.utils.book_append_sheet(wb, wsAcc, 'Dias Acumulados');
    XLSX.writeFile(wb, `Reporte_Acumulado_DIAS_PERMISO_${activeMonthLabel.toUpperCase()}_${analisisYear}.xlsx`);
  };

  const SedeFormat = (sedeName: string) => {
    if (!sedeName) return 'Sede no asignada';
    if (sedeName === 'COL ALVERNIA') return 'Colegio Alvernia (Principal)';
    return sedeName;
  };

  return (
    <div className="space-y-6" id="computo-panel-view">
      
      {/* Intro Bannery module info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden" id="computo-main-banner">
        <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-60 h-24 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="bg-blue-600/20 text-blue-300 px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full border border-blue-500/30 inline-block">
              Módulo Independiente de Control
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight" id="computo-title">
              Cómputo Absoluto y Liquidación de Ausencias de Docentes
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl">
              Cálculo automatizado de inasistencias en base a fecha y hora exactas. Genera planillas consolidadas mensuales para contabilidad y control del talento humano.
            </p>
          </div>
          
          <button
            onClick={handleExportAccumulationsExcel}
            className="self-start md:self-center bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 duration-150 shadow-md shadow-emerald-950/20 active:scale-[0.98] cursor-pointer"
            id="computo-export-top-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            Descargar Informe de Acumulados
          </button>
        </div>
      </div>

      {/* Regla de Cómputo Administrativa Card */}
      <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 shadow-sm" id="formula-detail-card">
        <div className="bg-amber-100 p-3 rounded-xl text-amber-800 shrink-0 self-start md:self-center">
          <Info className="w-5 h-5 text-amber-700" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">Regla de Cómputo y Liquidación para Alvernia</h4>
          <p className="text-xs text-amber-850 leading-relaxed">
            <strong>Mismo día (Sustitución de fracción de jornada):</strong> Si la novedad ocurre el mismo día y dura <strong>6 o más horas</strong>, se liquida como <strong>1.0 día</strong>. Si es menor a 6 horas, se contabiliza estrictamente por horas laborables perdidas según la jornada de 8 horas.
          </p>
          <p className="text-xs text-amber-850 leading-relaxed">
            <strong>Días calendario de ausencia:</strong> Si comprende fechas distintas, se calcula el lapso de inasistencia calendario utilizando la fórmula regulada: <code className="bg-amber-100/60 font-bold px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">[Fecha Fin - Fecha Inicio] + 1</code>.
          </p>
        </div>
      </div>

      {/* Toolbar controls and filter directory */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6" id="computo-dynamic-panel">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="computo-toolbar">
          
          <div className="space-y-1.5" id="computo-year-selector">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Año de Análisis
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                value={analisisYear}
                onChange={(e) => {
                  setAnalisisYear(e.target.value);
                  setExpandedTeacherId(null);
                }}
                className="w-full bg-white pr-4 pl-10 py-2.5 rounded-xl text-slate-700 text-xs border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-semibold shadow-xs"
                id="select-comp-year"
              >
                {yearOptions.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5" id="computo-month-selector">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Mes de Cómputo (Ej: Mayo)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                value={analisisMonth}
                onChange={(e) => {
                  setAnalisisMonth(e.target.value);
                  setExpandedTeacherId(null);
                }}
                className="w-full bg-white pr-4 pl-10 py-2.5 rounded-xl text-slate-800 text-xs border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-bold shadow-xs"
                id="select-comp-month"
              >
                {meses.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5" id="computo-search-box">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Filtrar por Nombre o Cédula o Sede
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ej. María Gómez o Santo Domingo..."
                value={analisisSearch}
                onChange={(e) => setAnalisisSearch(e.target.value)}
                className="w-full bg-white pr-4 pl-10 py-2.5 rounded-xl text-slate-750 text-xs border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
                id="input-comp-search"
              />
            </div>
          </div>

        </div>

        {/* Dynamic calculations result */}
        {filteredAnalysisTeachers.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20" id="computo-empty-results">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">No se encontraron docentes con permisos en este periodo</p>
            <p className="text-slate-450 text-xs mt-1">Asegúrate de cambiar el mes/año o de que existan novedades en las fechas correspondientes.</p>
          </div>
        ) : (
          <div className="space-y-4" id="computo-teachers-list">
            
            {/* List Overview Meta Header */}
            <div className="flex justify-between items-center text-xs text-slate-500 px-1 border-b border-slate-100 pb-2" id="computo-list-overview">
              <span>Se encontraron <strong>{filteredAnalysisTeachers.length}</strong> docentes / funcionarios con novedades en <strong>{activeMonthLabel} / {analisisYear}</strong>:</span>
              <span className="font-bold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Suma consolidada</span>
            </div>

            <div className="space-y-3" id="computo-teachers-container">
              {filteredAnalysisTeachers.map(teacher => {
                const isExpanded = expandedTeacherId === teacher.id;
                return (
                  <div 
                    key={teacher.id} 
                    className={`border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
                      isExpanded 
                        ? 'border-blue-400 ring-2 ring-blue-500/5 bg-slate-50/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    id={`computo-teacher-card-${teacher.id}`}
                  >
                    {/* Header part */}
                    <div 
                      onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 select-none flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700 shrink-0">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{teacher.nombre}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="font-mono text-slate-700 bg-slate-150 px-2 py-0.5 rounded font-semibold text-[10px]">C.C. {teacher.cedula}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">{teacher.cargo}</span>
                            <span>•</span>
                            <span className="text-blue-800 font-bold bg-blue-50 px-2 py-0.2 rounded-md">{SedeFormat(teacher.sede)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Permiso Acumulado</span>
                          <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 inline-block font-mono leading-none shadow-xs mt-0.5">
                            {teacher.totalDays === 1 ? '1.0 día de permiso' : `${teacher.totalDays.toFixed(1)} días de permiso`}
                          </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" aria-label="Toggle details">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible body */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 border-t border-slate-150/80 p-5 space-y-4" id={`computo-sublist-${teacher.id}`}>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-1.5">
                          <History className="w-4 h-4 text-slate-650" />
                          Desglose pormenorizado de novedades en {activeMonthLabel} de {analisisYear}
                        </div>

                        <div className="space-y-3" id={`computo-subitems-${teacher.id}`}>
                          {teacher.novelties.map((nov) => (
                            <div 
                              key={nov.id} 
                              className="bg-white p-4 rounded-xl border border-slate-250 shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <span className="font-extrabold text-slate-800 text-xs">{nov.claseNovedad}</span>
                                  <span className="text-[10px] font-bold font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                    Soporte: {nov.documentoSoporteTipo || 'Sin tipo'}-{nov.documentoSoporteNo || 'Sin número'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-500 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-700">Inicio:</span>
                                    <span className="font-mono text-slate-600">{formatDetailedDateTime(nov.fechaInicio)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-700">Término:</span>
                                    <span className="font-mono text-slate-600">{formatDetailedDateTime(nov.fechaFin)}</span>
                                  </div>
                                </div>

                                {nov.observaciones && (
                                  <p className="text-xs text-slate-550 italic bg-slate-50/70 p-2.5 rounded-lg border border-dashed border-slate-200 mt-1 max-w-2xl leading-relaxed">
                                    Observación: "{nov.observaciones}"
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-xs w-full sm:w-auto">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Cómputo Individual</span>
                                <span className="font-extrabold text-slate-800 mt-1 inline-block bg-white px-2.5 py-1 rounded border border-slate-150">{nov.durationLabel}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
