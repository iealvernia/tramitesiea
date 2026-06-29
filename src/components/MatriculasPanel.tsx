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
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert('La librería de descargas PDF está cargando. Intente de nuevo en un segundo.');
      return;
    }

    // Show a loading toast immediately to improve perceived performance
    if (showToast) showToast('Generando Ficha en PDF. Por favor espere un momento...');

    const val = (v: any) => (v || "").toString().toUpperCase();
    
    // Retrieve centralized institutional values (from GlobalConfigPanel)
    const customLogoBase64 = localStorage.getItem('iea_custom_logo') || '';

    // Inline ficha matricula style layout strictly replicating the requested grid sections and colors
    const template = `
      <html>
      <head>
      <meta charset="utf-8">
      <style>
        body { 
          margin:0; 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size:10px; 
          background:#fff;
          color: #111111;
          line-height: 1.25;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .sheet { 
          width:100%; 
          margin:0 auto; 
          padding:0px;
          box-sizing: border-box;
        }
        .card { 
          border:none; 
          border-radius:0; 
          padding: 0mm 1mm; 
          box-sizing:border-box;
          background: #fff;
          box-shadow: none;
        }

        .encabezado { 
          display: grid; 
          grid-template-columns: 80px 1fr 80px; 
          align-items: center; 
          margin-bottom: 6px;
        }
         .logo { 
          height: 68px; 
          width: 68px;
          object-fit: contain;
        }
         .logo-placeholder {
          width: 65px;
          height: 65px;
          border: 1.5px solid #5d8aa8;
          border-radius: 50%;
          background: #fafcfd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          color: #5d8aa8;
        }
         .titulo { 
          text-align: center; 
          font-weight: 700;
        }
         .titulo .inst { 
          font-size: 16px; 
          color: #1e3a8a; 
          margin-bottom: 2px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }
         .titulo .ficha { 
          font-size: 13px; 
          margin-top: 4px;
          background: #5d8aa8; 
          color: white;
          padding: 4px 22px;
          border-radius: 12px;
          display: inline-block;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
         .titulo div {
          font-size: 9px;
          color: #334155; 
          line-height: 1.25;
          font-weight: 700;
        }
         .foto { 
          height: 80px; 
          width: 72px;
          border: 1.2px solid #5d8aa8; 
          border-radius: 6px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 11px;
          background: #fdfdfd; 
          font-weight: bold;
          color: #5d8aa8;
          margin-left: auto;
        }
 
         /* Group containers and elements */
         .box { 
          border: 1.5px solid #5d8aa8; 
          border-radius: 6px; 
          overflow: hidden; 
          margin-bottom: 7px; 
          background: #fff;
        }
         .title { 
          background: #5d8aa8; 
          color: white; 
          font-weight: bold; 
          font-size: 11px; 
          padding: 4.5px; 
          text-align: center; 
          text-transform: uppercase; 
          letter-spacing: 0.4px;
        }
         .row { 
          display: flex; 
          gap: 6px; 
          padding: 5.5px 8px; 
          background: #fff;
        }
         
         /* Individual modular input fields */
         .fld { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: flex-start; 
          text-align: center;
          min-width: 0;
        }
         .lbl { 
          font-size: 8.5px; 
          font-weight: bold; 
          color: #334155; 
          margin-bottom: 2px; 
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.1;
        }
         .val { 
          background: #f4f9fc; 
          border: 1px solid #5d8aa8; 
          border-radius: 4px; 
          padding: 4px 4px; 
          font-size: 11.5px; 
          font-weight: normal; 
          color: #000000; 
          text-align: center; 
          width: 100%; 
          box-sizing: border-box; 
          min-height: 25px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          text-transform: uppercase;
        }
 
         /* Checkbox rows */
         .row-cb { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 6px; 
          padding: 5px 8px; 
          background: #fff;
        }
         .cb { 
          display: flex; 
          align-items: center; 
          font-size: 10.5px; 
          font-weight: bold; 
          color: #1e293b;
        }
         .sq { 
          width: 13px; 
          height: 13px; 
          border: 1.2px solid #5d8aa8; 
          border-radius: 2px; 
          margin-right: 6px; 
          background: #fff; 
          flex-shrink: 0;
        }
 
         /* Double side panels */
         .double-col { 
          display: flex; 
          gap: 12px; 
          margin-bottom: 7px; 
          background: #fff;
        }
         .pane { 
          border: 1.5px solid #5d8aa8; 
          border-radius: 6px; 
          padding: 7px; 
          background: #fff; 
          flex: 1;
        }
         .pane-t { 
          font-size: 11px; 
          font-weight: bold; 
          color: #5d8aa8; 
          text-align: center; 
          padding-bottom: 4px; 
          border-bottom: 1.2px solid #5d8aa8; 
          text-transform: uppercase; 
          margin-bottom: 7px;
          letter-spacing: 0.3px;
        }
         .p-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 5.5px; 
          font-size: 10px;
        }
         .p-opt { 
          color: #334155; 
          font-weight: bold;
        }
         .p-btn { 
          display: flex; 
          gap: 5px;
        }
         .p-box { 
          width: 28px; 
          height: 17px; 
          border: 1.2px solid #5d8aa8; 
          border-radius: 3.5px; 
          font-size: 9.5px; 
          font-weight: bold; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #5d8aa8; 
          background: #fff;
        }
      </style>
      </head>
      <body>
      <div class="sheet">
      <div class="card">

        <!-- Encabezado -->
        <div class="encabezado">
          <div>
            ${customLogoBase64 ? `
              <img src="${customLogoBase64}" class="logo" alt="Logo" />
            ` : `
              <div class="logo-placeholder">ALV</div>
            `}
          </div>
          <div class="titulo">
            <div class="inst">INSTITUCIÓN EDUCATIVA ALVERNIA</div>
            <div>NIVEL PREESCOLAR - BÁSICA PRIMARIA Y MEDIA ACADÉMICA</div>
            <div>CALENDARIO A - CÓDIGO DANE 186568000567 NIT. 891201897-5</div>
            <div>Dirección: Calle 16 Nro. 12-77 • B/ San Martín • Tel. 4227048</div>
            <div><span class="ficha">FICHA DE MATRÍCULA</span></div>
          </div>
          <div class="foto">FOTO</div>
        </div>

        <!-- Matrícula -->
        <div class="box">
          <div class="title">DATOS DE MATRÍCULA</div>
          <div class="row">
            <div class="fld"><div class="lbl">SEDE</div><div class="val">${val(s.sede)}</div></div>
            <div class="fld"><div class="lbl">NIVEL EDUCATIVO</div><div class="val">${val(s.nivelEducativo)}</div></div>
            <div class="fld"><div class="lbl">GRADO</div><div class="val">${val(s.grado)}</div></div>
            <div class="fld"><div class="lbl">JORNADA</div><div class="val">${val(s.jornada)}</div></div>
            <div class="fld"><div class="lbl">FECHA MATRÍCULA</div><div class="val">${val(s.fechaMatricula)}</div></div>
          </div>
        </div>

        <!-- Estudiante -->
        <div class="box">
          <div class="title">DATOS DEL ESTUDIANTE</div>
          <div class="row" style="padding-bottom:3px;">
            <div class="fld"><div class="lbl">PRIMER APELLIDO</div><div class="val">${val(s.primerApellido)}</div></div>
            <div class="fld"><div class="lbl">SEGUNDO APELLIDO</div><div class="val">${val(s.segundoApellido) || '-'}</div></div>
            <div class="fld"><div class="lbl">PRIMER NOMBRE</div><div class="val">${val(s.primerNombre)}</div></div>
            <div class="fld"><div class="lbl">SEGUNDO NOMBRE</div><div class="val">${val(s.segundoNombre) || '-'}</div></div>
            <div class="fld"><div class="lbl">TIPO DOC.</div><div class="val">${val(s.tipoDocumento)}</div></div>
          </div>
          
          <div class="row" style="padding-top:3px; padding-bottom:3px;">
            <div class="fld"><div class="lbl">NRO DOC.</div><div class="val">${val(s.numeroDocumento)}</div></div>
            <div class="fld"><div class="lbl">FECHA NAC.</div><div class="val">${val(s.fechaNacimiento)}</div></div>
            <div class="fld"><div class="lbl">SEXO</div><div class="val">${val(s.sexo)}</div></div>
            <div class="fld"><div class="lbl">ESTRATO</div><div class="val">${val(s.estrato) || '-'}</div></div>
            <div class="fld"><div class="lbl">TIPO DE SANGRE</div><div class="val">${val(s.tipoSangre) || '-'}</div></div>
          </div>

          <div class="row" style="padding-top:3px; padding-bottom:3px;">
            <div class="fld"><div class="lbl">MUNICIPIO</div><div class="val">${val(s.municipioResidencia)}</div></div>
            <div class="fld"><div class="lbl">DIRECCIÓN</div><div class="val">${val(s.direccionResidencia) || '-'}</div></div>
            <div class="fld"><div class="lbl">TELÉFONO</div><div class="val">${val(s.telefonoCelular) || '-'}</div></div>
            <div class="fld"><div class="lbl">EPS</div><div class="val">${val(s.epsAfiliacion) || '-'}</div></div>
            <div class="fld"><div class="lbl">GRUPO ÉTNICO</div><div class="val">${val(s.grupoEtnico) || 'NINGUNO'}</div></div>
          </div>

          <div class="row" style="padding-top:3px; padding-bottom:3px;">
            <div class="fld"><div class="lbl">CON QUIÉN VIVE</div><div class="val">${val(s.viveCon) || 'PADRES'}</div></div>
            <div class="fld"><div class="lbl">REPITENTE</div><div class="val">${val(s.repitente) || 'NO'}</div></div>
            <div class="fld"><div class="lbl">DISCAPACIDAD</div><div class="val">${val(s.discapacidad) || 'NO'}</div></div>
            <div class="fld"><div class="lbl">ESTUDIÓ AÑO ANT.</div><div class="val">${val(s.estudioAnterior) || 'SÍ'}</div></div>
            <div class="fld"><div class="lbl">N° HERMANOS/AS</div><div class="val">${val(s.numHermanos) || '0'}</div></div>
          </div>

          <div class="row" style="padding-top:3px;">
            <div class="fld" style="flex:2;"><div class="lbl">INSTITUCIÓN ANTERIOR</div><div class="val" style="font-size:10px;">${val(s.institucionAnterior) || '-'}</div></div>
            <div class="fld" style="flex:1;"><div class="lbl">GRADOS</div><div class="val">${val(s.grados) || 'NO APLICA'}</div></div>
            <div class="fld" style="flex:2;"><div class="lbl">CORREO ESTUDIANTE</div><div class="val" style="font-size:10.5px; text-transform:lowercase;">${(s.correoEstudiante || '-').toLowerCase()}</div></div>
          </div>
        </div>

        <!-- Acudiente -->
        <div class="box">
          <div class="title">DATOS DEL ACUDIENTE</div>
          <div class="row" style="padding-bottom:3px;">
            <div class="fld"><div class="lbl">APELLIDOS</div><div class="val">${val(s.acudienteApellidos)}</div></div>
            <div class="fld"><div class="lbl">NOMBRES</div><div class="val">${val(s.acudienteNombres)}</div></div>
            <div class="fld"><div class="lbl">NRO DOCUMENTO</div><div class="val">${val(s.acudienteDocumento)}</div></div>
            <div class="fld"><div class="lbl">TELÉFONO</div><div class="val">${val(s.acudienteTelefono)}</div></div>
            <div class="fld"><div class="lbl">MUNICIPIO</div><div class="val">${val(s.acudienteMunicipio) || 'PUERTO ASÍS'}</div></div>
          </div>
          
          <div class="row" style="padding-top:3px;">
            <div class="fld" style="flex:2;"><div class="lbl">DIRECCIÓN</div><div class="val">${val(s.acudienteDireccion) || '-'}</div></div>
            <div class="fld" style="flex:1;"><div class="lbl">PARENTESCO</div><div class="val">${val(s.acudienteParentesco) || '-'}</div></div>
            <div class="fld" style="flex:2;"><div class="lbl">PROFESIÓN</div><div class="val">${val(s.acudienteProfesion) || '-'}</div></div>
          </div>
        </div>

        <!-- Renovación -->
        <div class="box">
          <div class="title">RENOVACIÓN DE MATRÍCULA (Marque con una X)</div>
          <table style="width: 100%; border-collapse: collapse; text-align: center; background: #fff;">
            <tr style="border-bottom: 1.2px solid #5d8aa8;">
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2026</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2027</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2028</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2029</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2030</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2031</td>
              <td style="padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155; width: 14.28%;">2032</td>
            </tr>
            <tr style="height: 20px;">
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2033</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2034</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2035</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2036</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2037</td>
              <td style="border-right: 1.2px solid #5d8aa8; padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2038</td>
              <td style="padding: 4px; font-size: 9.5px; font-weight: bold; color: #334155;">2039</td>
            </tr>
          </table>
        </div>

        <!-- Retiro -->
        <div class="box">
          <div class="title">SOLICITUD DE RETIRO Y CAUSAS</div>
          <div class="row">
            <div class="fld" style="flex:1;"><div class="lbl">FECHA RETIRO</div><div class="val" style="min-height:22px; background:#fff;"></div></div>
            <div class="fld" style="flex:2;"><div class="lbl">NOMBRE QUIEN SOLICITA</div><div class="val" style="min-height:22px; background:#fff;"></div></div>
            <div class="fld" style="flex:2;"><div class="lbl">FIRMA QUIEN SOLICITA</div><div class="val" style="min-height:22px; background:#fff;"></div></div>
          </div>
          
          <div style="background: #89b4c4; color: white; font-weight: bold; font-size: 9.5px; padding: 4.5px; text-align: center; text-transform: uppercase; border-top: 1.2px solid #5d8aa8; letter-spacing: 0.3px;">MARQUE CON UNA X EL MOTIVO</div>
          <div class="row-cb">
            <div class="cb"><div class="sq"></div> CAMBIO DOMICILIO</div>
            <div class="cb"><div class="sq"></div> SITUACIÓN ECONÓMICA</div>
            <div class="cb"><div class="sq"></div> SANCIÓN INSTITUCIONAL</div>
            <div class="cb"><div class="sq"></div> TRASLADO</div>
            <div class="cb"><div class="sq"></div> BAJO RENDIMIENTO</div>
            <div class="cb"><div class="sq"></div> SALUD</div>
            <div class="cb"><div class="sq"></div> OTRO</div>
            <div></div>
          </div>
        </div>

        <!-- Matrícula condicional + documentos habilitantes -->
        <div class="double-col">
          
          <!-- Tipo de matrícula -->
          <div class="pane">
            <div class="pane-t">TIPO DE MATRÍCULA</div>
            <div class="p-row"><div class="p-opt">Matrícula Condicional</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Antecedentes conductuales</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Inasistencia reiterada</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Atención especializada</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Colaborar con actividades</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row" style="margin-bottom:0;"><div class="p-opt">No Aplica</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
          </div>

          <!-- Documentos habilitantes -->
          <div class="pane">
            <div class="pane-t">DOCUMENTOS HABILITANTES QUE PRESENTA</div>
            <div class="p-row"><div class="p-opt">Copia Registro Civil</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Tarjeta Identidad / Cédula Estudiante</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Cédula Acudiente</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Certificado / Carnet Salud</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row"><div class="p-opt">Recibo Energía</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
            <div class="p-row" style="margin-bottom:0;"><div class="p-opt">2 Fotos Carnet</div><div class="p-btn"><div class="p-box">SI</div><div class="p-box">NO</div></div></div>
          </div>

        </div>

        <!-- Firmas con líneas superiores independientes -->
        <div style="margin-top: 60px; display: flex; justify-content: space-around; padding: 0 40px; margin-bottom: 5px;">
          <div style="width: 38%; border-top: 1.5px solid #5d8aa8; text-align: center; padding-top: 6px; font-size: 11px; font-weight: bold; color: #5d8aa8; position: relative;">
            Firma Estudiante
          </div>
          <div style="width: 38%; border-top: 1.5px solid #5d8aa8; text-align: center; padding-top: 6px; font-size: 11px; font-weight: bold; color: #5d8aa8; position: relative;">
            Firma Acudiente
          </div>
        </div>

      </div>
      </div>
      </body>
      </html>
    `;

    const opt = {
      margin: [2.5, 7, 2.5, 7],
      filename: `Ficha_Matricula_${s.numeroDocumento || 'Ficha'}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1.5, 
        useCORS: false, 
        scrollY: 0, 
        logging: false,
        // Removed imageTimeout to prevent artificial delays with base64 images
      },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    try {
      // html2canvas needs the element to be in the DOM to compute dimensions properly.
      // `from(template)` handles this internally by creating a hidden iframe.
      await html2pdf().set(opt).from(template).save();
    } catch (err) {
      console.error("Error generating ficha PDF:", err);
      if (showToast) showToast('Error al generar el PDF.');
    }
  };

  // Filter students array based on filters & queries
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
