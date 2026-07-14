import React, { useState, useEffect, useMemo } from 'react';

import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Printer, 
  X, 
  Save, 
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
// @ts-ignore
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface StudentMatricula {
  id?: string;
  primerApellido?: string;
  segundoApellido?: string;
  primerNombre?: string;
  segundoNombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  fechaNacimiento?: string;
  nivelEducativo?: string;
  grado?: string;
  fechaMatricula?: string;
  jornada?: string;
  sede?: string;
  sexo?: string;
  municipioResidencia?: string;
  direccionResidencia?: string;
  telefonoCelular?: string;
  epsAfiliacion?: string;
  grupoEtnico?: string;
  viveCon?: string;
  repitente?: string;
  discapacidad?: string;
  estudioAnterior?: string;
  institucionAnterior?: string;
  numHermanos?: string;
  grados?: string;
  correoEstudiante?: string;
  estrato?: string;
  tipoSangre?: string;
  acudienteApellidos?: string;
  acudienteNombres?: string;
  acudienteDocumento?: string;
  acudienteMunicipio?: string;
  acudienteDireccion?: string;
  acudienteTelefono?: string;
  acudienteParentesco?: string;
  acudienteProfesion?: string;
}

// Convert camelCase to snake_case for Supabase
function toSnakeCase(obj: any): any {
  const snakeCaseObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    snakeCaseObj[snakeKey] = obj[key];
  }
  return snakeCaseObj;
}

// Convert snake_case to camelCase for frontend state
function toCamelCase(obj: any): any {
  if (!obj) return {};
  const camelCaseObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    camelCaseObj[camelKey] = obj[key];
  }
  return camelCaseObj;
}

