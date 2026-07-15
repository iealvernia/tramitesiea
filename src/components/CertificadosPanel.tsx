import React, { useState, useEffect, useMemo } from 'react';

import { 
  Award, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  X, 
  Save, 
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  Upload,
  Check,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

interface NotaDetalle {
  ihs: string;
  nota: string;
  desempeno: string;
}

interface StudentCertificado {
  id?: string;
  anio: string;
  nombre: string;
  documento: string;
  tipo_documento?: string;
  grado: string;
  jornada: string;
  comportamiento?: string;
  notas: Record<string, NotaDetalle>;
  created_at?: string;
}

const MATERIAS_PREDEFINIDAS = [
  "MATEMÁTICAS", "FÍSICA", "QUÍMICA", "TECNOLOGÍA E INFORMATICA", "EDUCACIÓN FÍSICA",
  "LENGUAJE", "ED. ARTÍSTICA", "ED. RELIGIOSA", "ED. ÉTICA Y VALORES", "FILOSOFÍA",
  "INGLÉS", "CIENCIAS NATURALES", "CIENCIAS SOCIALES", "CÁLCULO", "BIOLOGÍA",
  "TRIGONOMETRÍA", "CIENCIAS ECONOMICAS", "CIENCIAS POLÍTICAS"
];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function CertificadosPanel({ hasPermission }: { hasPermission?: (modulo: string, accion?: "VIEW" | "MODIFICAR" | "ELIMINAR") => boolean }) {
  const [students, setStudents] = useState<StudentCertificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedAnio, setSelectedAnio] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Excel Importer modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDragActive, setImportDragActive] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingState, setImportingState] = useState<{
    status: 'idle' | 'parsing' | 'preview' | 'uploading';
    progress: number;
    total: number;
    students: StudentCertificado[];
    detectedSubjects: string[];
    error: string | null;
  }>({
    status: 'idle',
    progress: 0,
    total: 0,
    students: [],
    detectedSubjects: [],
    error: null
  });
  
  // Local state to track IHS assignments during import preview
  const [importIhsMap, setImportIhsMap] = useState<{ [subject: string]: string }>({});

  const [formName, setFormName] = useState('');
  const [formDocumento, setFormDocumento] = useState('');
  const [formTipoDoc, setFormTipoDoc] = useState('TI');
  const [formGrado, setFormGrado] = useState('TERCERO (3°)');
  const [formJornada, setFormJornada] = useState('ÚNICA');
  const [formComportamiento, setFormComportamiento] = useState('SUPERIOR');

  // Interactive Grade rows
  const [formNotas, setFormNotas] = useState<{ materia: string; ihs: string; nota: string }[]>([
    { materia: '', ihs: '', nota: '' }
  ]);

  const removeAccentsAndUpper = (str: string): string => {
    return str
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const normalizeSubjectKey = (header: string): string => {
    let clean = removeAccentsAndUpper(header);
    // Fix common typos from Excel files
    clean = clean.replace('CIENCIASOCIALES', 'CIENCIAS SOCIALES');
    clean = clean.replace('MATEMATICA S', 'MATEMATICAS');
    clean = clean.replace('TRIGONOMETRI A', 'TRIGONOMETRIA');
    clean = clean.replace('EDUACION FISICA', 'EDUCACION FISICA');
    
    if (clean === "CIENCIAS SOCIALES" || clean === "SOCIALES") return "CIENCIAS SOCIALES";
    if (clean === "EDUCACION FISICA" || clean === "ED FISICA" || clean === "ED. FISICA") return "EDUCACION FISICA";
    if (clean === "EDUCACION ARTISTICA" || clean === "ARTISTICA" || clean === "ED ARTISTICA" || clean === "ED. ARTISTICA") return "EDUCACION ARTISTICA";
    if (clean === "TECNOLOGIA E INFORMATICA" || clean === "TECNOLOGIA" || clean === "INFORMATICA" || clean === "SISTEMAS" || clean === "TECNOLOGIA E INF" || clean === "TECNOLOGIA E INFORMATIC") return "TECNOLOGIA E INFORMATICA";
    if (clean === "ETICA Y VALORES" || clean === "ETICA" || clean === "ED ETICA" || clean === "ED. ETICA" || clean === "ETICA Y VALORES HUMANOS") return "ETICA Y VALORES";
    if (clean === "EDUCACION RELIGIOSA" || clean === "RELIGION" || clean === "ED RELIGIOSA" || clean === "ED. RELIGIOSA" || clean === "RELIGION Y MORAL") return "RELIGION";
    if (clean === "LENGUA CASTELLANA" || clean === "LENGUAJE" || clean === "ESPAÑOL" || clean === "LITERATURA") return "LENGUAJE";
    if (clean === "GEOMETRIA") return "MATEMATICAS";
    return clean;
  };

  const processImportFile = (file: File) => {
    setImportingState(prev => ({ ...prev, status: 'parsing', error: null }));
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        if (workbook.SheetNames.length === 0) {
          throw new Error('El archivo de Excel está vacío.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length < 2) {
          throw new Error('El archivo no contiene suficientes filas.');
        }

        let headerRowIndex = 0;
        let foundHeader = false;
        for (let i = 0; i < Math.min(15, rows.length); i++) {
          const row = rows[i];
          if (Array.isArray(row) && row.some(cell => 
            cell && typeof cell === 'string' && (
              cell.toUpperCase().includes('NOMBRE') || 
              cell.toUpperCase().includes('DOCUMENTO') || 
              cell.toUpperCase().includes('ESTUDIANTE') ||
              cell.toUpperCase().includes('CEDULA')
            )
          )) {
            headerRowIndex = i;
            foundHeader = true;
            break;
          }
        }

        const headers: string[] = (rows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
        const dataRows = rows.slice(headerRowIndex + 1);

        const findColIdx = (keywords: RegExp): number => {
          return headers.findIndex(h => keywords.test(h.toLowerCase()));
        };

        const idxDocumento = findColIdx(/doc|id|identificac|cedula|cc|nro/i);
        const idxNombre = findColIdx(/nom|estud|alumn|apell/i);
        const idxTipoDoc = findColIdx(/tipo.*doc|tp.*doc|td|tipo_doc/i);
        const idxGrado = findColIdx(/grado|curso/i);
        const idxJornada = findColIdx(/jornada|jor/i);
        const idxComportamiento = findColIdx(/comport|conduct|disciplina|social/i);
        const idxAnio = findColIdx(/año|anio|periodo/i);

        if (idxNombre === -1 && idxDocumento === -1) {
          throw new Error('No se encontraron las columnas necesarias para "Nombre" o "Documento". Verifique los encabezados.');
        }

        const metadataIndices = [idxDocumento, idxNombre, idxTipoDoc, idxGrado, idxJornada, idxComportamiento, idxAnio];
        const subjectCols: { index: number; originalHeader: string; cleanHeader: string }[] = [];

        const excludedCols = ['PROM', 'DESC.', 'DESC', 'MATRICULA', 'ESTADO', 'OBSERVACIONES'];

        headers.forEach((header, index) => {
          if (header && !metadataIndices.includes(index) && header.toUpperCase() !== 'ID' && header.trim() !== '') {
            const cleanSubj = removeAccentsAndUpper(header);
            if (cleanSubj.length >= 2 && cleanSubj.length < 40 && !excludedCols.includes(cleanSubj)) {
              subjectCols.push({
                index,
                originalHeader: header,
                cleanHeader: normalizeSubjectKey(header)
              });
            }
          }
        });

        const parsedStudents: StudentCertificado[] = [];
        dataRows.forEach((row: any[], rIdx) => {
          if (!Array.isArray(row) || row.length === 0) return;

          const docRaw = idxDocumento !== -1 ? String(row[idxDocumento] || '').trim() : '';
          const nameRaw = idxNombre !== -1 ? String(row[idxNombre] || '').trim() : '';

          if (!docRaw && !nameRaw) return;

          const doc = docRaw.replace(/[^A-Za-z0-9_-]/g, "");
          const nombre = nameRaw.toUpperCase().trim();
          
          let tipoDoc = idxTipoDoc !== -1 && row[idxTipoDoc] ? String(row[idxTipoDoc]).trim().toUpperCase() : 'TI';
          let grado = idxGrado !== -1 && row[idxGrado] ? String(row[idxGrado]).trim().toUpperCase() : 'NOVENO (9°)';
          let jornada = idxJornada !== -1 && row[idxJornada] ? String(row[idxJornada]).trim().toUpperCase() : 'ÚNICA';
          let comportamiento = 'SUPERIOR';
          if (idxComportamiento !== -1 && row[idxComportamiento]) {
            const compVal = String(row[idxComportamiento]).trim().toUpperCase();
            if (compVal.includes('ALTO')) comportamiento = 'ALTO';
            else if (compVal.includes('BASICO') || compVal.includes('BÁSICO')) comportamiento = 'BÁSICO';
            else if (compVal.includes('BAJO')) comportamiento = 'BAJO';
          }
          let anioRow = idxAnio !== -1 && row[idxAnio] ? String(row[idxAnio]).trim() : selectedAnio;

          // Normalize grade mappings inside Alvernia format
          if (grado.includes('11') || grado.includes('ONCE') || grado.includes('UNDECIMO')) {
            grado = 'UNDÉCIMO (11°)';
          } else if (grado.includes('10') || grado.includes('DECIMO')) {
            grado = 'DÉCIMO (10°)';
          } else if (grado.includes('9') || grado.includes('NOVENO')) {
             grado = 'NOVENO (9°)';
          } else if (grado.includes('8') || grado.includes('OCTAVO')) {
             grado = 'OCTAVO (8°)';
          } else if (grado.includes('7') || grado.includes('SEPTIMO')) {
             grado = 'SÉPTIMO (7°)';
          } else if (grado.includes('6') || grado.includes('SEXTO')) {
             grado = 'SEXTO (6°)';
          } else if (grado.includes('5') || grado.includes('QUINTO')) {
             grado = 'QUINTO (5°)';
          }

          const notasObj: Record<string, NotaDetalle> = {};
          subjectCols.forEach(colObj => {
            const rawNotaVal = row[colObj.index];
            const notaStr = rawNotaVal !== undefined && rawNotaVal !== null ? String(rawNotaVal).trim() : '';
            if (notaStr !== '') {
              const notaNorm = normalizarNota(notaStr);
              if (notaNorm) {
                notasObj[colObj.cleanHeader] = {
                  ihs: '', // Will be assigned during upload based on importIhsMap
                  nota: notaNorm,
                  desempeno: calcularDesempeno(notaNorm)
                };
              }
            }
          });

          parsedStudents.push({
            anio: anioRow,
            nombre,
            documento: doc,
            tipo_documento: tipoDoc,
            grado,
            jornada,
            comportamiento,
            notas: notasObj
          });
        });

        if (parsedStudents.length === 0) {
          throw new Error('No se detectaron filas de estudiantes con notas válidas.');
        }

        const detectedSubjectsSet = new Set<string>();
        parsedStudents.forEach(s => {
          Object.keys(s.notas).forEach(sub => detectedSubjectsSet.add(sub));
        });
        const detectedSubjectsArr = Array.from(detectedSubjectsSet);

        const ihsMapRaw = localStorage.getItem('iea_ihs_config');
        const globalIhsMap = ihsMapRaw ? JSON.parse(ihsMapRaw) : {};

        // Only show subjects that have NOT been configured yet
        const unconfiguredSubjects = detectedSubjectsArr.filter(sub => {
          return !globalIhsMap[sub] || globalIhsMap[sub].trim() === '';
        });

        // Auto-suggest logic
        const suggestIhs = (subj: string) => {
          const s = subj.toUpperCase();
          if (s.includes('MATEMATICA') || s.includes('LENGUA') || s.includes('COMUNICATIVA') || s.includes('COGNITIVA')) return '5';
          if (s.includes('NATURAL') || s.includes('SOCIAL')) return '4';
          if (s.includes('INGLES') || s.includes('CORPORAL') || s.includes('SOCIOAFECTIVA')) return '3';
          if (s.includes('FISICA') || s.includes('TECNOLOGIA') || s.includes('ARTISTICA') || s.includes('ESTETICA')) return '2';
          if (s.includes('ETICA') || s.includes('RELIGION') || s.includes('ESPIRITUAL')) return '1';
          return '';
        };
        
        const initialImportIhsMap: { [key: string]: string } = {};
        unconfiguredSubjects.forEach(sub => {
          initialImportIhsMap[sub] = suggestIhs(sub);
        });

        setImportIhsMap(initialImportIhsMap);

        setImportingState({
          status: 'preview',
          progress: 0,
          total: parsedStudents.length,
          students: parsedStudents,
          detectedSubjects: unconfiguredSubjects, // Only pass unconfigured subjects to UI
          error: null
        });

      } catch (err: any) {
        console.error('Error parsing excel:', err);
        setImportingState(prev => ({
          ...prev,
          status: 'idle',
          error: err.message || 'Error al procesar el archivo Excel.'
        }));
      }
    };

    reader.onerror = () => {
      setImportingState(prev => ({ ...prev, status: 'idle', error: 'Error del sistema al leer el documento.' }));
    };

    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    const globalIhsRaw = localStorage.getItem('iea_ihs_config');
    const globalIhs = globalIhsRaw ? JSON.parse(globalIhsRaw) : {};

    // 1. Update students with both global mappings and new edited mappings
    const finalStudents = importingState.students.map(student => {
      const updatedNotas: Record<string, NotaDetalle> = {};
      Object.entries(student.notas).forEach(([subj, detalle]) => {
        updatedNotas[subj] = {
          ...(typeof detalle === 'object' && detalle !== null ? (detalle as NotaDetalle) : { valor: String(detalle), nota: String(detalle), desempeno: '' }),
          // Prefer newly edited mapping in the UI; fallback to global config
          ihs: importIhsMap[subj] || globalIhs[subj] || ''
        };
      });
      return { ...student, notas: updatedNotas };
    });

    // 2. Save ONLY the new mappings back to Global Config
    if (Object.keys(importIhsMap).length > 0) {
      const updatedGlobalIhs = { ...globalIhs, ...importIhsMap };
      localStorage.setItem('iea_ihs_config', JSON.stringify(updatedGlobalIhs));
      localStorage.setItem('iea_config_customized', 'true');
      window.dispatchEvent(new Event('iea_config_updated'));
    }

    setImportingState(prev => ({ ...prev, status: 'uploading', progress: 0 }));

    let successCount = 0;
    let errorCount = 0;

    // Fetch all existing for quick lookup
    const allRes = await fetch('/api/certificados');
    const allJson = await allRes.json();
    const existingList = allJson.data || [];

    const CHUNK_SIZE = 50;
    for (let i = 0; i < finalStudents.length; i += CHUNK_SIZE) {
      const chunk = finalStudents.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(chunk.map(async (student) => {
        try {
          const existingData = existingList.find((s: any) => 
            s.anio === student.anio && 
            s.grado === student.grado && 
            s.nombre === student.nombre
          );

          if (existingData && existingData.id) {
            const payload = {
                id: existingData.id,
                nombre: student.nombre,
                tipo_documento: student.tipo_documento,
                grado: student.grado,
                jornada: student.jornada,
                comportamiento: student.comportamiento,
                notas: student.notas
            };
            const updateRes = await fetch('/api/certificados', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const updateJson = await updateRes.json();
            if (updateJson.error) throw new Error(updateJson.error);
          } else {
            const insertRes = await fetch('/api/certificados', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(student)
            });
            const insertJson = await insertRes.json();
            if (insertJson.error) throw new Error(insertJson.error);
          }
          successCount++;
        } catch (err: any) {
          console.error('Error importing:', student.nombre, err);
          errorCount++;
        }
      }));

      setImportingState(prev => ({ ...prev, progress: Math.min(i + CHUNK_SIZE, finalStudents.length) }));
    }

    alert(`Importación Finalizada:\n✅ ${successCount} registros guardados (creados o actualizados)\n❌ ${errorCount} errores.`);
    setShowImportModal(false);
    setImportFile(null);
    setImportingState({
      status: 'idle',
      progress: 0,
      total: 0,
      students: [],
      detectedSubjects: [],
      error: null
    });
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificados');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = (json.data || []).filter((s: any) => s.anio === selectedAnio).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      setStudents(data);
      setErrorErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching certificados:', err);
      setErrorErrorMsg('No se pudieron cargar los datos de certificados. Compruebe la conexión o las tablas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAnio]);

  // Handle adding a course row
  const addNotaRow = () => {
    setFormNotas(prev => [...prev, { materia: '', ihs: '', nota: '' }]);
  };

  // Handle removing a course row
  const removeNotaRow = (index: number) => {
    setFormNotas(prev => prev.filter((_, i) => i !== index));
  };

  // Handle course row change
  const handleNotaRowChange = (index: number, field: string, value: string) => {
    setFormNotas(prev => prev.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Open modal
  const handleOpenAdd = () => {
    setEditId(null);
    setFormName('');
    setFormDocumento('');
    setFormTipoDoc('TI');
    setFormGrado('TERCERO (3°)');
    setFormJornada('ÚNICA');
    setFormComportamiento('SUPERIOR');
    setFormNotas([{ materia: '', ihs: '', nota: '' }]);
    setShowModal(true);
  };

  const handleOpenEdit = (student: StudentCertificado) => {
    setEditId(student.id || null);
    setFormName(student.nombre);
    setFormDocumento(student.documento);
    setFormTipoDoc(student.tipo_documento || 'TI');
    setFormGrado(student.grado);
    setFormJornada(student.jornada);
    setFormComportamiento(student.comportamiento || 'SUPERIOR');

    // Build courses list from student.notas object
    const rows = student.notas ? Object.entries(student.notas).map(([materia, d]) => ({
      materia,
      ihs: d.ihs || '',
      nota: d.nota || ''
    })) : [{ materia: '', ihs: '', nota: '' }];

    setFormNotas(rows.length > 0 ? rows : [{ materia: '', ihs: '', nota: '' }]);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante y sus registros de notas definitivamente?')) return;
    try {
      const res = await fetch(`/api/certificados/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStudents(prev => prev.filter(s => s.id !== id));
      alert('Registro eliminado exitosamente.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleClearAllYear = async () => {
    if (!confirm(`¿Está totalmente seguro de borrar TODOS los certificados del año ${selectedAnio}? Esta acción es irreversible.`)) return;
    try {
      const res = await fetch('/api/certificados');
      const json = await res.json();
      const allStudents = json.data || [];
      const toDelete = allStudents.filter((s: any) => s.anio === selectedAnio);
      for (const s of toDelete) {
        await fetch(`/api/certificados/${s.id}`, { method: 'DELETE' });
      }
      alert('Base limpiada correctamente.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Calculation helpers
  const normalizarNota = (nota: string): string => {
    if (!nota && nota !== '0') return "";
    let nStr = nota.toString().trim().replace('.', ',');
    if (nStr === '') return '';
    if (!nStr.includes(',')) {
      const parsedNum = parseFloat(nStr);
      if (!isNaN(parsedNum)) {
        if (parsedNum === 0) return '0,0'; // Permitir 0.0 para reprobados/retirados
        if (parsedNum < 1.0) return '1,0';
        if (parsedNum > 5.0) return '5,0';
        return parsedNum.toFixed(1).replace('.', ',');
      }
    } else {
      const partes = nStr.split(',');
      if (partes.length === 2) {
        const parteEntera = partes[0];
        const parteDecimal = partes[1];
        if (parteDecimal === '') return parteEntera + ',0';
        if (parteDecimal.length > 1) return parteEntera + ',' + parteDecimal.charAt(0);
        const parsedNum = parseFloat(parteEntera + '.' + parteDecimal);
        if (!isNaN(parsedNum)) {
          if (parsedNum === 0) return '0,0'; // Permitir 0.0 para reprobados/retirados
          if (parsedNum < 1.0) return '1,0';
          if (parsedNum > 5.0) return '5,0';
          return parsedNum.toFixed(1).replace('.', ',');
        }
      }
    }
    return "";
  };

  const calcularDesempeno = (nota: string): string => {
    const notaConPunto = nota ? nota.replace(',', '.') : '';
    const n = parseFloat(notaConPunto);
    if (isNaN(n)) return "";
    if (n >= 4.5) return "SUPERIOR";
    if (n >= 3.8) return "ALTO";
    if (n >= 3.0) return "BÁSICO";
    return "BAJO";
  };

  const normalizarTexto = (txt: string): string => {
    return (txt || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const calcularPromovido = (grado: string): string => {
    if (!grado) return "GRADUADO";
    const g = normalizarTexto(grado);
    const mapaPromociones: Record<string, string> = {
      "PREJARDÍN": "JARDÍN (-1°)",
      "JARDÍN": "TRANSICIÓN (0°)", 
      "TRANSICIÓN": "PRIMERO (1°)",
      "PRIMERO": "SEGUNDO (2°)",
      "SEGUNDO": "TERCERO (3°)",
      "TERCERO": "CUARTO (4°)",
      "CUARTO": "QUINTO (5°)",
      "QUINTO": "SEXTO (6°)",
      "SEXTO": "SÉPTIMO (7°)",
      "SÉPTIMO": "OCTAVO (8°)",
      "OCTAVO": "NOVENO (9°)",
      "NOVENO": "DÉCIMO (10°)",
      "DÉCIMO": "UNDÉCIMO (11°)",
      "UNDÉCIMO": "GRADUADO",
      "CICLO I": "CICLO II",
      "CICLO II": "CICLO III", 
      "CICLO III": "CICLO IV",
      "CICLO IV": "CICLO V",
      "CICLO V": "CICLO VI",
      "CICLO VI": "GRADUADO"
    };

    if (mapaPromociones[g]) return mapaPromociones[g];
    return "GRADUADO";
  };

  // Submit / Save form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDocumento.trim()) {
      alert('Ingrese nombre y documento');
      return;
    }

    // Process notas
    const finalNotas: Record<string, NotaDetalle> = {};
    formNotas.forEach(row => {
      const matUpper = row.materia.trim().toUpperCase();
      if (matUpper) {
        const notaNorm = normalizarNota(row.nota);
        finalNotas[matUpper] = {
          ihs: row.ihs,
          nota: notaNorm,
          desempeno: calcularDesempeno(notaNorm)
        };
      }
    });

    const payload = {
      anio: selectedAnio,
      nombre: formName.trim().toUpperCase(),
      documento: formDocumentoScale(formDocumento.trim()),
      tipo_documento: formTipoDoc,
      grado: formGrado.trim().toUpperCase(),
      jornada: formJornada.trim().toUpperCase(),
      comportamiento: formComportamiento.trim().toUpperCase(),
      notas: finalNotas
    };

    try {
      if (editId) {
        (payload as any).id = editId;
        const res = await fetch('/api/certificados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Certificado actualizado correctamente.');
      } else {
        const res = await fetch('/api/certificados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Estudiante guardado exitosamente.');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Error guardando en Base de Datos: ' + err.message);
    }
  };

  const formDocumentoScale = (doc: string): string => {
    return doc.replace(/[^A-Za-z0-9_-]/g, ""); // Keep clean document code
  };

  // Official PDF transcript layout (using user's exact requirements and formats)
  const drawJustifiedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number, boldWords: string[]) => {
    const words = text.split(' ');
    let lines: any[][] = [];
    let currentLine: any[] = [];
    let currentLineWidth = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^A-ZÁÉÍÓÚÜÑ]/gi, "");
      const isBold = boldWords.some(boldWord => {
        const cleanBold = boldWord.replace(/[^A-ZÁÉÍÓÚÜÑ]/gi, "");
        return cleanWord === cleanBold || word.includes(boldWord);
      });
      
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const wordWidth = doc.getTextWidth(word + ' ');
      
      if (currentLineWidth + wordWidth <= maxWidth) {
        currentLine.push({ word, isBold, width: doc.getTextWidth(word) });
        currentLineWidth += wordWidth;
      } else {
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [{ word, isBold, width: doc.getTextWidth(word) }];
        currentLineWidth = doc.getTextWidth(word + ' ');
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    let currentY = y;
    
    lines.forEach((line, lineIndex) => {
      const isLastLine = lineIndex === lines.length - 1;
      const totalWordsWidth = line.reduce((sum, w) => sum + w.width, 0);
      const spaceCount = line.length - 1;
      const totalSpacesWidth = maxWidth - totalWordsWidth;
      const spaceWidth = spaceCount > 0 ? totalSpacesWidth / spaceCount : 0;

      let currentX = x;
      
      line.forEach((wordObj, wordIndex) => {
        const { word, isBold } = wordObj;
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(word, currentX, currentY);
        
        if (wordIndex < line.length - 1) {
          if (isLastLine) {
            currentX += wordObj.width + doc.getTextWidth(' ');
          } else {
            currentX += wordObj.width + spaceWidth;
          }
        } else {
          currentX += wordObj.width;
        }
      });

      currentY += lineHeight;
    });

    return currentY;
  };

  const handlePrint = async (s: StudentCertificado) => {
    try {
      const doc = new jsPDF();
      const fecha = new Date();
      const dia = fecha.getDate();
      const mes = MESES[fecha.getMonth()];
      const anioHoy = fecha.getFullYear();
      const promovido = calcularPromovido(s.grado);

      // Add logo with a clean fast local check to prevent blocking image fetches
      const customLogo = localStorage.getItem('iea_custom_logo') || '';
      if (customLogo) {
        try {
          doc.addImage(customLogo, "PNG", 15, 10, 22, 22);
        } catch (e) {
          console.error("Custom logo rendering error:", e);
        }
      } else {
        // Render a beautiful, instant vector shield, avoiding blocking network wait!
        doc.setDrawColor(0, 80, 0);
        doc.setFillColor(240, 248, 240);
        doc.roundedRect(15, 10, 22, 22, 3, 3, 'FD');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 80, 0);
        doc.text("IE", 26, 20, { align: "center" });
        doc.text("ALVERNIA", 26, 24, { align: "center" });
      }

      // Generate QR Code dynamically from qrcode pkg
      try {
        const qrText = `Certificado_${s.documento}_${s.anio}`;
        const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1 });
        doc.addImage(qrDataUrl, "PNG", 175, 10, 18, 18);
      } catch (e) {
        console.error('QR code generation failed:', e);
      }

      // Certificado Header Layout
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 80, 0);
      doc.setFontSize(10);
      doc.text("REPÚBLICA DE COLOMBIA", 105, 18, { align: "center" });
      doc.text("INSTITUCIÓN EDUCATIVA ALVERNIA", 105, 23, { align: "center" });
      doc.text("NIVELES PREESCOLAR, BÁSICA PRIMARIA, SECUNDARIA Y MEDIA ACADÉMICA", 105, 28, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("CERTIFICADO FINAL DE GRADO", 105, 36, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("APROBADO POR RESOLUCIONES No. 2149 DE MAYO 12/72 No. 4713 DE MAYO 15/86 No. 0033 DE JUNIO 9/89", 105, 42, { align: "center" });
      doc.text("No. 0056 DE MAYO 26/92 No. 0275 DE JUNIO 1/98 RECONOCIMIENTO 0373 DE JULIO 2/99", 105, 46, { align: "center" });
      doc.text("DECRETO No. 0588 DE DICIEMBRE 6/02 INTEGRACIÓN DE ESTABLECIMIENTOS EDUCATIVOS", 105, 50, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("EL SUSCRITO RECTOR DE LA INSTITUCIÓN EDUCATIVA ALVERNIA", 105, 60, { align: "center" });
      doc.text("C E R T I F I C A", 105, 68, { align: "center" });

      // Paragraph transcript
      let y = 78;
      doc.setFontSize(10);
      const docText = s.documento ? ` identificado(a) con ${s.tipo_documento || 'TI'} ${s.documento}` : '';
      const parrafo = `Que el(la) estudiante ${s.nombre}${docText}, cursó y aprobó el grado ${s.grado}, jornada ${s.jornada}, durante el año lectivo ${s.anio}, con la siguiente intensidad horaria y juicios valorativos:`;

      const nombrePartes = s.nombre.split(' ');
      y = drawJustifiedText(doc, parrafo, 15, y, 180, 6, [...nombrePartes, s.grado, s.jornada, s.documento].filter(Boolean));

      // Academics Table
      const materiasRows = s.notas ? Object.entries(s.notas).map(([mat, d]) => [
        mat, d.ihs || "", d.nota || "", d.desempeno || ""
      ]) : [];

      autoTable(doc, {
        startY: y,
        head: [["Materia", "IHS", "Nota", "Desempeño"]],
        body: materiasRows,
        styles: { fontSize: 9, cellPadding: 1.2, halign: "center", lineColor: [0,0,0], lineWidth: 0.2 },
        headStyles: { fillColor: [0,0,0], textColor: [255,255,255] },
        columnStyles: { 0: { halign: "left" } }
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      // Comportamiento
      doc.setFont("helvetica", "bold");
      doc.text(`COMPORTAMIENTO SOCIAL: ${s.comportamiento || "NO REGISTRADO"}`, 15, y);
      doc.setFont("helvetica", "normal");
      y += 6;

      // Institution Grading Scale
      autoTable(doc, {
        startY: y,
        head: [["ESCALA DE VALORACIÓN INSTITUCIONAL", "ESCALA DE VALORACIÓN NACIONAL"]],
        body: [
          ["1.0 a 2.9", "Bajo"],
          ["3.0 a 3.7", "Básico"],
          ["3.8 a 4.4", "Alto"],
          ["4.5 a 5.0", "Superior"]
        ],
        styles: { fontSize: 9, cellPadding: 1, halign: "center", lineColor: [0,0,0], lineWidth: 0.2 },
        headStyles: { fillColor: [0,0,0], textColor: [255,255,255] }
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Promoted Observation
      doc.setFont("helvetica", "bold");
      if (promovido === "GRADUADO") {
        doc.text("OBSERVACIÓN: El estudiante fue GRADUADO.", 15, y);
      } else {
        doc.text(`OBSERVACIÓN: Promovido al grado ${promovido}.`, 15, y);
      }
      doc.setFont("helvetica", "normal");
      y += 12;

      // Dates and Locations
      doc.setFont("helvetica", "normal");
      doc.text(`Expedido en Puerto Asís, a los ${dia} días del mes de ${mes} de ${anioHoy}.`, 15, y);
      y += 18;

      // Retrieve dynamic rector parameters from configuration
      const rectorName = localStorage.getItem('iea_rector_name') || "ESP. CARLOS ARCESIO ACOSTA CORONEL";
      const rectorCargo = localStorage.getItem('iea_rector_cargo') || "RECTOR";
      const customSignature = localStorage.getItem('iea_custom_signature') || '';

      // Draw signature image if present, then signature line locally without blocking image requests
      if (customSignature) {
        try {
          doc.addImage(customSignature, "PNG", 82, y + 1, 40, 23);
        } catch (e) {
          console.error("Error rendering custom signature in CertificadosPanel:", e);
        }
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(80, y + 25, 125, y + 25);
      y += 28;

      doc.setFont("helvetica", "bold");
      doc.text(rectorName, 105, y, { align: "center" });
      doc.setFont("helvetica", "normal");
      y += 6;
      doc.text(rectorCargo, 105, y, { align: "center" });

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 80, 0);
      doc.text("Brindamos una educación humanística y académica para la excelencia de un ser humano integral", 105, 285, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("Dirección Cra 16 # 12-77 Barrio San Martin, Teléfono 4227048 - www.alvernia.edu.co - Puerto Asís Putumayo", 105, 290, { align: "center" });
      
      doc.save(`Certificado_${s.documento}_${s.anio}.pdf`);
    } catch (e: any) {
      console.error('PDF Generation failed:', e);
      alert('Error generando certificado PDF: ' + e.message);
    }
  };

  // Filter students by search bar query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.nombre.toLowerCase().includes(query) || 
      s.documento.includes(query) || 
      (s.grado && s.grado.toLowerCase().includes(query))
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-2xl border border-emerald-950 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="bg-emerald-600/30 text-emerald-200 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 inline-block mb-1.5">
              Academusoft Trámites - Local API
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-400" />
              Certificados Finales de Grado
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl">
              Generación de transcripciones certificadas oficiales, registros de plan de estudios y evaluaciones por año de la I.E. Alvernia.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Certificado
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 hover:text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Importar Excel
            </button>

            <button
              onClick={handleClearAllYear}
              className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 hover:text-white border border-rose-900/30 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Limpiar Base ({selectedAnio})
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar Selector & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Seleccionar Año Lectivo</label>
          <select
            value={selectedAnio}
            onChange={e => setSelectedAnio(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-extrabold text-slate-800 bg-white"
          >
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Buscar Estudiante (Nombre, Identificación o Grado)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Escriba documento, apellido o grado académico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Students Certificates Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-550 border-t-transparent rounded-full mb-3"></div>
            <p className="text-xs">Consultando estudiantes calificados ({selectedAnio}) de la Base de Datos...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold text-xs">{errorMsg}</p>
            <button onClick={loadData} className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Reintentar</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="font-bold text-xs">No hay certificados registrados para el año {selectedAnio}</p>
            <p className="text-[10px] mt-1 text-slate-500">Pruebe agregando un registro de notas y calificaciones en este periodo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700 font-medium">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Estudiante / Identificación</th>
                  <th className="p-4">Grado y Jornada</th>
                  <th className="p-4">Materias / Áreas Evaluadas</th>
                  <th className="p-4 text-center">Evaluación Social</th>
                  <th className="p-4 text-center">Constancia Oficial</th>
                  <th className="p-4 text-center">Procedimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70">
                {filteredStudents.map(student => {
                  const materiasEval = student.notas ? Object.keys(student.notas).length : 0;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 text-[11px] leading-tight">{student.nombre}</p>
                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                          {student.tipo_documento || 'CC'}-{student.documento}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-800">{student.grado}</p>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide">{student.jornada || 'ÚNICA'}</span>
                      </td>
                      <td className="p-4 font-semibold">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                          {materiasEval} Materias Registradas
                        </span>
                      </td>
                      <td className="p-4 text-center font-extrabold text-amber-700">
                        {student.comportamiento || 'NO REGISTRADO'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handlePrint(student)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-emerald-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Generar Certificado
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="bg-slate-50 hover:bg-slate-150 border border-slate-205 text-slate-700 p-1.5 rounded-lg cursor-pointer"
                            title="Editar Calificaciones"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => student.id && handleDelete(student.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg border border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS / NOTES GRADE REGISTRATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            
            {/* Header */}
            <div className="bg-teal-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{editId ? 'Editar Calificaciones del Registro' : 'Formulario Certificados Finales de Grado (Guardado en Base de Datos)'}</h3>
                <p className="text-[10px] text-teal-200 uppercase font-semibold mt-1">Institución Educativa Alvernia</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-teal-150 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Personal Student details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo Documento</label>
                  <select
                    value={formTipoDoc}
                    onChange={e => setFormTipoDoc(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700"
                  >
                    <option value="TI">TARJETA DE IDENTIDAD</option>
                    <option value="CC">CÉDULA DE CIUDADANÍA</option>
                    <option value="RC">REGISTRO CIVIL</option>
                    <option value="CE">CÉDULA DE EXTRANJERÍA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nº Documento *</label>
                  <input
                    type="text"
                    value={formDocumento}
                    onChange={e => setFormDocumento(e.target.value.toUpperCase())}
                    required
                    className="w-full p-2 border rounded-xl text-xs font-mono font-bold"
                    placeholder="Ej. 1084251..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre Completo del Estudiante *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value.toUpperCase())}
                    required
                    className="w-full p-2 border rounded-xl text-xs uppercase font-extrabold"
                    placeholder="Ej. JUAN PABLO CARVAJAL MONTOYA..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grado Académico</label>
                  <select
                    value={formGrado}
                    onChange={e => setFormGrado(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-white text-emerald-950 font-bold"
                  >
                    <option>PREJARDÍN</option>
                    <option>JARDÍN (-1°)</option>
                    <option>TRANSICIÓN (0°)</option>
                    <option>PRIMERO (1°)</option>
                    <option>SEGUNDO (2°)</option>
                    <option>TERCERO (3°)</option>
                    <option>CUARTO (4°)</option>
                    <option>QUINTO (5°)</option>
                    <option>SEXTO (6°)</option>
                    <option>SÉPTIMO (7°)</option>
                    <option>OCTAVO (8°)</option>
                    <option>NOVENO (9°)</option>
                    <option>DÉCIMO (10°)</option>
                    <option>UNDÉCIMO (11°)</option>
                    <option>CICLO I</option>
                    <option>CICLO II</option>
                    <option>CICLO III</option>
                    <option>CICLO IV</option>
                    <option>CICLO V</option>
                    <option>CICLO VI</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jornada</label>
                  <select
                    value={formJornada}
                    onChange={e => setFormJornada(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="ÚNICA">ÚNICA</option>
                    <option value="MAÑANA">MAÑANA</option>
                    <option value="TARDE">TARDE</option>
                    <option value="NOCTURNA">NOCTURNA</option>
                    <option value="FIN DE SEMANA">FIN DE SEMANA</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Comportamiento Social / Disciplina</label>
                  <select
                    value={formComportamiento}
                    onChange={e => setFormComportamiento(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-white text-teal-850 font-bold"
                  >
                    <option value="SUPERIOR">SUPERIOR (Excelente desempeño conductual)</option>
                    <option value="ALTO">ALTO (Acorde al manual de convivencia)</option>
                    <option value="BÁSICO">BÁSICO (Requiere nivelación y ajustes)</option>
                    <option value="BAJO">BAJO (Nivel de amonestación crítica)</option>
                  </select>
                </div>
              </div>

              {/* Grades / Notes Form grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <h4 className="font-extrabold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-teal-600" />
                    2. Desglose Detallado de Materias e Intensidad Horaria
                  </h4>
                  <button
                    type="button"
                    onClick={addNotaRow}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    + Agregar Materia
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50 p-2 rounded-lg">
                  <div className="col-span-5">Materia / Asignatura</div>
                  <div className="col-span-2 text-center">IHS (Hrs/Semana)</div>
                  <div className="col-span-2 text-center">Calificación (1.0 - 5.0)</div>
                  <div className="col-span-2 text-center">Desempeño Autocalculado</div>
                  <div className="col-span-1 text-center">Eliminar</div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
                  {formNotas.map((row, index) => {
                    const normalizedRowNota = normalizarNota(row.nota);
                    const calculatedRowDesempeno = calcularDesempeno(normalizedRowNota);
                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <select
                            value={row.materia}
                            onChange={e => handleNotaRowChange(index, 'materia', e.target.value)}
                            className="w-full p-2 border rounded-xl text-xs bg-white text-slate-800"
                          >
                            <option value="">--Seleccione Materia--</option>
                            {Array.from(new Set([...MATERIAS_PREDEFINIDAS, row.materia])).filter(Boolean).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <select
                            value={row.ihs}
                            onChange={e => handleNotaRowChange(index, 'ihs', e.target.value)}
                            className="w-full p-2 border rounded-xl text-xs bg-white text-center"
                          >
                            <option value="">--IHS--</option>
                            <option value="1">1 hora</option>
                            <option value="2">2 horas</option>
                            <option value="3">3 horas</option>
                            <option value="4">4 horas</option>
                            <option value="5">5 horas</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={row.nota}
                            onChange={e => handleNotaRowChange(index, 'nota', e.target.value)}
                            className="w-full p-2 border rounded-xl text-xs text-center font-mono font-bold text-slate-800"
                            placeholder="Ej: 4.5 o 4,5"
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                            calculatedRowDesempeno === 'SUPERIOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            calculatedRowDesempeno === 'ALTO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            calculatedRowDesempeno === 'BÁSICO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            calculatedRowDesempeno === 'BAJO' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {calculatedRowDesempeno || 'PENDIENTE'}
                          </span>
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeNotaRow(index)}
                            disabled={formNotas.length === 1}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 -mx-6 -mb-6 p-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded-xl border hover:bg-slate-200 transition-colors font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-teal-900 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editId ? 'Guardar Cambios' : 'Confirmar Registro Oficial'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Importar Estudiantes y Notas de Certificados desde Excel
                </h3>
                <p className="text-[10px] text-emerald-200 uppercase font-black tracking-wide mt-1">Institución Educativa Alvernia - Módulo de la Base de Datos</p>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportingState({
                    status: 'idle',
                    progress: 0,
                    total: 0,
                    students: [],
                    detectedSubjects: [],
                    error: null
                  });
                }} 
                className="text-emerald-150 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {importingState.status === 'idle' || importingState.status === 'parsing' ? (
                <div className="space-y-4">
                  
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">¿Cómo debe estar estructurado el archivo Excel?</p>
                      <ul className="text-[11px] text-emerald-800 list-disc pl-4 mt-1 space-y-1 font-medium">
                        <li>El sistema buscará columnas de identificación como <strong className="font-black text-emerald-950">CEDULA, IDENTIFICACION, CC, DOCUMENTO o NRO</strong>.</li>
                        <li>También buscará la columna del estudiante como <strong className="font-black text-emerald-950">NOMBRE, ESTUDIANTE o APELLIDOS</strong>.</li>
                        <li>Las demás columnas (ej. <span className="font-mono bg-emerald-100 px-1 rounded text-emerald-900">INGLES</span>, <span className="font-mono bg-emerald-100 px-1 rounded text-emerald-900">MATEMATICAS</span>, <span className="font-mono bg-emerald-100 px-1 rounded text-emerald-900">BIOLOGIA</span>) serán tratadas automáticamente como asignaturas y se cargarán las notas tal cual de cada fila.</li>
                        <li>Las notas numéricas (ej. <span className="bg-emerald-100 px-1 rounded">3.5</span> o <span className="bg-emerald-100 px-1 rounded">4,0</span>) serán auto-evaluadas según la escala institucional.</li>
                      </ul>
                    </div>
                  </div>

                  <div
                    onDragEnter={(e) => { e.preventDefault(); setImportDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setImportDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setImportDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setImportDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        setImportFile(file);
                        processImportFile(file);
                      }
                    }}
                    onClick={() => document.getElementById('excel-file-selector')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      importDragActive 
                        ? 'border-emerald-500 bg-emerald-50/50 scale-[0.98]' 
                        : 'border-slate-200 hover:border-emerald-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      id="excel-file-selector"
                      type="file"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImportFile(file);
                          processImportFile(file);
                        }
                      }}
                    />
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-4">
                      <Upload className="w-7 h-7 animate-pulse" />
                    </div>
                    <p className="font-bold text-slate-700 text-sm mb-1">
                      {importingState.status === 'parsing' ? 'Procesando archivo excel...' : 'Arrastra y suelta tu archivo Excel aquí'}
                    </p>
                    <p className="text-xs text-slate-500 text-center">
                      o <span className="text-emerald-600 font-extrabold hover:underline">haz clic para explorar en el equipo</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">Formatos válidos: .xlsx, .xls</p>
                  </div>

                  {importingState.error && (
                    <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{importingState.error}</span>
                    </div>
                  )}

                </div>
              ) : importingState.status === 'preview' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl flex items-center justify-between border border-emerald-100">
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5 text-emerald-950">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Vista Previa: {importFile?.name}
                      </p>
                      <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                        Se detectaron <span className="font-extrabold text-emerald-950">{importingState.students.length}</span> estudiantes con <span className="font-extrabold text-emerald-950">{importingState.detectedSubjects.length}</span> asignaturas evaluadas.
                      </p>
                    </div>
                    <button
                      onClick={handleExecuteImport}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer font-sans"
                    >
                      <Check className="w-4 h-4" />
                      Procesar e Importar
                    </button>
                  </div>

                  {importingState.detectedSubjects.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                          Nuevas Materias Identificadas ({importingState.detectedSubjects.length}) - Configurar IHS
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-1 border border-slate-200 rounded">
                          Estos valores se guardarán automáticamente
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {importingState.detectedSubjects.map((sub, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg">
                            <span className="font-bold text-[10px] text-slate-700 uppercase">{sub}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">IHS:</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={importIhsMap[sub] || ''}
                                onChange={(e) => setImportIhsMap(prev => ({ ...prev, [sub]: e.target.value }))}
                                className="w-14 p-1 border border-emerald-300 bg-emerald-50 rounded text-center text-xs font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                          <th className="p-3">Doc</th>
                          <th className="p-3">Nombre</th>
                          <th className="p-3">Grado</th>
                          <th className="p-3">Año Lectivo</th>
                          <th className="p-3">Calificaciones cargadas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium animate-none">
                        {importingState.students.map((student, index) => {
                          const numEvaluated = Object.keys(student.notas).length;
                          return (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-slate-500 text-[10px] font-bold">{student.tipo_documento}-{student.documento}</td>
                              <td className="p-3 font-extrabold text-slate-900 text-[11px]">{student.nombre}</td>
                              <td className="p-3 font-bold text-slate-600 text-[10px]">{student.grado}</td>
                              <td className="p-3"><span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded text-[10px]">{student.anio}</span></td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-black px-2 py-0.5 rounded-full text-[10px]">
                                  {numEvaluated} notas
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setImportFile(null);
                        setImportingState(prev => ({
                          ...prev,
                          status: 'idle',
                          students: [],
                          detectedSubjects: []
                        }));
                      }}
                      className="py-2 px-4 rounded-xl border hover:bg-slate-100 text-slate-600 font-bold text-xs"
                    >
                      Atrás (Cargar otro)
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="animate-spin inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Registrando estudiantes en la Base de Datos...</h4>
                    <p className="text-xs text-slate-500 mt-1">Guarda, actualiza y vincula calificaciones automáticamente. No cierre el navegador.</p>
                  </div>
                  <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${(importingState.progress / importingState.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    {importingState.progress} / {importingState.total} ({Math.round((importingState.progress / importingState.total) * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {(importingState.status === 'idle' || importingState.status === 'parsing') && (
              <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportingState({
                      status: 'idle',
                      progress: 0,
                      total: 0,
                      students: [],
                      detectedSubjects: [],
                      error: null
                    });
                  }}
                  className="py-2 px-5 rounded-xl border hover:bg-slate-205 transition-colors font-semibold text-xs text-slate-700 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
