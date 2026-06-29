import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, Info } from 'lucide-react';
import { Employee, Novedad, SEDES_OPCIONES, AREAS_DESEMPENO_OPCIONES, CARGOS_OPCIONES, TIPOS_NOMBRAMIENTO_OPCIONES, CLASES_NOVEDADES_OPCIONES } from '../types';

interface ExcelImporterProps {
  onImportCompleted: (importedEmployees: Employee[], importedNovedades: Novedad[]) => void;
}

export default function ExcelImporter({ onImportCompleted }: ExcelImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    employees: Employee[];
    novedades: Novedad[];
    fileName: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to normalize values and find the closest matching constant
  const findClosestMatch = (val: string, options: readonly string[]): string => {
    if (!val) return options[options.length - 1] || ''; // default or last one like 'No Aplica'
    const trimmedVal = val.trim().toLowerCase();
    const match = options.find(opt => opt.toLowerCase() === trimmedVal);
    if (match) return match;
    // Partial match check
    const partialMatch = options.find(opt => opt.toLowerCase().includes(trimmedVal) || trimmedVal.includes(opt.toLowerCase()));
    return partialMatch || val; // Return original or matching if found
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        if (workbook.SheetNames.length === 0) {
          throw new Error('El archivo Excel no contiene hojas de cálculo de datos.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Let's get raw rows representing the table
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (rows.length < 2) {
          throw new Error('El archivo Excel no parece tener suficientes filas con datos.');
        }

        // Try to identify header index or assume standard mapping
        // We look for headers like "CEDULA", "IDENTIFICACION", "NOMBRE", "CARGO", "SEDE", "NOVEDAD"
        let headerRowIndex = 0;
        let foundHeader = false;

        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const row = rows[i];
          if (Array.isArray(row) && row.some(cell => 
            typeof cell === 'string' && (
              cell.toUpperCase().includes('CEDULA') || 
              cell.toUpperCase().includes('NOMBRE') ||
              cell.toUpperCase().includes('CARGO')
            )
          )) {
            headerRowIndex = i;
            foundHeader = true;
            break;
          }
        }

        const headers: string[] = (rows[headerRowIndex] as any[] || []).map(h => String(h || '').trim());
        const dataRows = rows.slice(headerRowIndex + 1);

        const employeesMap: Map<string, Employee> = new Map();
        const novedadesList: Novedad[] = [];

        // Dynamic key mapper to support custom Excel exports
        const findColumnIndex = (keywords: string[]): number => {
          return headers.findIndex(header => 
            keywords.some(kw => header.toUpperCase().includes(kw))
          );
        };

        const idxNombre = findColumnIndex(['NOMBRE', 'EMPLEADO', 'FUNCIO', 'APELLIDO']);
        const idxCedula = findColumnIndex(['CEDULA', 'IDENTI', 'DOCUMENTO', 'C.C', 'CC']);
        const idxCargo = findColumnIndex(['CARGO', 'PUESTO', 'OCUPAC']);
        const idxSede = findColumnIndex(['SEDE', 'COLALVERNIA', 'LUGAR', 'INSTITU']);
        const idxDificil = findColumnIndex(['DIFICIL', 'ACCESO']);
        const idxHorasAula = findColumnIndex(['H/A', 'AULA', 'HORAS AULA']);
        const idxHorasLibres = findColumnIndex(['H/L', 'LIBRES', 'HORAS LIBRES']);
        const idxArea = findColumnIndex(['AREA', 'DESEMPEÑO', 'MATERIA', 'DISCIPLINA']);
        const idxNovedad = findColumnIndex(['CLASE DE NOVEDAD', 'NOVEDAD', 'PERMISO', 'MOTIVO']);
        const idxTipoNombramiento = findColumnIndex(['NOMBRAMIENTO', 'TIPO DE NOMBRA']);
        const idxLaborando = findColumnIndex(['LABORANDO', 'NORMALMENTE']);
        const idxCarga = findColumnIndex(['CARGA', 'ACADEMICA']);

        // Check if essential columns exist (at least name or cedula)
        if (idxNombre === -1 && idxCedula === -1) {
          throw new Error('No se pudo encontrar columnas para Nombre o Cédula. Asegúrese de que el Excel tenga los encabezados correspondientes.');
        }

        // Loop rows
        dataRows.forEach((row: any[], rIdx) => {
          if (!Array.isArray(row)) return;
          
          // Row must have some elements
          const rawCedula = idxCedula !== -1 ? String(row[idxCedula] || '').trim() : '';
          const rawNombre = idxNombre !== -1 ? String(row[idxNombre] || '').trim() : '';
          
          if (!rawCedula && !rawNombre) return; // skip empty line

          const cedula = rawCedula || `GEN-${100000 + rIdx}`;
          const nombre = rawNombre || 'Empleado Sin Nombre';
          
          // Position
          let cargo = idxCargo !== -1 ? String(row[idxCargo] || '').trim() : '9001 Docente de aula';
          cargo = findClosestMatch(cargo, CARGOS_OPCIONES);

          // Sede
          let sede = idxSede !== -1 ? String(row[idxSede] || '').trim() : 'COL ALVERNIA';
          // Clean Sede
          if (sede.toUpperCase().includes('ALVERNIA')) sede = 'COL ALVERNIA';
          else if (sede.toUpperCase().includes('MARTIN')) sede = 'SAN MARTIN';
          else if (sede.toUpperCase().includes('DOMINGO') || sede.toUpperCase().includes('SAVIO')) sede = 'SANTO DOMINGO SAVIO';
          else if (sede.toUpperCase().includes('NICOLAS')) sede = 'SAN NICOLAS';
          else sede = findClosestMatch(sede, SEDES_OPCIONES);

          const dificilAcceso: 'Si' | 'No' = idxDificil !== -1 && String(row[idxDificil] || '').toLowerCase().includes('si') ? 'Si' : 'No';
          
          // Horas
          const horasAula = idxHorasAula !== -1 ? Number(row[idxHorasAula]) || 0 : 0;
          const horasLibres = idxHorasLibres !== -1 ? Number(row[idxHorasLibres]) || 0 : 0;

          // Area
          let area = idxArea !== -1 ? String(row[idxArea] || '').trim() : 'No Aplica';
          area = findClosestMatch(area, AREAS_DESEMPENO_OPCIONES);

          // Appointment
          let nombramiento = idxTipoNombramiento !== -1 ? String(row[idxTipoNombramiento] || '').trim() : 'Propiedad';
          nombramiento = findClosestMatch(nombramiento, TIPOS_NOMBRAMIENTO_OPCIONES);

          // Employee object
          const emp: Employee = {
            id: cedula,
            nombre,
            cedula,
            cargo,
            sedeTrabajo: sede as any,
            dificilAcceso,
            horasAula,
            horasLibres,
            areaDesempeno: area,
            tipoNombramiento: nombramiento,
            activo: true // default active on import
          };

          // Store unique employee
          employeesMap.set(cedula, emp);

          // Look for Novedad (Leave details) on this same row if present
          if (idxNovedad !== -1) {
            const rawNovText = String(row[idxNovedad] || '').trim();
            if (rawNovText && rawNovText !== 'No presenta Novedad' && rawNovText !== 'No Aplica' && rawNovText !== '-') {
              
              const claseNovedad = findClosestMatch(rawNovText, CLASES_NOVEDADES_OPCIONES);
              const estaLaborando: 'Si' | 'No' = idxLaborando !== -1 && String(row[idxLaborando] || '').toLowerCase().includes('si') ? 'Si' : 'No';
              const cargaAcad: 'Si' | 'No' = idxCarga !== -1 && String(row[idxCarga] || '').toLowerCase().includes('si') ? 'Si' : 'No';

              // Date mapping - Try helper indexes or build standard dates based on current system year/month to avoid crash
              const currentDate = new Date();
              let startIsoString = currentDate.toISOString().substring(0, 16); // current date & time
              let endIsoString = currentDate.toISOString().substring(0, 16);

              // Look for FECHA INICIO DE LA NOVEDAD and FECHA FINAL DE LA NOVEDAD columns
              // Some Excel sheets have separate DÍA, MES, AÑO columns as seen in the screenshot
              // Let's search columns with DATE keywords
              const startDayCol = headers.findIndex(h => h.toUpperCase() === 'DIA' || (h.toUpperCase().includes('FECHA INICIO') && h.toUpperCase().includes('DIA')));
              const startMonthCol = headers.findIndex(h => h.toUpperCase() === 'MES' || (h.toUpperCase().includes('FECHA INICIO') && h.toUpperCase().includes('MES')));
              const startYearCol = headers.findIndex(h => h.toUpperCase() === 'AÑO' || (h.toUpperCase().includes('FECHA INICIO') && h.toUpperCase().includes('AÑO')));
              
              const endDayCol = headers.findIndex(h => h.toUpperCase().includes('FINAL') && h.toUpperCase().includes('DIA'));
              const endMonthCol = headers.findIndex(h => h.toUpperCase().includes('FINAL') && h.toUpperCase().includes('MES'));
              const endYearCol = headers.findIndex(h => h.toUpperCase().includes('FINAL') && h.toUpperCase().includes('AÑO'));

              // Helper to parse date fields safely
              const extractDateTime = (dayIdx: number, monthIdx: number, yearIdx: number, defaultDaysOffset = 0): string => {
                let day = currentDate.getDate() + defaultDaysOffset;
                let month = currentDate.getMonth() + 1;
                let year = currentDate.getFullYear();

                if (dayIdx !== -1 && row[dayIdx]) day = parseInt(row[dayIdx], 10) || day;
                if (monthIdx !== -1 && row[monthIdx]) month = parseInt(row[monthIdx], 10) || month;
                if (yearIdx !== -1 && row[yearIdx]) year = parseInt(row[yearIdx], 10) || year;

                // Clamp values
                month = Math.max(1, Math.min(12, month));
                day = Math.max(1, Math.min(31, day));

                const pad = (num: number) => String(num).padStart(2, '0');
                return `${year}-${pad(month)}-${pad(day)}T08:00`;
              };

              // Let's check generic single column for start and end date
              const idxStartDateSingle = findColumnIndex(['FECHA INICIO', 'INICIO NOVEDAD', 'FECHA_INI']);
              const idxEndDateSingle = findColumnIndex(['FECHA FINAL', 'FIN NOVEDAD', 'FECHA_FIN']);

              if (idxStartDateSingle !== -1 && row[idxStartDateSingle]) {
                const parsedDate = parseExcelDate(row[idxStartDateSingle]);
                if (parsedDate) {
                  startIsoString = parsedDate.substring(0, 10) + 'T08:00';
                }
              } else {
                startIsoString = extractDateTime(startDayCol, startMonthCol, startYearCol, 0);
              }

              if (idxEndDateSingle !== -1 && row[idxEndDateSingle]) {
                const parsedDate = parseExcelDate(row[idxEndDateSingle]);
                if (parsedDate) {
                  endIsoString = parsedDate.substring(0, 10) + 'T18:00';
                }
              } else {
                endIsoString = extractDateTime(endDayCol !== -1 ? endDayCol : startDayCol, endMonthCol !== -1 ? endMonthCol : startMonthCol, endYearCol !== -1 ? endYearCol : startYearCol, 1);
              }

              // Document support
              const idxDocTipo = findColumnIndex(['TIPO DOC', 'DOCUMENTO QUE LO SOPORTA', 'TIPO_DOC']);
              const idxDocNo = findColumnIndex(['NO. DOC', 'NUMERO DOC', 'DOC_NO', 'DOCUMENTO NO']);
              const idxDocFecha = findColumnIndex(['FECHADOC', 'FECHA DOC', 'FECHA DOCUMENTO']);

              let docTipo: any = 'P';
              if (idxDocTipo !== -1 && row[idxDocTipo]) {
                const originalTipo = String(row[idxDocTipo]).trim().substring(0, 1).toUpperCase();
                if (['R', 'D', 'A', 'I', 'P', 'O'].includes(originalTipo)) {
                  docTipo = originalTipo;
                }
              }

              const docNo = idxDocNo !== -1 ? String(row[idxDocNo] || '').trim() : '';
              let docFecha = startIsoString.substring(0, 10);
              if (idxDocFecha !== -1 && row[idxDocFecha]) {
                const docDateParsed = parseExcelDate(row[idxDocFecha]);
                if (docDateParsed) docFecha = docDateParsed.substring(0, 10);
              }

              const novelty: Novedad = {
                id: `nov-uploaded-${rIdx}-${Math.random().toString(36).substr(2, 4)}`,
                empleadoId: cedula,
                claseNovedad,
                sedeNovedad: sede,
                fechaInicio: startIsoString,
                fechaFin: endIsoString,
                estaLaborandoNormalmente: estaLaborando,
                seLeAsignoCargaAcademica: cargaAcad,
                documentoSoporteTipo: docTipo,
                documentoSoporteNo: docNo || `SOP-${rIdx}`,
                documentoSoporteFecha: docFecha
              };
              
              novedadesList.push(novelty);
            }
          }
        });

        const finalEmployees = Array.from(employeesMap.values());
        
        if (finalEmployees.length === 0) {
          throw new Error('No se detectaron empleados válidos en la hoja cargada.');
        }

        setParsedData({
          employees: finalEmployees,
          novedades: novedadesList,
          fileName: file.name
        });

      } catch (err: any) {
        setErrorMsg(err.message || 'Error al procesar el archivo Excel. Asegúrese de que sea un archivo de Excel válido.');
      }
    };

    reader.onerror = () => {
      setErrorMsg('Error de lectura en el archivo seleccionado.');
    };

    reader.readAsBinaryString(file);
  };

  // Helper helper to convert Excel serial dates or formatted dates safely
  const parseExcelDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'number') {
      // Excel serial date number
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    // String date
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return null;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedData) {
      onImportCompleted(parsedData.employees, parsedData.novedades);
      setParsedData(null);
    }
  };

  const handleCancel = () => {
    setParsedData(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="excel-importer-container">
      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" id="importer-icon" />
          <h3 className="font-semibold text-slate-800 text-base" id="importer-title">
            Importar Base de Datos de Empleados
          </h3>
        </div>
        {!parsedData && (
          <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Soporta Excel (.xlsx, .xls)
          </span>
        )}
      </div>

      {!parsedData ? (
        <div>
          <div
            id="drag-and-drop-area"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleChange}
              id="excel-file-picker"
            />
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-3" id="upload-arrow-container">
              <Upload className="w-6 h-6 animate-pulse" id="upload-icon" />
            </div>
            <p className="font-medium text-slate-700 mb-1 text-center text-sm" id="upload-instruction-1">
              Arrastra y suelta tu archivo de Excel aquí, o <span className="text-blue-600 hover:underline">haz clic para explorar</span>
            </p>
            <p className="text-xs text-slate-450 text-center" id="upload-instruction-2">
              Detecta automáticamente columnas como Cédula, Nombres, Cargo, Sede, Área e incidencias registradas.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs" id="importer-error-alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-4 bg-slate-50/50 rounded-xl p-4 border border-slate-200" id="column-helper-card">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Estructura Sugerida de Columnas en tu Excel:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600" id="columns-layout-info">
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">NOMBRE Y APELLIDOS</strong></div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">CEDULA DEL FUNCIONARIO</strong></div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">CARGO</strong></div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">SEDE DONDE SE PRESENTÓ LA NOVEDAD</strong></div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">Dificil Acceso</strong> (Si/No)</div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">H/A</strong> (Horas Aula)</div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">H/L</strong> (Horas Libres)</div>
              <div className="p-1.5 bg-white rounded border border-slate-200"><strong className="text-slate-800">AREA DE DESEMPEÑO</strong></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4" id="import-preview-wrapper">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between" id="import-preview-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-855 text-sm">{parsedData.fileName}</p>
                <p className="text-xs text-slate-600">
                  Se detectaron <span className="font-bold text-blue-800">{parsedData.employees.length}</span> empleados y <span className="font-bold text-blue-800">{parsedData.novedades.length}</span> registros de novedades para importar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3.5 py-1.5 text-xs bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
                id="btn-cancel-import"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors font-semibold shadow-sm cursor-pointer"
                id="btn-apply-import"
              >
                <Check className="w-4 h-4" />
                Confirmar e Importar
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto" id="preview-table-container">
            <table className="w-full text-left border-collapse text-xs" id="table-import-preview">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                  <th className="p-2.5">Cédula</th>
                  <th className="p-2.5">Nombre y Apellidos</th>
                  <th className="p-2.5">Cargo</th>
                  <th className="p-2.5">Sede</th>
                  <th className="p-2.5">Área Desempeño</th>
                  <th className="p-2.5">Tipo Nombramiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {parsedData.employees.map((emp, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="p-2 font-mono text-slate-500">{emp.cedula}</td>
                    <td className="p-2 font-medium">{emp.nombre}</td>
                    <td className="p-2 break-all">{emp.cargo}</td>
                    <td className="p-2">{emp.sedeTrabajo}</td>
                    <td className="p-2">{emp.areaDesempeno}</td>
                    <td className="p-2">{emp.tipoNombramiento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
