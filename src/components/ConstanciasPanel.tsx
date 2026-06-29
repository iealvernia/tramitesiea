import React, { useState, useEffect, useMemo } from 'react';

import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  X, 
  Save, 
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface StudentConstancia {
  id?: string;
  anio: string;
  tipo_documento: string;
  documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  sede: string;
  jornada: string;
  grado_cod: string;
  grado_texto: string;
  fecha_inicio?: string;
  created_at?: string;
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const GRADOS_OPCIONES: Record<string, string> = {
  "-1": "Jardín -1°",
  "0": "Transición 0°",
  "1": "Primero 1°",
  "2": "Segundo 2°",
  "3": "Tercero 3°",
  "4": "Cuarto 4°",
  "5": "Quinto 5°",
  "6": "Sexto 6°",
  "7": "Séptimo 7°",
  "8": "Octavo 8°",
  "9": "Noveno 9°",
  "10": "Décimo 10°",
  "11": "Undécimo 11°",
  "22": "Ciclo II",
  "23": "Ciclo III",
  "24": "Ciclo IV",
  "25": "Ciclo V",
  "26": "Ciclo VI"
};

export default function ConstanciasPanel() {
  const [students, setStudents] = useState<StudentConstancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedAnio, setSelectedAnio] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formState, setFormState] = useState<StudentConstancia>({
    anio: '2025',
    tipo_documento: 'RC',
    documento: '',
    nombre_completo: '',
    fecha_nacimiento: '',
    sede: 'COL ALVERNIA',
    jornada: 'ÚNICA',
    grado_cod: '1',
    grado_texto: 'PRIMERO',
    fecha_inicio: new Date().toISOString().substring(0, 10)
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/constancias');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = (json.data || []).filter((s: any) => s.anio === selectedAnio).sort((a: any, b: any) => a.nombre_completo.localeCompare(b.nombre_completo));
      setStudents(data);
      setErrorErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching constancias:', err);
      setErrorErrorMsg('No se pudieron cargar las constancias de matrimonio. Compruebe la conexión o las tablas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAnio]);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormState({
      anio: selectedAnio,
      tipo_documento: 'RC',
      documento: '',
      nombre_completo: '',
      fecha_nacimiento: '',
      sede: 'COL ALVERNIA',
      jornada: 'ÚNICA',
      grado_cod: '1',
      grado_texto: 'PRIMERO',
      fecha_inicio: new Date().toISOString().substring(0, 10)
    });
    setShowModal(true);
  };

  const handleOpenEdit = (student: StudentConstancia) => {
    setEditId(student.id || null);
    setFormState({ ...student });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante de constancias definitivamente?')) return;
    try {
      const res = await fetch(`/api/constancias/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStudents(prev => prev.filter(s => s.id !== id));
      alert('Registro de constancia eliminado.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleClearAllYear = async () => {
    if (!confirm(`¿Está totalmente seguro de borrar TODAS las constancias del año ${selectedAnio}? Esta acción es irreversible.`)) return;
    try {
      const res = await fetch('/api/constancias');
      const json = await res.json();
      const allStudents = json.data || [];
      const toDelete = allStudents.filter((s: any) => s.anio === selectedAnio);
      for (const s of toDelete) {
        await fetch(`/api/constancias/${s.id}`, { method: 'DELETE' });
      }
      alert(`Base de constancias del año ${selectedAnio} limpiada.`);
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => {
      const updated = { ...prev, [name]: name === 'nombre_completo' ? value.toUpperCase() : value };
      
      // If code of grade changed, auto-update label text
      if (name === 'grado_cod') {
        const textLabel = GRADOS_OPCIONES[value] || value;
        updated.grado_texto = textLabel.toUpperCase();
      }
      return updated;
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nombre_completo.trim() || !formState.documento.trim()) {
      alert('Por favor complete los campos obligatorios de nombre completo y documento.');
      return;
    }

    const payload = {
      ...formState,
      nombre_completo: formState.nombre_completo.trim().toUpperCase(),
      documento: formState.documento.trim(),
      sede: formState.sede.trim().toUpperCase()
    };

    try {
      if (editId) {
        (payload as any).id = editId;
        const res = await fetch('/api/constancias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Constancia actualizada correctamente.');
      } else {
        const res = await fetch('/api/constancias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        alert('Estudiante vinculado exitosamente.');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Error guardando en Base de Datos: ' + err.message);
    }
  };

  // Helper date formatter (05/12/2025)
  const formatFechaSlash = (fecha: string | undefined): string => {
    if (!fecha) return '';
    try {
      const parts = fecha.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return fecha;
    } catch (e) {
      return fecha;
    }
  };

  // Word-by-word bold highlighting justified text drawer
  const drawJustifiedTextWithBold = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    // Split bold parts
    const parts: { text: string; bold: boolean }[] = [];
    let currentText = text;
    
    while (currentText.includes('**')) {
      const startIndex = currentText.indexOf('**');
      const endIndex = currentText.indexOf('**', startIndex + 2);
      
      if (endIndex === -1) break;
      
      if (startIndex > 0) {
        parts.push({
          text: currentText.substring(0, startIndex),
          bold: false
        });
      }
      
      parts.push({
        text: currentText.substring(startIndex + 2, endIndex),
        bold: true
      });
      
      currentText = currentText.substring(endIndex + 2);
    }
    
    if (currentText.length > 0) {
      parts.push({
        text: currentText,
        bold: false
      });
    }
    
    // Create text lines
    const lines: any[][] = [];
    let currentLine: any[] = [];
    let currentLineWidth = 0;
    
    for (const part of parts) {
      const words = part.text.split(' ');
      
      for (const word of words) {
        if (!word && word !== '0') continue;
        const wordWidth = doc.getTextWidth(word + ' ');
        
        if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [{ text: word, bold: part.bold }];
          currentLineWidth = wordWidth;
        } else {
          currentLine.push({ text: word, bold: part.bold });
          currentLineWidth += wordWidth;
        }
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    let currentY = y;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isLastLine = (i === lines.length - 1);
      
      if (isLastLine || line.length <= 1) {
        // Last line or single word line - no justification
        let currentX = x;
        for (const part of line) {
          doc.setFont("helvetica", part.bold ? "bold" : "normal");
          doc.text(part.text + (part !== line[line.length - 1] ? ' ' : ''), currentX, currentY);
          currentX += doc.getTextWidth(part.text + ' ');
        }
      } else {
        // Justify
        let totalTextWidth = 0;
        for (const part of line) {
          totalTextWidth += doc.getTextWidth(part.text);
        }
        
        const totalSpaceWidth = maxWidth - totalTextWidth;
        const spaceBetweenWords = totalSpaceWidth / (line.length - 1);
        
        let currentX = x;
        for (let j = 0; j < line.length; j++) {
          const part = line[j];
          doc.setFont("helvetica", part.bold ? "bold" : "normal");
          doc.text(part.text, currentX, currentY);
          
          if (j < line.length - 1) {
            currentX += doc.getTextWidth(part.text) + spaceBetweenWords;
          }
        }
      }
      
      currentY += lineHeight;
    }
    
    return currentY;
  };

  const handlePrint = async (s: StudentConstancia) => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 15;
      const contentWidth = pageWidth - (marginLeft + marginRight);

      // Retrieve custom logo locally to avoid blocking network downloads
      const customLogo = localStorage.getItem('iea_custom_logo') || '';
      if (customLogo) {
        try {
          doc.addImage(customLogo, "PNG", marginLeft, marginTop, 20, 20);
        } catch (imgError) {
          console.error("Custom logo rendering error:", imgError);
        }
      } else {
        doc.setDrawColor(0, 80, 0);
        doc.setFillColor(245, 252, 245);
        doc.roundedRect(marginLeft, marginTop, 20, 20, 3, 3, 'FD');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("IEA", marginLeft + 10, marginTop + 11, { align: "center" });
      }

      // Headers Centered
      let yPos = marginTop + 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("INSTITUCIÓN EDUCATIVA ALVERNIA", pageWidth / 2, yPos, { align: 'center' });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      yPos += 6;
      doc.text("NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA", pageWidth / 2, yPos, { align: 'center' });
      
      doc.setFontSize(9);
      yPos += 5;
      doc.text("CALENDARIO A – CÓDIGO DANE 186568000567 NIT. 891201897-5", pageWidth / 2, yPos, { align: 'center' });

      // lines
      yPos += 7;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
      yPos += 5;

      // Constancia Title
      yPos += 7;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CONSTANCIA DE MATRÍCULA", pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;

      // Resolutions info
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const resoluciones = [
        "INSTITUCIÓN APROBADA POR RESOLUCIONES Nº 2149 DE MAYO 12/72 Nº 4713 DE MAYO 15/86",
        "Nº 0033 DE JUNIO 9/89 Nº 0056 DE MAYO 26/92 Nº 0275 DE JUNIO 1/98 RECONOCIMIENTO",
        "0373 DE JULIO 2/99. DECRETO Nº 0588 DE DICIEMBRE 6/02 INTEGRACIÓN DE ESTABLECIMIENTOS EDUCATIVOS"
      ];
      
      resoluciones.forEach(linea => {
        doc.text(linea, pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
      });

      // Constancia principal body
      const rectorCargo = localStorage.getItem('iea_rector_cargo') || "RECTOR";
      const uppercaseCargo = rectorCargo.toUpperCase();
      const sujetoCargoText = uppercaseCargo === "RECTORA" ? "LA SUSCRITA RECTORA" : "EL SUSCRITO RECTOR";

      yPos += 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${sujetoCargoText} DE LA INSTITUCIÓN EDUCATIVA ALVERNIA`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 12;
      doc.setFontSize(12);
      doc.text("HACE CONSTAR", pageWidth / 2, yPos, { align: 'center' });

      const fechaInicioFormateada = formatFechaSlash(s.fecha_inicio);
      const añoEscolar = s.anio || "2025";
      
      const nombreCompleto = s.nombre_completo.toUpperCase();
      const tipoDoc = s.tipo_documento || "TI";
      const numDoc = s.documento || "";
      const grado = s.grado_texto.toUpperCase();
      const jornada = s.jornada.toUpperCase();
      const sede = s.sede.toUpperCase();

      yPos += 15;
      const textoConMarcadores = `Que el(la) estudiante **${nombreCompleto}** identificado(a) con ${tipoDoc} Nro. ${numDoc} se encuentra legalmente matriculado(a) y cursando el grado ${grado} jornada ${jornada} sede ${sede} desde el ${fechaInicioFormateada} correspondiente al año escolar ${añoEscolar}.`;
      
      yPos = drawJustifiedTextWithBold(doc, textoConMarcadores, marginLeft, yPos, contentWidth, 6);

      // Signature and Date (no italics)
      yPos += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const hoy = new Date();
      const dia = hoy.getDate();
      const mes = MESES[hoy.getMonth()];
      const año = hoy.getFullYear();
      
      const textoFirma = `Para Constancia se firma en Puerto Asís a los ${dia} de ${mes} del año ${año}.`;
      doc.text(textoFirma, marginLeft, yPos, { align: 'left' });

      // Rector details from dynamic configuration
      const rectorName = localStorage.getItem('iea_rector_name') || "ESP. CARLOS ARCESIO ACOSTA CORONEL";
      const rectorDoc = localStorage.getItem('iea_rector_doc') || "C.C. No. 87.246.722 de La Cruz";
      const customSignature = localStorage.getItem('iea_custom_signature') || '';

      yPos += 50; // Add space for manual signature locally (fully synchronous render)

      if (customSignature) {
        try {
          doc.addImage(customSignature, 'PNG', pageWidth / 2 - 20, yPos - 38, 40, 22);
        } catch (e) {
          console.error("Error rendering custom signature in ConstanciasPanel:", e);
        }
      }

      // Rector details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(rectorName, pageWidth / 2, yPos, { align: 'center' });
      
      if (rectorDoc) {
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(rectorDoc, pageWidth / 2, yPos, { align: 'center' });
      }
      
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(rectorCargo.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });

      // Footer
      const footerY = pageHeight - 20;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Brindamos una educación humanística y académica para la excelencia de un ser humano integral", 
              pageWidth / 2, footerY, { align: 'center' });

      doc.save(`Constancia_${s.documento || s.id}_${añoEscolar}.pdf`);
    } catch (e: any) {
      console.error('Constancia generation failed:', e);
      alert('Error generando constancia PDF: ' + e.message);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.nombre_completo.toLowerCase().includes(q) || 
      s.documento.includes(q) ||
      (s.grado_texto && s.grado_texto.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Title banner */}
      <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-6 rounded-2xl border border-teal-950 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="bg-teal-600/30 text-teal-200 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-teal-500/20 inline-block mb-1.5">
              Academusoft Trámites - Supabase
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-400" />
              Constancias de Matrícula Vigentes
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl">
              Generación de certificaciones de estudio rápidas, constancias de vinculación legal e inclusión de estudiantes en periodos vigentes de la I.E. Alvernia.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleOpenAdd}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Constancia Manual
            </button>

            <button
              onClick={handleClearAllYear}
              className="bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 hover:text-white border border-indigo-900/30 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-indigo-400" />
              Limpiar Constancias ({selectedAnio})
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
            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 font-extrabold text-slate-800 bg-white"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 block">Buscar Constancia (Nombre Completo o Identificación)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar estudiante matriculado..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-teal-550 border-t-transparent rounded-full mb-3"></div>
            <p className="text-xs">Consultando base de constancias ({selectedAnio}) de la Base de Datos...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold text-xs">{errorMsg}</p>
            <button onClick={loadData} className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Reintentar</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-500" />
            <p className="font-bold text-xs">No hay constancias registradas en el año {selectedAnio}</p>
            <p className="text-[10px] mt-1 text-slate-500">Pruebe agregando un registro en este periodo escolar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700 font-medium">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Estudiante / Identificación</th>
                  <th className="p-4">Grado y Sede</th>
                  <th className="p-4">Jornada escolar</th>
                  <th className="p-4">Inicio Matriculación</th>
                  <th className="p-3 text-center">Ficha Constancia</th>
                  <th className="p-3 text-center">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70">
                {filteredStudents.map(student => {
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 text-[11px] leading-tight">{student.nombre_completo}</p>
                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                          {student.tipo_documento || 'CC'}-{student.documento}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-800">{student.grado_texto}</p>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide">{student.sede || 'COL ALVERNIA'}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {student.jornada || 'ÚNICA'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {student.fecha_inicio || 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrint(student)}
                          className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-teal-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Generar Constancia
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

      {/* CONSTANCIAS ADD / EDIT MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            
            {/* Header */}
            <div className="bg-teal-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{editId ? 'Editar Vinculación de Constancia' : 'Formulario Registro Constancias de Matrícula (Supabase)'}</h3>
                <p className="text-[10px] text-teal-200 uppercase font-semibold mt-1">Institución Educativa Alvernia</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-teal-150 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Seccion 1: Identificación y Datos Personales */}
              <div>
                <h4 className="border-b border-slate-200 pb-1.5 font-extrabold text-teal-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-teal-600 rounded-full inline-block" />
                  1. Registro Académico de Constancia
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
                      <option value="RC">REGISTRO CIVIL</option>
                      <option value="TI">TARJETA DE IDENTIDAD</option>
                      <option value="CC">CÉDULA DE CIUDADANÍA</option>
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
                      name="nombre_completo"
                      value={formState.nombre_completo}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs uppercase font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha Nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formState.fecha_nacimiento}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grado *</label>
                    <select
                      name="grado_cod"
                      value={formState.grado_cod}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs bg-white text-teal-950 font-extrabold"
                    >
                      {Object.entries(GRADOS_OPCIONES).map(([cod, text]) => (
                        <option key={cod} value={cod}>{text}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grado Texto Autogenerado</label>
                    <input
                      type="text"
                      name="grado_texto"
                      value={formState.grado_texto}
                      readOnly
                      className="w-full p-2 border rounded-xl text-xs bg-slate-100 font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sede Escolar</label>
                    <input
                      type="text"
                      name="sede"
                      value={formState.sede}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs uppercase font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jornada escolar</label>
                    <select
                      name="jornada"
                      value={formState.jornada}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs bg-white"
                    >
                      <option value="ÚNICA">ÚNICA</option>
                      <option value="MAÑANA">MAÑANA</option>
                      <option value="TARDE">TARDE</option>
                      <option value="FIN DE SEMANA">FIN DE SEMANA</option>
                      <option value="NOCTURNA">NOCTURNA</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha Inicio de Matrícula *</label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formState.fecha_inicio}
                      onChange={handleFormChange}
                      required
                      className="w-full p-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Año Escolar Declarado</label>
                    <input
                      type="text"
                      name="anio"
                      value={formState.anio}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-xl text-xs font-mono font-bold"
                    />
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
                  className="py-2 px-5 bg-teal-900 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editId ? 'Guardar Cambios Constancia' : 'Confirmar Registro Constancia'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