export default function MatriculasPanel({ showToast }: { showToast?: (msg: string) => void }) {
  const [students, setStudents] = useState<StudentMatricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorErrorMsg] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSede, setFilterSede] = useState('TODAS');
  const [filterGrado, setFilterGrado] = useState('TODOS');
  const [filterSexo, setFilterSexo] = useState('TODOS');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formState, setFormState] = useState<StudentMatricula>({
    primerApellido: '', segundoApellido: '', primerNombre: '', segundoNombre: '',
    tipoDocumento: '', numeroDocumento: '', fechaNacimiento: '', nivelEducativo: '',
    grado: '', fechaMatricula: new Date().toISOString().substring(0, 10), jornada: 'ÚNICA', 
    sede: 'COL ALVERNIA', sexo: 'MASCULINO', municipioResidencia: '', direccionResidencia: '',
    telefonoCelular: '', epsAfiliacion: '', grupoEtnico: 'NINGUNO', viveCon: 'PADRES',
    repitente: 'NO', discapacidad: 'NO', estudioAnterior: 'SÍ', institucionAnterior: '',
    numHermanos: '0', grados: 'NO APLICA', correoEstudiante: '', estrato: '', tipoSangre: '',
    acudienteApellidos: '', acudienteNombres: '', acudienteDocumento: '',
    acudienteMunicipio: '', acudienteDireccion: '', acudienteTelefono: '',
    acudienteParentesco: '', acudienteProfesion: ''
  });

  // Dynamic html2pdf loader
  useEffect(() => {
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch from Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matriculas');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = json.data;
      setStudents(data ? data.map(item => toCamelCase(item)) : []);
      setErrorErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching matriculas:', err);
      setErrorErrorMsg('No se pudieron cargar los datos de matrícula. Compruebe la conexión o las tablas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Input Changes with auto uppercase
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | React.HTMLAttributes<HTMLInputElement> | any>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  // Open modal for editing
  const handleEdit = (student: StudentMatricula) => {
    setEditId(student.id || null);
    setFormState({ ...student });
    setShowModal(true);
  };

  // Delete student
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este estudiante matriculado definitivamente?')) return;
    try {
      const res = await fetch(`/api/matriculas/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStudents(prev => prev.filter(s => s.id !== id));
      alert('Matrícula eliminada exitosamente.');
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert('Error al intentar borrar el registro: ' + err.message);
    }
  };

  // Submit / Save student
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.primerApellido || !formState.primerNombre || !formState.numeroDocumento) {
      alert('Complete los campos obligatorios de primer apellido, primer nombre y documento');
      return;
    }

    const payload = toSnakeCase(formState);
    try {
      if (editId) {
        payload.id = editId;
        const res = await fetch('/api/matriculas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Matrícula actualizada correctamente.');
      } else {
        const res = await fetch('/api/matriculas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Estudiante matriculado correctamente.');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving student:', err);
      alert('Error guardando los datos en Supabase: ' + err.message);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const exportData = filteredStudents.map(s => ({
      "PRIMER APELLIDO": s.primerApellido || '',
      "SEGUNDO APELLIDO": s.segundoApellido || '',
      "PRIMER NOMBRE": s.primerNombre || '',
      "SEGUNDO NOMBRE": s.segundoNombre || '',
      "TIPO DOCUMENTO": s.tipoDocumento || '',
      "DOCUMENTO": s.numeroDocumento || '',
      "FECHA NACIMIENTO": s.fechaNacimiento || '',
      "NIVEL EDUCATIVO": s.nivelEducativo || '',
      "GRADO": s.grado || '',
      "FECHA MATRICULA": s.fechaMatricula || '',
      "JORNADA": s.jornada || '',
      "SEDE": s.sede || '',
      "SEXO": s.sexo || '',
      "MUNICIPIO RESIDENCIA": s.municipioResidencia || '',
      "DIRECCION": s.direccionResidencia || '',
      "TELEFONO": s.telefonoCelular || '',
      "EPS": s.epsAfiliacion || '',
      "GRUPO ETNICO": s.grupoEtnico || '',
      "VIVE CON": s.viveCon || '',
      "REPITENTE": s.repitente || '',
      "DISCAPACIDAD": s.discapacidad || '',
      "ESTUDIO ANTERIOR": s.estudioAnterior || '',
      "INSTITUCION ANTERIOR": s.institucionAnterior || '',
      "CORREO ELECTRONICO": s.correoEstudiante || '',
      "ESTRATO": s.estrato || '',
      "TIPO SANGRE": s.tipoSangre || '',
      "ACUDIENTE APELLIDOS": s.acudienteApellidos || '',
      "ACUDIENTE NOMBRES": s.acudienteNombres || '',
      "ACUDIENTE DOCUMENTO": s.acudienteDocumento || '',
      "ACUDIENTE TELEFONO": s.acudienteTelefono || '',
      "ACUDIENTE PARENTESCO": s.acudienteParentesco || '',
      "ACUDIENTE PROFESION": s.acudienteProfesion || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matriculados");
    XLSX.writeFile(wb, "Estudiantes_Matriculados_IEA.xlsx");
  };

  // Generate gorgeous ficha PDF using html2pdf

const handlePrint = async (s: StudentMatricula) => {
    if (showToast) showToast('Generando Ficha de Matrícula...');
    
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const val = (v: any) => (v || "").toString().toUpperCase();
    
    // Fonts and colors
    const primaryColor = [93, 138, 168]; // #5d8aa8
    const textColor = [51, 65, 85]; // #334155
    
    // Helpers
    const drawSection = (y: number, height: number, title: string) => {
      // Outer outline box
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(10, y, 195, height, 1.5, 1.5);
      
      // Header background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(10, y, 195, 5, 1.5, 1.5, 'F');
      doc.rect(10, y + 2.5, 195, 2.5, 'F'); // square bottom corners
      
      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(title, 107.5, y + 3.5, { align: "center" });
    };

    const drawHalfSection = (x: number, y: number, w: number, h: number, title: string) => {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 1.5, 1.5);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(title, x + w/2, y + 4, { align: "center" });
      
      doc.line(x, y + 6, x + w, y + 6);
    };

    const drawField = (x: number, y: number, w: number, h: number, label: string, value: string) => {
      // Label above box
      doc.setTextColor(30, 40, 50); // Negro suave que concuerda con la ficha
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text(label, x + (w/2), y + 2.5, { align: "center" });
      
      // Box
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y + 3, w, h - 3, 1.5, 1.5);
      
      // Centered value
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const splitVal = doc.splitTextToSize(value, w - 2);
      doc.text(splitVal, x + (w/2), y + 7.5, { align: "center" });
    };

    const drawRow = (y: number, fields: {lbl: string, val: string, w: number}[]) => {
      const startX = 12;
      const totalW = 191;
      const gap = 2; // Exact gap for uniform distribution
      const baseUnit = (totalW - (4 * gap)) / 5; // 5 column strict layout
      
      let currentX = startX;
      fields.forEach(f => {
        const w = (f.w * baseUnit) + ((f.w - 1) * gap);
        drawField(currentX, y, w, 10, f.lbl, f.val);
        currentX += w + gap;
      });
    };

    // --- Header ---
    const customLogoBase64 = localStorage.getItem('iea_custom_logo') || '';
    if (customLogoBase64) {
      try { doc.addImage(customLogoBase64, "PNG", 14, 6, 18, 21); } catch(e){}
    } else {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.circle(23, 16, 10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text("ALV", 23, 17.5, { align: "center" });
    }
    
    doc.setTextColor(30, 58, 138); // #1e3a8a
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("INSTITUCIÓN EDUCATIVA ALVERNIA", 104, 12, { align: "center" });
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(7);
    doc.text("NIVEL PREESCOLAR - BÁSICA PRIMARIA Y MEDIA ACADÉMICA", 104, 16, { align: "center" });
    doc.text("CALENDARIO A - CÓDIGO DANE 186568000567 NIT. 891201897-5", 104, 19.5, { align: "center" });
    doc.text("Dirección: Calle 16 Nro. 12-77 • B/ San Martín • Tel. 4227048", 104, 23, { align: "center" });
    
    // Ficha pill
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(64, 25, 80, 6, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("FICHA DE MATRÍCULA", 104, 29.2, { align: "center" });
    
    // Foto Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(182, 6, 23, 26, 1.5, 1.5); // Movido un poco hacia arriba para no pegarse al cuadro de abajo
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("FOTO", 193.5, 20.5, { align: "center" });

    // --- Sections ---
    
    // 1. DATOS DE MATRÍCULA
    let startY = 35;
    drawSection(startY, 18, "DATOS DE MATRÍCULA");
    drawRow(startY + 6.5, [
      { lbl: "SEDE", val: val(s.sede), w: 1 },
      { lbl: "NIVEL EDUCATIVO", val: val(s.nivelEducativo), w: 1 },
      { lbl: "GRADO", val: val(s.grado), w: 1 },
      { lbl: "JORNADA", val: val(s.jornada), w: 1 },
      { lbl: "FECHA MATRÍCULA", val: val(s.fechaMatricula), w: 1 }
    ]);

    // 2. DATOS DEL ESTUDIANTE
    startY = 55;
    drawSection(startY, 64, "DATOS DEL ESTUDIANTE");
    drawRow(startY + 6.5, [
      { lbl: "PRIMER APELLIDO", val: val(s.primerApellido), w: 1 },
      { lbl: "SEGUNDO APELLIDO", val: val(s.segundoApellido) || '-', w: 1 },
      { lbl: "PRIMER NOMBRE", val: val(s.primerNombre), w: 1 },
      { lbl: "SEGUNDO NOMBRE", val: val(s.segundoNombre) || '-', w: 1 },
      { lbl: "TIPO DOC.", val: val(s.tipoDocumento), w: 1 }
    ]);
    drawRow(startY + 18, [
      { lbl: "NRO DOC.", val: val(s.numeroDocumento), w: 1 },
      { lbl: "FECHA NAC.", val: val(s.fechaNacimiento), w: 1 },
      { lbl: "SEXO", val: val(s.sexo), w: 1 },
      { lbl: "ESTRATO", val: val(s.estrato) || '-', w: 1 },
      { lbl: "TIPO DE SANGRE", val: val(s.tipoSangre) || '-', w: 1 }
    ]);
    drawRow(startY + 29.5, [
      { lbl: "MUNICIPIO", val: val(s.municipioResidencia), w: 1 },
      { lbl: "DIRECCIÓN", val: val(s.direccionResidencia) || '-', w: 1 },
      { lbl: "TELÉFONO", val: val(s.telefonoCelular) || '-', w: 1 },
      { lbl: "EPS", val: val(s.epsAfiliacion) || '-', w: 1 },
      { lbl: "GRUPO ÉTNICO", val: val(s.grupoEtnico) || 'NINGUNO', w: 1 }
    ]);
    drawRow(startY + 41, [
      { lbl: "CON QUIÉN VIVE", val: val(s.viveCon) || 'PADRES', w: 1 },
      { lbl: "REPITENTE", val: val(s.repitente) || 'NO', w: 1 },
      { lbl: "DISCAPACIDAD", val: val(s.discapacidad) || 'NINGUNA', w: 1 },
      { lbl: "ESTUDIÓ AÑO ANT.", val: val(s.estudioAnterior) ? 'SÍ' : 'NO', w: 1 },
      { lbl: "N° HERMANOS/AS", val: val(s.numHermanos) || 'NO APLICA', w: 1 }
    ]);
    drawRow(startY + 52.5, [
      { lbl: "INSTITUCIÓN ANTERIOR", val: val(s.institucionAnterior) || '-', w: 2 },
      { lbl: "GRADOS", val: val(s.grados) || 'NO APLICA', w: 1 },
      { lbl: "CORREO ESTUDIANTE", val: val(s.correoEstudiante) || val(s.numeroDocumento) + '@alvernia.edu.co', w: 2 }
    ]);

    // 3. DATOS DEL ACUDIENTE
    startY = 121;
    drawSection(startY, 30, "DATOS DEL ACUDIENTE");
    drawRow(startY + 6.5, [
      { lbl: "APELLIDOS", val: val(s.acudienteApellidos) || '-', w: 1 },
      { lbl: "NOMBRES", val: val(s.acudienteNombres) || '-', w: 1 },
      { lbl: "NRO DOCUMENTO", val: val(s.acudienteDocumento) || '-', w: 1 },
      { lbl: "TELÉFONO", val: val(s.acudienteTelefono) || '-', w: 1 },
      { lbl: "MUNICIPIO", val: val(s.acudienteMunicipio) || 'PUERTO ASÍS', w: 1 }
    ]);
    drawRow(startY + 18, [
      { lbl: "DIRECCIÓN", val: val(s.acudienteDireccion) || '-', w: 2 },
      { lbl: "PARENTESCO", val: val(s.acudienteParentesco) || '-', w: 1 },
      { lbl: "PROFESIÓN", val: val(s.acudienteProfesion) || '-', w: 2 }
    ]);

    // 4. RENOVACIÓN DE MATRÍCULA
    startY = 153;
    drawSection(startY, 20, "RENOVACIÓN DE MATRÍCULA (MARQUE CON UNA X)");
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(10, startY + 13, 205, startY + 13);
    for(let i=1; i<7; i++) {
      doc.line(10 + (27.85 * i), startY + 5, 10 + (27.85 * i), startY + 20);
    }
    const yearsRow1 = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
    const yearsRow2 = [2033, 2034, 2035, 2036, 2037, 2038, 2039];
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    yearsRow1.forEach((y, i) => doc.text(y.toString(), 10 + (27.85 * i) + 13.9, startY + 10, { align: "center" }));
    yearsRow2.forEach((y, i) => doc.text(y.toString(), 10 + (27.85 * i) + 13.9, startY + 17, { align: "center" }));

    // 5. SOLICITUD DE RETIRO Y CAUSAS
    startY = 175;
    drawSection(startY, 37, "SOLICITUD DE RETIRO Y CAUSAS");
    drawRow(startY + 6.5, [
      { lbl: "FECHA RETIRO", val: "", w: 1 },
      { lbl: "NOMBRE QUIEN SOLICITA", val: "", w: 2 },
      { lbl: "FIRMA QUIEN SOLICITA", val: "", w: 2 }
    ]);
    
    // Subheader
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, startY + 18, 195, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("MARQUE CON UNA X EL MOTIVO", 107.5, startY + 21.5, { align: "center" });

    const drawCB = (x: number, y: number, label: string) => {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(x, y, 3, 3);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(label, x + 4.5, y + 2.5);
    };
    drawCB(14, startY + 25, "CAMBIO DOMICILIO");
    drawCB(60, startY + 25, "SITUACIÓN ECONÓMICA");
    drawCB(115, startY + 25, "SANCIÓN INSTITUCIONAL");
    drawCB(165, startY + 25, "TRASLADO");
    
    drawCB(14, startY + 30, "BAJO RENDIMIENTO");
    drawCB(60, startY + 30, "SALUD");
    drawCB(115, startY + 30, "OTRO");

    // 6. TIPO DE MATRÍCULA y DOCUMENTOS
    startY = 214;
    drawHalfSection(10, startY, 95.5, 37, "TIPO DE MATRÍCULA");
    drawHalfSection(109.5, startY, 95.5, 37, "DOCUMENTOS HABILITANTES QUE PRESENTA");

    const drawCheckRow = (x: number, y: number, label: string) => {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(label, x + 2, y + 3.5);
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      doc.roundedRect(x + 72, y, 6, 4.5, 0.5, 0.5);
      doc.text("SI", x + 73.5, y + 3.5);
      
      doc.roundedRect(x + 80, y, 6, 4.5, 0.5, 0.5);
      doc.text("NO", x + 81, y + 3.5);
    };

    let checkY = startY + 8;
    drawCheckRow(11.5, checkY, "Matrícula Condicional");
    drawCheckRow(111.5, checkY, "Copia Registro Civil");
    
    checkY += 4.5;
    drawCheckRow(11.5, checkY, "Antecedentes conductuales");
    drawCheckRow(111.5, checkY, "Tarjeta Identidad / Cédula Estudiante");
    
    checkY += 4.5;
    drawCheckRow(11.5, checkY, "Inasistencia reiterada");
    drawCheckRow(111.5, checkY, "Cédula Acudiente");
    
    checkY += 4.5;
    drawCheckRow(11.5, checkY, "Atención especializada");
    drawCheckRow(111.5, checkY, "Certificado / Carnet Salud");
    
    checkY += 4.5;
    drawCheckRow(11.5, checkY, "Colaborar con actividades");
    drawCheckRow(111.5, checkY, "Recibo Energía");
    
    checkY += 4.5;
    drawCheckRow(11.5, checkY, "No Aplica");
    drawCheckRow(111.5, checkY, "2 Fotos Carnet");

    // 7. Firmas
    startY = 267; // Bajado para aprovechar el espacio al final de la página
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.line(35, startY, 85, startY);
    doc.line(130, startY, 180, startY);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Firma Estudiante", 60, startY + 4, { align: "center" });
    doc.text("Firma Acudiente", 155, startY + 4, { align: "center" });

    // === PÁGINA 2 ===
    doc.addPage();
    
    // Título
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RENOVACIÓN DE MATRÍCULA", 107.5, 20, { align: "center" });

    // Subtítulo (Píldora)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(10, 25, 195, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("NOS COMPROMETEMOS A CUMPLIR EL REGLAMENTO DE LA INSTITUCIÓN", 107.5, 30, { align: "center" });

    // Tabla
    let currentY = 36;
    const colWidths = [14, 14, 14, 72.5, 72.5];
    const colLabels = ["GRADO", "EDAD", "AÑO", "FIRMA DEL ESTUDIANTE", "FIRMA ACUDIENTE"];
    const gapX = 2;
    const gapY = 1.5;
    const rowH = 5.5;
    const numRows = 22;

    let cx = 10;
    for(let c=0; c<5; c++) {
      // Draw Header
      doc.setFillColor(225, 235, 245); // Color gris claro/azulado que concuerda
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, currentY, colWidths[c], 6.5, 1, 1, 'FD');
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(colLabels[c], cx + colWidths[c]/2, currentY + 4.5, { align: "center" });
      
      // Draw Cells
      let cy = currentY + 6.5 + gapY;
      for(let r=0; r<numRows; r++) {
         doc.roundedRect(cx, cy, colWidths[c], rowH, 0.5, 0.5, 'S');
         cy += rowH + gapY;
      }
      
      cx += colWidths[c] + gapX;
    }

    // Observaciones
    const obsY = currentY + 6.5 + gapY + numRows*(rowH + gapY) + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("OBSERVACIONES:", 10, obsY);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(40, obsY, 205, obsY);
    
    let lineY = obsY + 8;
    for(let i=0; i<4; i++) {
       doc.line(10, lineY, 205, lineY);
       lineY += 8;
    }
    
    // Firma Rector
    const activeRectorSignature = localStorage.getItem('iea_custom_signature') || '';
    if (activeRectorSignature && activeRectorSignature.length > 50) {
      try {
        let sigFormat = "PNG";
        if (activeRectorSignature.includes("image/jpeg") || activeRectorSignature.includes("image/jpg")) sigFormat = "JPEG";
        else if (activeRectorSignature.includes("image/webp")) sigFormat = "WEBP";
        doc.addImage(activeRectorSignature, sigFormat, 87.5, lineY + 5, 40, 20);
      } catch(e) {
        console.error("Error drawing signature", e);
      }
    }
    
    doc.line(70, lineY + 28, 145, lineY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Firma Rector", 107.5, lineY + 33, { align: "center" });

    doc.save(`Ficha_Matricula_${s.numeroDocumento || 'Ficha'}.pdf`);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = `${s.primerNombre} ${s.segundoNombre} ${s.primerApellido} ${s.segundoApellido}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.numeroDocumento?.includes(searchQuery);
      
      const sedeMatch = filterSede === 'TODAS' || s.sede === filterSede;
      const gradoMatch = filterGrado === 'TODOS' || s.grado === filterGrado;
      const sexoMatch = filterSexo === 'TODOS' || s.sexo === filterSexo;

      return nameMatch && sedeMatch && gradoMatch && sexoMatch;
    });
  }, [students, searchQuery, filterSede, filterGrado, filterSexo]);

  return (
    <div className="space-y-6">
      
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-sky-950 text-white p-6 rounded-2xl border border-blue-950 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="bg-blue-600/30 text-blue-200 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-500/20 inline-block mb-1.5">
              Academusoft Trámites - Supabase
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-sky-400" />
              Planilla y Matrículas Escolares
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl">
              Administración de matrículas, registros sociofamiliares de estudiantes de los diferentes grados y sedes de la I.E. Alvernia.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditId(null);
                setFormState({
                  primerApellido: '', segundoApellido: '', primerNombre: '', segundoNombre: '',
                  tipoDocumento: 'TI', numeroDocumento: '', fechaNacimiento: '', nivelEducativo: 'Primaria',
                  grado: 'PRIMERO 1°', fechaMatricula: new Date().toISOString().substring(0, 10), jornada: 'MAÑANA',
                  sede: 'COL ALVERNIA', sexo: 'MASCULINO', municipioResidencia: 'PUERTO ASÍS', direccionResidencia: '',
                  telefonoCelular: '', epsAfiliacion: '', grupoEtnico: 'NINGUNO', viveCon: 'PADRES',
                  repitente: 'NO', discapacidad: 'NO', estudioAnterior: 'SÍ', institucionAnterior: 'IEA',
                  numHermanos: '0', grados: 'NO APLICA', correoEstudiante: '', estrato: '1', tipoSangre: 'O+',
                  acudienteApellidos: '', acudienteNombres: '', acudienteDocumento: '',
                  acudienteMunicipio: 'PUERTO ASÍS', acudienteDireccion: '', acudienteTelefono: '',
                  acudienteParentesco: 'MADRE', acudienteProfesion: 'HOGAR'
                });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Matricular Estudiante
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar XLSX
            </button>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Buscar Estudiante o Documento</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ej. Juan Pérez..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Filtrar Sede de Trabajo</label>
          <select
            value={filterSede}
            onChange={e => setFilterSede(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 uppercase font-semibold text-slate-700 bg-white"
          >
            <option value="TODAS">TODAS LAS SEDES</option>
            <option value="COL ALVERNIA">COL ALVERNIA</option>
            <option value="SAN MARTIN">SAN MARTIN</option>
            <option value="SAN NICOLAS">SAN NICOLAS</option>
            <option value="SANTO DOMINGO SAVIO">SANTO DOMINGO SAVIO</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Filtrar Grado Académico</label>
          <select
            value={filterGrado}
            onChange={e => setFilterGrado(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 uppercase font-semibold text-slate-700 bg-white"
          >
            <option value="TODOS">TODOS LOS GRADOS</option>
            <option value="JARDÍN -1°">JARDÍN -1°</option>
            <option value="TRANSICIÓN 0°">TRANSICIÓN 0°</option>
            <option value="PRIMERO 1°">PRIMERO 1°</option>
            <option value="SEGUNDO 2°">SEGUNDO 2°</option>
            <option value="TERCERO 3°">TERCERO 3°</option>
            <option value="CUARTO 4°">CUARTO 4°</option>
            <option value="QUINTO 5°">QUINTO 5°</option>
            <option value="SEXTO 6°">SEXTO 6°</option>
            <option value="SÉPTIMO 7°">SÉPTIMO 7°</option>
            <option value="OCTAVO 8°">OCTAVO 8°</option>
            <option value="NOVENO 9°">NOVENO 9°</option>
            <option value="DÉCIMO 10°">DÉCIMO 10°</option>
            <option value="UNDÉCIMO 11°">UNDÉCIMO 11°</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Sexo / Género</label>
          <select
            value={filterSexo}
            onChange={e => setFilterSexo(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 uppercase font-semibold text-slate-700 bg-white"
          >
            <option value="TODOS">TODOS</option>
            <option value="MASCULINO">MASCULINO</option>
            <option value="FEMENINO">FEMENINO</option>
          </select>
        </div>

      </div>

      {/* Main Student Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-xs">Cargando matrículas desde la Base de Datos...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold text-xs">{errorMsg}</p>
            <button onClick={loadData} className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Reintentar</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="font-bold text-xs">No se encontraron estudiantes matriculados</p>
            <p className="text-[10px] mt-1 text-slate-500">Pruebe registrando uno nuevo o cambiando los filtros creados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Estudiante / Apellidos y Nombres</th>
                  <th className="p-4">Identificación</th>
                  <th className="p-4">Año / Grado y Sede</th>
                  <th className="p-4">Celular Contacto</th>
                  <th className="p-4 text-center">Ficha PDF</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70">
                {filteredStudents.map(student => {
                  const nombreC = `${student.primerApellido || ''} ${student.segundoApellido || ''} ${student.primerNombre || ''} ${student.segundoNombre || ''}`.replace(/\s+/g, ' ').toUpperCase();
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-blue-50 text-blue-800 rounded-full flex items-center justify-center font-black text-[10px]">
                            {student.primerApellido?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="text-[11px] leading-tight">{nombreC}</p>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">{student.jornada}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                          {student.tipoDocumento}-{student.numeroDocumento}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-blue-900">{student.grado}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{student.sede || 'COL ALVERNIA'}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {student.telefonoCelular || 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handlePrint(student)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 px-3 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border border-amber-200 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Ficha
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(student)}
                            className="bg-slate-50 hover:bg-slate-150 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Editar Datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => student.id && handleDelete(student.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                            title="Borrar Matrícula"
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

      {/* REGISTRATION MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            
            {/* Header */}
            <div className="bg-blue-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{editId ? 'Editar Información General de Estudiante' : 'Formulario Registro Único de Matrícula (Supabase)'}</h3>
                <p className="text-[10px] text-blue-200 uppercase font-semibold mt-1">Institución Educativa Alvernia</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-blue-100 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Section 1: Datos del Estudiante */}
              <div>
                <h4 className="border-b border-slate-200 pb-1.5 font-extrabold text-blue-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
                  Datos del Estudiante
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Row 1 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primer Apellido *</label>
                    <input type="text" name="primerApellido" value={formState.primerApellido} onChange={handleInputChange} required className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Segundo Apellido</label>
                    <input type="text" name="segundoApellido" value={formState.segundoApellido} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primer Nombre *</label>
                    <input type="text" name="primerNombre" value={formState.primerNombre} onChange={handleInputChange} required className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Segundo Nombre</label>
                    <input type="text" name="segundoNombre" value={formState.segundoNombre} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo Documento *</label>
                    <select name="tipoDocumento" value={formState.tipoDocumento} onChange={e => setFormState(prev => ({...prev, tipoDocumento: e.target.value}))} required className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="">Seleccione...</option>
                      <option value="RC">REGISTRO CIVIL</option>
                      <option value="TI">TARJETA DE IDENTIDAD</option>
                      <option value="CC">CÉDULA DE CIUDADANÍA</option>
                      <option value="CE">CÉDULA DE EXTRANJERÍA</option>
                      <option value="PPT">PPT / OTRO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Número Documento *</label>
                    <input type="text" name="numeroDocumento" value={formState.numeroDocumento} onChange={handleInputChange} required className="w-full p-2 border rounded-xl text-xs font-mono font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha Nacimiento</label>
                    <input type="date" name="fechaNacimiento" value={formState.fechaNacimiento} onChange={e => setFormState(prev => ({...prev, fechaNacimiento: e.target.value}))} className="w-full p-2 border rounded-xl text-xs text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nivel Educativo</label>
                    <select name="nivelEducativo" value={formState.nivelEducativo} onChange={e => setFormState(prev => ({...prev, nivelEducativo: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="">Seleccione...</option>
                      <option value="Preescolar">PREESCOLAR</option>
                      <option value="Primaria">PRIMARIA</option>
                      <option value="Básica Secundaria">BÁSICA SECUNDARIA</option>
                      <option value="Media">MEDIA ACADÉMICA</option>
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grado al que se matricula *</label>
                    <select name="grado" value={formState.grado} onChange={e => setFormState(prev => ({...prev, grado: e.target.value}))} required className="w-full p-2 border rounded-xl text-xs bg-white text-blue-900 font-bold">
                      <option value="">Seleccione...</option>
                      <option value="JARDÍN -1°">JARDÍN -1°</option>
                      <option value="TRANSICIÓN 0°">TRANSICIÓN 0°</option>
                      <option value="PRIMERO 1°">PRIMERO 1°</option>
                      <option value="SEGUNDO 2°">SEGUNDO 2°</option>
                      <option value="TERCERO 3°">TERCERO 3°</option>
                      <option value="CUARTO 4°">CUARTO 4°</option>
                      <option value="QUINTO 5°">QUINTO 5°</option>
                      <option value="SEXTO 6°">SEXTO 6°</option>
                      <option value="SÉPTIMO 7°">SÉPTIMO 7°</option>
                      <option value="OCTAVO 8°">OCTAVO 8°</option>
                      <option value="NOVENO 9°">NOVENO 9°</option>
                      <option value="DÉCIMO 10°">DÉCIMO 10°</option>
                      <option value="UNDÉCIMO 11°">UNDÉCIMO 11°</option>
                      <option value="CICLO I">CICLO I</option>
                      <option value="CICLO II">CICLO II</option>
                      <option value="CICLO III">CICLO III</option>
                      <option value="CICLO IV">CICLO IV</option>
                      <option value="CICLO V">CICLO V</option>
                      <option value="CICLO VI">CICLO VI</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha Matrícula</label>
                    <input type="date" name="fechaMatricula" value={formState.fechaMatricula} onChange={e => setFormState(prev => ({...prev, fechaMatricula: e.target.value}))} className="w-full p-2 border rounded-xl text-xs text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jornada</label>
                    <select name="jornada" value={formState.jornada} onChange={e => setFormState(prev => ({...prev, jornada: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="ÚNICA">ÚNICA</option>
                      <option value="MAÑANA">MAÑANA</option>
                      <option value="TARDE">TARDE</option>
                      <option value="FIN DE SEMANA">FIN DE SEMANA</option>
                      <option value="NOCTURNA">NOCTURNA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sede</label>
                    <select name="sede" value={formState.sede} onChange={e => setFormState(prev => ({...prev, sede: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700 font-bold">
                      <option value="COL ALVERNIA">COL ALVERNIA</option>
                      <option value="SAN MARTIN">SAN MARTIN</option>
                      <option value="SAN NICOLAS">SAN NICOLAS</option>
                      <option value="SANTO DOMINGO SAVIO">SANTO DOMINGO SAVIO</option>
                    </select>
                  </div>

                  {/* Row 4 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sexo</label>
                    <select name="sexo" value={formState.sexo} onChange={e => setFormState(prev => ({...prev, sexo: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                      <option value="OTRO">OTRO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Municipio de Residencia</label>
                    <input type="text" name="municipioResidencia" value={formState.municipioResidencia} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dirección / Barrio / Vereda</label>
                    <input type="text" name="direccionResidencia" value={formState.direccionResidencia} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Teléfono Celular</label>
                    <input type="text" name="telefonoCelular" value={formState.telefonoCelular} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs text-slate-800" />
                  </div>

                  {/* Row 5 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">EPS Afiliación</label>
                    <input type="text" name="epsAfiliacion" value={formState.epsAfiliacion} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grupo Étnico</label>
                    <select name="grupoEtnico" value={formState.grupoEtnico} onChange={e => setFormState(prev => ({...prev, grupoEtnico: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="NINGUNO">NINGUNO</option>
                      <option value="AFROCOLOMBIANO">AFROCOLOMBIANO</option>
                      <option value="INDÍGENA">INDÍGENA</option>
                      <option value="RAIZAL">RAIZAL</option>
                      <option value="COLONO">COLONO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Con quién vive</label>
                    <select name="viveCon" value={formState.viveCon} onChange={e => setFormState(prev => ({...prev, viveCon: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="PADRES">PADRES</option>
                      <option value="MADRE">MADRE</option>
                      <option value="PADRE">PADRE</option>
                      <option value="HERMANOS">HERMANOS</option>
                      <option value="ABUELOS">ABUELOS</option>
                      <option value="TÍOS">TÍOS</option>
                      <option value="OTROS">OTROS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Es Repitente</label>
                    <select name="repitente" value={formState.repitente} onChange={e => setFormState(prev => ({...prev, repitente: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="NO">NO</option>
                      <option value="SÍ">SÍ</option>
                    </select>
                  </div>

                  {/* Row 6 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discapacidad</label>
                    <select name="discapacidad" value={formState.discapacidad} onChange={e => setFormState(prev => ({...prev, discapacidad: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="NO">NO</option>
                      <option value="SÍ">SÍ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estudió Año Anterior</label>
                    <select name="estudioAnterior" value={formState.estudioAnterior} onChange={e => setFormState(prev => ({...prev, estudioAnterior: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="SÍ">SÍ</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-550 uppercase block mb-1">Institución Año Anterior</label>
                    <input type="text" name="institucionAnterior" value={formState.institucionAnterior} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N° Hermanos/as en la Institución</label>
                    <select name="numHermanos" value={formState.numHermanos || '0'} onChange={e => setFormState(prev => ({...prev, numHermanos: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </div>

                  {/* Row 7 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grados</label>
                    <select name="grados" value={formState.grados || 'NO APLICA'} onChange={e => setFormState(prev => ({...prev, grados: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="NO APLICA">NO APLICA</option>
                      <option value="-1°">-1°</option>
                      <option value="0°">0°</option>
                      <option value="1°">1°</option>
                      <option value="2°">2°</option>
                      <option value="3°">3°</option>
                      <option value="4°">4°</option>
                      <option value="5°">5°</option>
                      <option value="6°">6°</option>
                      <option value="7°">7°</option>
                      <option value="8°">8°</option>
                      <option value="9°">9°</option>
                      <option value="10°">10°</option>
                      <option value="11°">11°</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Correo del Estudiante</label>
                    <input type="email" name="correoEstudiante" value={formState.correoEstudiante} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs text-slate-800" placeholder="Ej. alumno@iea.edu" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estrato</label>
                    <select name="estrato" value={formState.estrato} onChange={e => setFormState(prev => ({...prev, estrato: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700">
                      <option value="">Seleccione...</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Sangre</label>
                    <select name="tipoSangre" value={formState.tipoSangre} onChange={e => setFormState(prev => ({...prev, tipoSangre: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700 font-bold">
                      <option value="">Seleccione...</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Datos de Acudiente */}
              <div>
                <h4 className="border-b border-slate-200 pb-1.5 font-extrabold text-blue-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
                  Datos del Padre, Madre de Familia y/o Acudiente 1
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Apellidos</label>
                    <input type="text" name="acudienteApellidos" value={formState.acudienteApellidos} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombres</label>
                    <input type="text" name="acudienteNombres" value={formState.acudienteNombres} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nro Documento</label>
                    <input type="text" name="acudienteDocumento" value={formState.acudienteDocumento} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs font-mono font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Municipio</label>
                    <input type="text" name="acudienteMunicipio" value={formState.acudienteMunicipio} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dirección / Barrio / Vereda</label>
                    <input type="text" name="acudienteDireccion" value={formState.acudienteDireccion} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" placeholder="Ej. Barrio Centro..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Teléfono Celular</label>
                    <input type="text" name="acudienteTelefono" value={formState.acudienteTelefono} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Parentesco</label>
                    <select name="acudienteParentesco" value={formState.acudienteParentesco} onChange={e => setFormState(prev => ({...prev, acudienteParentesco: e.target.value}))} className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700 font-semibold">
                      <option value="">Seleccione...</option>
                      <option value="MADRE">MADRE</option>
                      <option value="PADRE">PADRE</option>
                      <option value="HERMANO(A)">HERMANO(A)</option>
                      <option value="TIO(A)">TÍO(A)</option>
                      <option value="ABUELO(A)">ABUELO(A)</option>
                      <option value="OTRO">OTRO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Profesión / Oficio</label>
                    <input type="text" name="acudienteProfesion" value={formState.acudienteProfesion} onChange={handleInputChange} className="w-full p-2 border rounded-xl text-xs uppercase text-slate-800" />
                  </div>
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
                  className="py-2 px-5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editId ? 'Actualizar Ficha Matrícula' : 'Confirmar Guardado en Base de Datos'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
