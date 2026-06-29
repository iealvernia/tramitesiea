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
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

interface StudentPama {
  id?: string;
  anio: string;
  tipo_documento: string;
  documento: string;
  nombre: string;
  grado: string;
  fecha_grado: string;
  jornada: string;
  acta: string;
  folio: string;
  libro: string;
  codigo_icfes?: string;
  codigo_dane?: string;
  sede?: string;
  intensidad_horaria?: string;
  caracter?: string;
  lugar_expedicion?: string;
  beneficiario_exencion?: string;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function CertificadosPamaPanel() {
  const [students, setStudents] = useState<StudentPama[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedAnio, setSelectedAnio] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formState, setFormState] = useState<StudentPama>({
    anio: '2025',
    tipo_documento: 'CC',
    documento: '',
    nombre: '',
    grado: 'UNDÉCIMO (11°)',
    fecha_grado: new Date().toISOString().substring(0, 10),
    jornada: 'MAÑANA',
    acta: '',
    folio: '',
    libro: '',
    codigo_icfes: '019315',
    codigo_dane: '18656800056701',
    sede: 'ALVERNIA',
    intensidad_horaria: '30 horas semanales Secundaria',
    caracter: 'Oficial',
    lugar_expedicion: 'Puerto Asís - Putumayo',
    beneficiario_exencion: 'NO'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificados-pama');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = (json.data || []).filter((s: any) => s.anio === selectedAnio).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      setStudents(data);
      setErrorErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching certificados_pama:', err);
      setErrorErrorMsg('No se pudieron cargar los datos de certificados PAMA. Compruebe la conexión o las tablas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAnio]);

  // Open modal
  const handleOpenAdd = () => {
    setEditId(null);
    setFormState({
      anio: selectedAnio,
      tipo_documento: 'TI',
      documento: '',
      nombre: '',
      grado: 'UNDÉCIMO (11°)',
      fecha_grado: new Date().toISOString().substring(0, 10),
      jornada: 'MAÑANA',
      acta: '',
      folio: '',
      libro: '',
      codigo_icfes: '019315',
      codigo_dane: '18656800056701',
      sede: 'ALVERNIA',
      intensidad_horaria: '30 horas semanales Secundaria',
      caracter: 'Oficial',
      lugar_expedicion: 'Puerto Asís - Putumayo',
      beneficiario_exencion: 'NO'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (student: StudentPama) => {
    setEditId(student.id || null);
    setFormState({ ...student });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante PAMA definitivamente?')) return;
    try {
      const res = await fetch(`/api/certificados-pama/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStudents(prev => prev.filter(s => s.id !== id));
      alert('Registro eliminado exitosamente.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleClearAllYear = async () => {
    if (!confirm(`¿Está totalmente seguro de borrar TODOS los certificados PAMA del año ${selectedAnio}? Esta acción es irreversible.`)) return;
    try {
      const res = await fetch('/api/certificados-pama');
      const json = await res.json();
      const allStudents = json.data || [];
      const toDelete = allStudents.filter((s: any) => s.anio === selectedAnio);
      for (const s of toDelete) {
        await fetch(`/api/certificados-pama/${s.id}`, { method: 'DELETE' });
      }
      alert('Base decertificados PAMA limpiada.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'nombre' ? value.toUpperCase() : value
    }));
  };

  // Submit / Save form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nombre.trim() || !formState.documento.trim() || !formState.acta.trim()) {
      alert('Por favor complete los campos obligatorios de nombre, documento y acta.');
      return;
    }

    const payload = {
      ...formState,
      nombre: formState.nombre.trim().toUpperCase(),
      documento: formState.documento.trim()
    };

    try {
      if (editId) {
        (payload as any).id = editId;
        const res = await fetch('/api/certificados-pama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Certificado PAMA actualizado correctamente.');
      } else {
        const res = await fetch('/api/certificados-pama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Estudiante PAMA guardado exitosamente.');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Error guardando en Base de Datos: ' + err.message);
    }
  };

  // Helper date formatting (05 de diciembre del 2024)
  const formatFechaNumerica = (fecha: string): string => {
    if (!fecha) return '';
    try {
      const parts = fecha.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]).toString().padStart(2, '0');
        return `${day} de ${MESES[monthIdx]} del ${year}`;
      }
      const date = new Date(fecha);
      const dia = date.getDate().toString().padStart(2, '0');
      return `${dia} de ${MESES[date.getMonth()]} del ${date.getFullYear()}`;
    } catch (e) {
      return fecha;
    }
  };

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

  const handlePrint = async (s: StudentPama) => {
    try {
      const doc = new jsPDF();

      // margins config
      const margin = 10;
      const innerMargin = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2) - (innerMargin * 2);

      // Marco decorativo verde oscuro
      doc.setDrawColor(0, 80, 0);
      doc.setLineWidth(0.1);
      doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

      const safeX = margin + innerMargin;
      const safeY = margin + innerMargin;

      // Retrieve custom logo locally to avoid blocking network downloads
      const customLogo = localStorage.getItem('iea_custom_logo') || '';
      if (customLogo) {
        try {
          doc.addImage(customLogo, "PNG", safeX + 5, safeY + 5, 25, 25);
        } catch (e) {
          console.error("Custom PAMA logo loading failed:", e);
        }
      } else {
        doc.setDrawColor(0, 80, 0);
        doc.setFillColor(245, 252, 245);
        doc.roundedRect(safeX + 5, safeY + 5, 25, 25, 4, 4, 'FD');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 80, 0);
        doc.text("IE", safeX + 17.5, safeY + 16, { align: "center" });
        doc.text("ALVERNIA", safeX + 17.5, safeY + 21, { align: "center" });
      }

      // QR Code generating dynamically
      try {
        const qrText = `Certificado_PAMA_${s.documento}_${s.anio}`;
        const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1 });
        doc.addImage(qrDataUrl, "PNG", pageWidth - margin - innerMargin - 25, safeY + 5, 20, 20);
      } catch (e) {
        console.error('QR code generation failed:', e);
      }

      // Headers layout
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 80, 0);
      doc.setFontSize(12);
      doc.text("REPÚBLICA DE COLOMBIA", pageWidth / 2, safeY + 10, { align: "center" });
      doc.text("INSTITUCIÓN EDUCATIVA ALVERNIA", pageWidth / 2, safeY + 17, { align: "center" });
      
      doc.setFontSize(8);
      doc.text("NIVELES PREESCOLAR, BÁSICA PRIMARIA, SECUNDARIA Y MEDIA ACADÉMICA", pageWidth / 2, safeY + 24, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("CERTIFICADO DE ESTUDIOS - PAMA", pageWidth / 2, safeY + 35, { align: "center" });

      // lines
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(safeX + 15, safeY + 40, pageWidth - safeX - 15, safeY + 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const resoluciones = [
        "APROBADO POR RESOLUCIONES No. 2149 DE MAYO 12/72 No. 4713 DE MAYO 15/86 No. 0033 DE JUNIO 9/89",
        "No. 0056 DE MAYO 26/92 No. 0275 DE JUNIO 1/98 RECONOCIMIENTO 0373 DE JULIO 2/99",
        "DECRETO No. 0588 DE DICIEMBRE 6/02 INTEGRACIÓN DE ESTABLECIMIENTOS EDUCATIVOS"
      ];
      
      resoluciones.forEach((texto, index) => {
        doc.text(texto, pageWidth / 2, safeY + 47 + (index * 3), { align: "center" });
      });

      // Título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("EL SUSCRITO RECTOR DE LA INSTITUCIÓN EDUCATIVA ALVERNIA", pageWidth / 2, safeY + 60, { align: "center" });
      
      doc.setFontSize(15);
      doc.text("C E R T I F I C A", pageWidth / 2, safeY + 70, { align: "center" });

      // Paragraph principal
      let y = safeY + 85;
      doc.setFontSize(12);
      
      const nombrePartes = s.nombre.split(' ');
      const textoCertificado = `Que el(la) estudiante, ${s.nombre}, identificado(a) con ${s.tipo_documento} número ${s.documento} expedida en ${s.lugar_expedicion || 'Puerto Asís'} cursó y aprobó el grado ${s.grado}. Fecha de grado ${formatFechaNumerica(s.fecha_grado)}.`;
      
      y = drawJustifiedText(doc, textoCertificado, safeX, y, contentWidth, 6, [...nombrePartes, s.grado, s.jornada]);

      // Tabla de matriculado PAMA layout
      y += 3;
      const tablaWidth = contentWidth * 0.85;
      const tablaHeight = 32;
      const tablaX = safeX + (contentWidth - tablaWidth) / 2;
      const cornerOffset = 2;

      // Table panel background
      doc.setFillColor(240, 240, 240);
      doc.rect(tablaX, y, tablaWidth, tablaHeight, 'F');

      // Borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      
      doc.line(tablaX + cornerOffset, y, tablaX + tablaWidth - cornerOffset, y);
      doc.line(tablaX + cornerOffset, y + tablaHeight, tablaX + tablaWidth - cornerOffset, y + tablaHeight);
      doc.line(tablaX, y + cornerOffset, tablaX, y + tablaHeight - cornerOffset);
      doc.line(tablaX + tablaWidth, y + cornerOffset, tablaX + tablaWidth, y + tablaHeight - cornerOffset);

      // diagonal corner connections
      doc.line(tablaX, y + cornerOffset, tablaX + cornerOffset, y);
      doc.line(tablaX + tablaWidth - cornerOffset, y, tablaX + tablaWidth, y + cornerOffset);
      doc.line(tablaX, y + tablaHeight - cornerOffset, tablaX + cornerOffset, y + tablaHeight);
      doc.line(tablaX + tablaWidth - cornerOffset, y + tablaHeight, tablaX + tablaWidth, y + tablaHeight - cornerOffset);

      // division line
      doc.setLineWidth(0.2);
      const col2X = tablaX + (tablaWidth / 2);
      doc.line(col2X, y + 1, col2X, y + tablaHeight - 1);

      // Horizontal lines
      const rowHeight = tablaHeight / 5;
      for (let i = 1; i < 5; i++) {
        const lineY = y + (rowHeight * i);
        doc.line(tablaX + 1, lineY, tablaX + tablaWidth - 1, lineY);
      }

      // Column text content with absolute alignment
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      
      const cellPadding = 3;
      
      // Left stats
      doc.text(`CODIGO DANE: ${s.codigo_dane || '18656800056701'}`, tablaX + cellPadding, y + cellPadding);
      doc.text(`CODIGO ICFES: ${s.codigo_icfes || '019315'}`, tablaX + cellPadding, y + cellPadding + rowHeight);
      doc.text(`ACTA: ${s.acta}`, tablaX + cellPadding, y + cellPadding + (rowHeight * 2));
      doc.text(`FOLIO: ${s.folio}`, tablaX + cellPadding, y + cellPadding + (rowHeight * 3));
      doc.text(`LIBRO: ${s.libro}`, tablaX + cellPadding, y + cellPadding + (rowHeight * 4));
      
      // Right stats
      doc.text(`SEDE: ${s.sede || 'ALVERNIA'}`, col2X + cellPadding, y + cellPadding);
      doc.text(`CARÁCTER: ${s.caracter || 'Oficial'}`, col2X + cellPadding, y + cellPadding + rowHeight);
      doc.text(`JORNADA: ${s.jornada}`, col2X + cellPadding, y + cellPadding + (rowHeight * 2));
      doc.text(`INTENSIDAD HORARIA:`, col2X + cellPadding, y + cellPadding + (rowHeight * 3));
      doc.text(`${s.intensidad_horaria || '30 horas'}`, col2X + cellPadding, y + cellPadding + (rowHeight * 3) + 2.5);
      doc.text(`CALENDARIO: A`, col2X + cellPadding, y + cellPadding + (rowHeight * 4));

      // Reset style text
      doc.setTextColor(0, 0, 0);
      y += tablaHeight + 9;

      // EXENCIÓN PENSIÓN TEXT
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("POR CONCEPTO DE MATRICULAS Y PENSIONES:", safeX, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      const textoPensionesNormal = "NO CANCELO de conformidad con la directiva No. 12 del 20 de junio de 2008 para los estudiantes de las instituciones y Centros Educativos cuyos hogares estén clasificados en el nivel de SISBEN I y II, Población en Desplazamiento e Indígena y Afrodescendiente, no habrá lugar al cobro de Derechos Académicos.";
      y = drawJustifiedText(doc, textoPensionesNormal, safeX, y, contentWidth, 6, []);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.text("VALOR DE PENSIÓN: $0", safeX, y);
      y += 6;

      doc.text("BENEFICIARIO(A) DE EXENCIÓN EN EL PAGO DE BECA O GRADO 11°", safeX, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      if (s.beneficiario_exencion === 'SÍ' || s.beneficiario_exencion === 'SI') {
        doc.text("SI  ✓   NO     ", safeX, y);
      } else {
        doc.text("SI       NO  ✓ ", safeX, y);
      }
      y += 12;

      // Final paragraph
      const hoy = new Date();
      const dia = hoy.getDate();
      const mes = MESES[hoy.getMonth()];
      const textoFinal = `Se expide a solicitud del interesado para trámites ante Universidades de Colombia; en ${s.lugar_expedicion || 'Puerto Asís'}, a los (${dia}) días del mes de ${mes} de dos mil veinticinco (2025).`;
      
      y = drawJustifiedText(doc, textoFinal, safeX, y, contentWidth, 6, []);

      // Retrieve dynamic rector parameters from configuration
      const rectorName = localStorage.getItem('iea_rector_name') || "ESP. DAVID JARAMILLO CORAL";
      const rectorCargo = localStorage.getItem('iea_rector_cargo') || "RECTOR";
      const customSignature = localStorage.getItem('iea_custom_signature') || '';

      // Signature area (draw locally to avoid blocking network load)
      y += 18;
      if (customSignature) {
        try {
          doc.addImage(customSignature, 'PNG', pageWidth / 2 - 20, y - 18, 40, 15);
        } catch (e) {
          console.error("Error rendering custom signature in CertificadosPamaPanel:", e);
        }
      }
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 35, y - 4, pageWidth / 2 + 35, y - 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(rectorName, pageWidth / 2, y, { align: "center" });
      doc.setFont("helvetica", "normal");
      y += 4.5;
      doc.text(rectorCargo, pageWidth / 2, y, { align: "center" });

      // Footer
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, pageHeight - margin - 18, pageWidth - (margin * 2), 18, 'F');
      
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, pageHeight - margin - 18, pageWidth - (margin * 2), 18);

      doc.setFontSize(8);
      doc.setTextColor(0, 80, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Brindamos una educación humanística y académica para la excelencia de un ser humano integral", pageWidth / 2, pageHeight - margin - 10, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.text("Dirección Cra 16 # 12-77 Barrio San Martin, Teléfono 4227048 - www.alvernia.edu.co - Puerto Asís Putumayo", pageWidth / 2, pageHeight - margin - 4, { align: "center" });

      doc.save(`Certificado_PAMA_${s.documento}_${s.nombre.replace(/\s+/g, '_')}.pdf`);
    } catch (e: any) {
      console.error('PAMA generation failed:', e);
      alert('Error generando certificado PAMA: ' + e.message);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.nombre.toLowerCase().includes(q) || 
      s.documento.includes(q) ||
      s.acta.includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Title banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-950 text-white p-6 rounded-2xl border border-sky-950 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="bg-sky-600/30 text-sky-200 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-sky-500/20 inline-block mb-1.5">
              Academusoft Trámites - Supabase
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-sky-400" />
              Certificados de Estudio (PAMA)
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl">
              Generación y resguardo de actas, folios y acreditación del Programa de Alimentación y Matrícula Académica (PAMA) para grados décimo y once de la I.E. Alvernia.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleOpenAdd}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Certificado PAMA
            </button>

            <button
              onClick={handleClearAllYear}
              className="bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 hover:text-white border border-indigo-900/30 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-indigo-400" />
              Limpiar Base PAMA ({selectedAnio})
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Seleccionar Año Lectivo</label>
          <select
            value={selectedAnio}
            onChange={e => setSelectedAnio(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-extrabold text-slate-800 bg-white"
          >
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Buscar alumno PAMA (Nombre, Documento, Acta)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar graduado PAMA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Students Pama Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-550 border-t-transparent rounded-full mb-3"></div>
            <p className="text-xs">Consultando base PAMA ({selectedAnio}) de la Base de Datos...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold text-xs">{errorMsg}</p>
            <button onClick={loadData} className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Reintentar</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-500" />
            <p className="font-bold text-xs">No hay certificados PAMA registrados en el año {selectedAnio}</p>
            <p className="text-[10px] mt-1 text-slate-500">Pruebe agregando un registro en este periodo escolar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700 font-medium">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Estudiante / Identificación</th>
                  <th className="p-4">Grado y Jornada</th>
                  <th className="p-4">Fecha de Grado</th>
                  <th className="p-4">Acta / Folio / Libro</th>
                  <th className="p-3 text-center">Ficha PAMA</th>
                  <th className="p-3 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70">
                {filteredStudents.map(student => {
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
                      <td className="p-4 font-semibold text-slate-600">
                        {student.fecha_grado}
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-[10px] font-bold text-slate-700">Acta: {student.acta}</p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Folio: {student.folio} | Libro: {student.libro}</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrint(student)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-sky-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Generar Acreditación
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="bg-slate-50 hover:bg-slate-150 border border-slate-205 text-slate-700 p-1.5 rounded-lg cursor-pointer"
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

      {/* PAMA ADD / EDIT MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            
            {/* Header */}
            <div className="bg-sky-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{editId ? 'Editar Certificado Académico PAMA' : 'Formulario Acreditación PAMA (Supabase)'}</h3>
                <p className="text-[10px] text-sky-200 uppercase font-semibold mt-1">Institución Educativa Alvernia</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-sky-150 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Seccion 1: Identificación y Datos Personales */}
              <div>
                <h4 className="border-b border-slate-200 pb-1.5 font-extrabold text-sky-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-600 rounded-full inline-block" />
                  1. Información de Identidad y Grado
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo Documento</label>
                    <select
                      name="tipo_documento"
                      value={formState.tipo_documento}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs bg-white text-slate-700"
                    >
                      <option value="TI">TARJETA DE IDENTIDAD</option>
                      <option value="CC">CÉDULA DE CIUDADANÍA</option>
                      <option value="RC">REGISTRO CIVIL</option>
                      <option value="CE">CÉDULA DE EXTRANJERÍA</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Número Documento *</label>
                    <input
                      type="text"
                      name="documento"
                      value={formState.documento}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre Completo de Estudiante *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formState.nombre}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs uppercase font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grado *</label>
                    <select
                      name="grado"
                      value={formState.grado}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs bg-white"
                    >
                      <option value="UNDÉCIMO (11°)">UNDÉCIMO (11°)</option>
                      <option value="DÉCIMO (10°)">DÉCIMO (10°)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha de Grado *</label>
                    <input
                      type="date"
                      name="fecha_grado"
                      value={formState.fecha_grado}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jornada</label>
                    <select
                      name="jornada"
                      value={formState.jornada}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs bg-white"
                    >
                      <option value="MAÑANA">MAÑANA</option>
                      <option value="ÚNICA">ÚNICA</option>
                      <option value="TARDE">TARDE</option>
                      <option value="NOCTURNA">NOCTURNA</option>
                      <option value="FIN DE SEMANA">FIN DE SEMANA</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Beneficiario Exención Pago</label>
                    <select
                      name="beneficiario_exencion"
                      value={formState.beneficiario_exencion}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs bg-white tracking-widest font-black text-sky-900"
                    >
                      <option value="NO">NO</option>
                      <option value="SI">SI (Acreditado)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seccion 2: Datos del Acta de Certificado PAMA */}
              <div>
                <h4 className="border-b border-slate-200 pb-1.5 font-extrabold text-sky-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-600 rounded-full inline-block" />
                  2. Datos Clínico-Académicos del Acta PAMA
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nro de Acta *</label>
                    <input type="text" name="acta" value={formState.acta} onChange={handleFormChange} required className="w-full p-2 border rounded-xl text-xs font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nro de Folio *</label>
                    <input type="text" name="folio" value={formState.folio} onChange={handleFormChange} required className="w-full p-2 border rounded-xl text-xs font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nro de Libro *</label>
                    <input type="text" name="libro" value={formState.libro} onChange={handleFormChange} required className="w-full p-2 border rounded-xl text-xs font-mono font-bold" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código ICFES</label>
                    <input type="text" name="codigo_icfes" value={formState.codigo_icfes} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código DANE</label>
                    <input type="text" name="codigo_dane" value={formState.codigo_dane} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Intensidad Horaria Decalarada</label>
                    <input type="text" name="intensidad_horaria" value={formState.intensidad_horaria} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sede Escolar</label>
                    <input type="text" name="sede" value={formState.sede} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs uppercase font-extrabold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Carácter de la Institución</label>
                    <input type="text" name="caracter" value={formState.caracter} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lugar de Expedición Acreditada</label>
                    <input type="text" name="lugar_expedicion" value={formState.lugar_expedicion} onChange={handleFormChange} className="w-full p-2 border rounded-xl text-xs uppercase" />
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
                  className="py-2 px-5 bg-sky-900 hover:bg-sky-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editId ? 'Guardar Cambios PAMA' : 'Confirmar Registro PAMA'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
