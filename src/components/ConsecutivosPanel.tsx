import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Settings, Trash2, X, Pencil, Check, FileDown, FileCode2 } from 'lucide-react';
import { ConsecutivoOficio, TipoOficio, Responsable } from '../types';
import { generarOficioWord } from '../utils/wordGenerator';

export default function ConsecutivosPanel({ hasPermission }: { hasPermission?: (modulo: string, accion?: "VIEW" | "MODIFICAR" | "ELIMINAR") => boolean }) {
  const [consecutivos, setConsecutivos] = useState<ConsecutivoOficio[]>([]);
  const [tiposOficio, setTiposOficio] = useState<TipoOficio[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigTipos, setShowConfigTipos] = useState(false);
  const [showConfigResponsables, setShowConfigResponsables] = useState(false);
  const [selectedConsecutivo, setSelectedConsecutivo] = useState<ConsecutivoOficio | null>(null);
  const [modoGeneracion, setModoGeneracion] = useState<'basico' | 'completo'>('basico');
  
  const [activeTab, setActiveTab] = useState<'Oficios' | 'Resoluciones' | 'Circulares'>('Oficios');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');

  const [newTipo, setNewTipo] = useState('');
  const [newResponsable, setNewResponsable] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState<number | null>(null);

  const [editingTipoId, setEditingTipoId] = useState<string | null>(null);
  const [editTipoText, setEditTipoText] = useState('');
  
  const [editingRespId, setEditingRespId] = useState<string | null>(null);
  const [editRespText, setEditRespText] = useState('');

  const [formData, setFormData] = useState<Partial<ConsecutivoOficio>>({
    prefijo: 'REC',
    elaborado_por: '',
    entidad_destino: '',
    tipo_oficio: '',
    asunto: '',
    cuerpo_documento: '',
    destinatario_nombre: '',
    destinatario_cargo: '',
    destinatario_lugar: '',
    revisado_por: '',
    despedida: 'Atentamente,',
    firma_nombre: 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
    firma_cargo: 'Rectora I.E Alvernia'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCons, resTipos, resResp] = await Promise.all([
        fetch('/api/consecutivos'),
        fetch('/api/tipos-oficio'),
        fetch('/api/responsables')
      ]);
      const dataCons = await resCons.json();
      const dataTipos = await resTipos.json();
      const dataResp = await resResp.json();
      
      if (dataCons.data) setConsecutivos(dataCons.data);
      if (dataTipos.data) {
        setTiposOficio(dataTipos.data);
        if (dataTipos.data.length > 0) {
          setFormData(prev => ({ ...prev, tipo_oficio: prev.tipo_oficio || dataTipos.data[0].nombre }));
        }
      }
      if (dataResp.data) {
        setResponsables(dataResp.data);
        if (dataResp.data.length > 0) {
          setFormData(prev => ({ ...prev, elaborado_por: prev.elaborado_por || dataResp.data[0].nombre }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTakeConsecutivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let nextNum = editingNumber;
      if (!editingId) {
        const yearDocs = consecutivos.filter(c => c.ano === selectedYear && (c.categoria || 'Oficios') === activeTab);
        const maxNum = yearDocs.length > 0 ? Math.max(...yearDocs.map(c => c.numero_consecutivo || 0)) : 0;
        nextNum = maxNum + 1;
      }

      const payload = {
        ...formData,
        id: editingId || crypto.randomUUID(),
        numero_consecutivo: nextNum,
        ano: formData.ano || selectedYear,
        categoria: activeTab,
        es_generado: modoGeneracion === 'completo'
      };

      const response = await fetch('/api/consecutivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al guardar en el servidor. Es posible que falte reiniciar el servidor (npm run dev).');
      }

      if (payload.es_generado) {
        try {
          const blob = await generarOficioWord(payload as ConsecutivoOficio);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Oficio_${String(payload.numero_consecutivo).padStart(3, '0')}_${payload.ano}.docx`;
          a.click();
          URL.revokeObjectURL(url);
        } catch(err) {
          console.error("Error generando word: ", err);
        }
      }

      setShowModal(false);
      setEditingId(null);
      setEditingNumber(null);
      setModoGeneracion('completo');
      setFormData({
        prefijo: 'REC',
        elaborado_por: responsables.length > 0 ? responsables[0].nombre : '',
        entidad_destino: '',
        tipo_oficio: tiposOficio.length > 0 ? tiposOficio[0].nombre : '',
        asunto: '',
        cuerpo_documento: '',
        destinatario_nombre: '',
        destinatario_cargo: '',
        destinatario_lugar: '',
        revisado_por: '',
        despedida: 'Atentamente,',
        firma_nombre: 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
        firma_cargo: 'Rectora I.E Alvernia'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving consecutivo:', error);
      alert(error.message || 'Error al guardar. Verifica la consola.');
    }
  };

  const handleDeleteConsecutivo = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar (liberar) este consecutivo? Esta acción no se puede deshacer.')) return;
    try {
      await fetch(`/api/consecutivos/${id}`, { method: 'DELETE' });
      setSelectedConsecutivo(null);
      fetchData();
    } catch (error) {
      console.error('Error al eliminar consecutivo:', error);
    }
  };

  const handleAddTipo = async (e: React.FormEvent) => {
    if (!newTipo.trim()) return;
    await fetch('/api/tipos-oficio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), nombre: newTipo.trim() })
    });
    setNewTipo('');
    fetchData();
  };

  const handleDeleteTipo = async (id: string) => {
    await fetch(`/api/tipos-oficio/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateTipo = async (id: string) => {
    if (!editTipoText.trim()) return;
    await fetch('/api/tipos-oficio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: editTipoText.trim() })
    });
    setEditingTipoId(null);
    fetchData();
  };

  const handleAddResponsable = async () => {
    if (!newResponsable.trim()) return;
    await fetch('/api/responsables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), nombre: newResponsable.trim() })
    });
    setNewResponsable('');
    fetchData();
  };

  const handleDeleteResponsable = async (id: string) => {
    await fetch(`/api/responsables/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateResponsable = async (id: string) => {
    if (!editRespText.trim()) return;
    await fetch('/api/responsables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: editRespText.trim() })
    });
    setEditingRespId(null);
    fetchData();
  };

  const filtered = consecutivos
    .filter(c => (c.categoria || 'Oficios') === activeTab)
    .filter(c => c.ano === selectedYear)
    .filter(c => 
      (c.elaborado_por || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.entidad_destino || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.asunto || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.numero_consecutivo - b.numero_consecutivo);

  const maxNum = filtered.length > 0 ? Math.max(...filtered.map(c => Number(c.numero_consecutivo) || 0)) : 0;
  // Llenar cuadrícula con números de maxNum al 1 (descendente).
  const gridItems = Array.from({ length: maxNum }, (_, i) => maxNum - i);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto shadow-inner">
        {(['Oficios', 'Resoluciones', 'Circulares'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex-1 whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-white text-emerald-700 shadow border-b-2 border-emerald-500' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Control de Consecutivos</h2>
            <p className="text-sm text-slate-500">Gestión de oficios y comunicaciones emitidas</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
          <button
            onClick={() => setShowConfigTipos(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Tipos de Oficio
          </button>
          
          <button
            onClick={() => setShowConfigResponsables(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Responsables
          </button>

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 bg-slate-50 border"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{consecutivos.length}</p>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Total Histórico de Oficios</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{maxNum}</p>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Oficios Emitidos en {selectedYear}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por elaborador, entidad o asunto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Filter className="w-4 h-4" />
            <span>{filtered.length} oficios en {selectedYear}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            
            {/* Botón para tomar el SIGUIENTE consecutivo */}
              <div 
              onClick={() => {
                setEditingId(null);
                setEditingNumber(null);
                setModoGeneracion('completo');
                setFormData({
                  prefijo: 'REC',
                  elaborado_por: responsables.length > 0 ? responsables[0].nombre : '',
                  entidad_destino: '',
                  tipo_oficio: tiposOficio.length > 0 ? tiposOficio[0].nombre : '',
                  asunto: '',
                  cuerpo_documento: '',
                  destinatario_nombre: '',
                  destinatario_cargo: '',
                  destinatario_lugar: '',
                  revisado_por: '',
                  despedida: 'Atentamente,',
                  firma_nombre: 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
                  firma_cargo: 'Rectora I.E Alvernia'
                });
                setShowModal(true);
              }}
              className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-all text-blue-700 h-36"
            >
              <FileCode2 className="w-8 h-8 mb-1 text-blue-500" />
              <span className="font-bold text-[11px] text-center uppercase tracking-wider mb-1">Generar Documento</span>
              <span className="font-black text-xl text-center">#{String(maxNum + 1).padStart(3, '0')}</span>
            </div>

            {gridItems.map(num => {
              const doc = filtered.find(c => Number(c.numero_consecutivo) === num);
              if (doc) {
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedConsecutivo(doc)}
                    className="relative group bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-start items-center hover:shadow-md hover:border-emerald-300 transition-all h-36 cursor-pointer overflow-hidden"
                    title={`Asunto: ${doc.asunto}\nDestino: ${doc.entidad_destino}\nElaborado por: ${doc.elaborado_por}`}
                  >
                    {doc.es_generado && (
                      <div className="absolute top-2 right-2 text-blue-500">
                        <FileCode2 className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-3xl font-black text-slate-800 font-mono mb-1 group-hover:scale-110 transition-transform">
                      {String(num).padStart(3, '0')}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-center truncate w-full mb-1">
                      {doc.tipo_oficio}
                    </span>
                    <div className="flex flex-col w-full px-1">
                      <span className="text-[10px] font-semibold text-slate-700 truncate w-full text-center" title={doc.entidad_destino}>
                        {doc.entidad_destino || 'Sin destinatario'}
                      </span>
                      <span className="text-[9px] text-slate-500 line-clamp-2 leading-tight text-center mt-0.5" title={doc.asunto}>
                        {doc.asunto || 'Sin asunto'}
                      </span>
                    </div>
                    
                    {/* Hover info overlay */}
                    <div className="absolute inset-0 bg-slate-900/95 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center text-xs">
                      <p className="font-bold mb-1 truncate text-emerald-400">{doc.entidad_destino || 'Sin destinatario'}</p>
                      <p className="line-clamp-4 text-[10px] text-slate-300 mb-2">{doc.asunto || 'Sin asunto'}</p>
                      <p className="text-[9px] text-slate-400 border-t border-slate-700 pt-1 mt-auto">
                        Por: {doc.elaborado_por}
                      </p>
                    </div>
                  </div>
                );
              } else {
                // Hueco (eliminado o saltado por error en la BD)
                return (
                  <div key={`empty-${num}`} className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-3 flex flex-col items-center justify-center h-28 opacity-60">
                    <span className="text-3xl font-black text-slate-300 font-mono mb-1">{String(num).padStart(3, '0')}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Saltado/Borrado</span>
                  </div>
                );
              }
            })}
          </div>
      </div>

      {/* Modal Detalles del Consecutivo */}
      {selectedConsecutivo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-mono font-black text-xl">
                  #{String(selectedConsecutivo.numero_consecutivo).padStart(3, '0')}
                </div>
                <h3 className="font-bold text-slate-800">Detalle de Oficio</h3>
              </div>
              <button onClick={() => setSelectedConsecutivo(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Documento</p>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedConsecutivo.tipo_oficio}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entidad de Destino</p>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedConsecutivo.entidad_destino}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asunto / Respuesta</p>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedConsecutivo.asunto}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Elaborado Por</p>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedConsecutivo.elaborado_por}</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingId(selectedConsecutivo.id);
                    setEditingNumber(selectedConsecutivo.numero_consecutivo);
                    setModoGeneracion(selectedConsecutivo.es_generado ? 'completo' : 'basico');
                    setFormData({
                      elaborado_por: selectedConsecutivo.elaborado_por || '',
                      entidad_destino: selectedConsecutivo.entidad_destino || '',
                      tipo_oficio: selectedConsecutivo.tipo_oficio || '',
                      asunto: selectedConsecutivo.asunto || '',
                      cuerpo_documento: selectedConsecutivo.cuerpo_documento || '',
                      destinatario_nombre: selectedConsecutivo.destinatario_nombre || '',
                      destinatario_cargo: selectedConsecutivo.destinatario_cargo || '',
                      destinatario_lugar: selectedConsecutivo.destinatario_lugar || '',
                      revisado_por: selectedConsecutivo.revisado_por || '',
                      despedida: selectedConsecutivo.despedida || 'Atentamente,',
                      firma_nombre: selectedConsecutivo.firma_nombre || 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
                      firma_cargo: selectedConsecutivo.firma_cargo || 'Rectora I.E Alvernia'
                    });
                    setSelectedConsecutivo(null);
                    setShowModal(true);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 bg-emerald-50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteConsecutivo(selectedConsecutivo.id)}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
              <div className="flex gap-3">
                {selectedConsecutivo.es_generado && (
                  <button 
                    onClick={async () => {
                      const blob = await generarOficioWord(selectedConsecutivo);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Oficio_${String(selectedConsecutivo.numero_consecutivo).padStart(3, '0')}_${selectedConsecutivo.ano}.docx`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Descargar Word
                  </button>
                )}
                <button onClick={() => setSelectedConsecutivo(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tomar Consecutivo / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-xl w-full ${modoGeneracion === 'completo' ? 'max-w-4xl' : 'max-w-lg'} overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId 
                  ? (modoGeneracion === 'completo' ? 'Editar Oficio Generado' : 'Editar Consecutivo Básico')
                  : (modoGeneracion === 'completo' ? 'Tomar Consecutivo y Generar Oficio Word' : 'Tomar Nuevo Consecutivo Básico')
                }
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
              <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 shrink-0" />
                {editingId 
                  ? <>Editando el número <strong className="text-emerald-900 mx-1">#{String(editingNumber).padStart(3, '0')}</strong> para {selectedYear}.</>
                  : <>Se te asignará el número <strong className="text-emerald-900 mx-1">#{String(maxNum + 1).padStart(3, '0')}</strong> para {selectedYear}.</>
                }
              </p>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                <input 
                  type="checkbox" 
                  checked={modoGeneracion === 'completo'}
                  onChange={(e) => setModoGeneracion(e.target.checked ? 'completo' : 'basico')}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-700">Generar Word</span>
              </label>
            </div>

            <form onSubmit={handleTakeConsecutivo} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modoGeneracion === 'completo' && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Al usar esta opción, además de reservar el consecutivo, podrás descargar el oficio completo en formato Word (.docx) con el diseño institucional.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prefijo</label>
                  <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.prefijo} onChange={e => setFormData({...formData, prefijo: e.target.value})}>
                    <option value="REC">REC</option>
                    <option value="SEC">SEC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Elaborado por (Responsable)</label>
                  {responsables.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      ⚠️ No hay responsables registrados.
                    </div>
                  ) : (
                    <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.elaborado_por} onChange={e => setFormData({...formData, elaborado_por: e.target.value})}>
                      <option value="" disabled>Seleccione un responsable...</option>
                      {responsables.map(r => (
                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Oficio</label>
                  {tiposOficio.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      ⚠️ No hay tipos registrados.
                    </div>
                  ) : (
                    <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.tipo_oficio} onChange={e => setFormData({...formData, tipo_oficio: e.target.value})}>
                      <option value="" disabled>Seleccione el tipo...</option>
                      {tiposOficio.map(t => (
                        <option key={t.id} value={t.nombre}>{t.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Entidad de Destino</label>
                <input required type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.entidad_destino} onChange={e => setFormData({...formData, entidad_destino: e.target.value})} placeholder="Ej. Secretaría de Educación Departamental" />
              </div>

              {modoGeneracion === 'completo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Destinatario</label>
                    <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.destinatario_nombre} onChange={e => setFormData({...formData, destinatario_nombre: e.target.value})} placeholder="Ej. NATALI CALIZ" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo Destinatario</label>
                    <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.destinatario_cargo} onChange={e => setFormData({...formData, destinatario_cargo: e.target.value})} placeholder="Ej. Doctora:" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Lugar Destino</label>
                    <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.destinatario_lugar} onChange={e => setFormData({...formData, destinatario_lugar: e.target.value})} placeholder="Ej. Mocoa Putumayo" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Asunto / Referencia</label>
                <textarea required={modoGeneracion === 'basico'} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" rows={modoGeneracion === 'completo' ? 2 : 3} value={formData.asunto} onChange={e => setFormData({...formData, asunto: e.target.value})} placeholder={modoGeneracion === 'completo' ? "Ej. Queja en contra de docente..." : "Breve descripción del contenido..."} />
              </div>

              {modoGeneracion === 'completo' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cuerpo del Documento (Párrafos)</label>
                    <textarea required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" rows={8} value={formData.cuerpo_documento} onChange={e => setFormData({...formData, cuerpo_documento: e.target.value})} placeholder="Escribe aquí el contenido del oficio. Puedes usar saltos de línea para separar los párrafos..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Revisado por</label>
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.revisado_por} onChange={e => setFormData({...formData, revisado_por: e.target.value})}>
                        <option value="">Nadie (Omitir)</option>
                        {responsables.map(r => (
                          <option key={r.id} value={r.nombre}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white p-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={responsables.length === 0 || tiposOficio.length === 0} className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50">
                  {modoGeneracion === 'completo' ? 'Generar y Guardar Oficio' : 'Generar Consecutivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tipos de Oficio */}
      {showConfigTipos && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Gestionar Tipos de Documento</h3>
              <button onClick={() => setShowConfigTipos(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTipo} 
                  onChange={e => setNewTipo(e.target.value)} 
                  placeholder="Nuevo Tipo (ej. Resolución)" 
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button onClick={handleAddTipo} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {tiposOficio.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 py-4">No hay tipos registrados.</p>
                ) : (
                  tiposOficio.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                      {editingTipoId === t.id ? (
                        <div className="flex-1 flex gap-2 mr-2">
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                            value={editTipoText} 
                            onChange={(e) => setEditTipoText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTipo(t.id)}
                          />
                          <button onClick={() => handleUpdateTipo(t.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditingTipoId(null)} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-700">{t.nombre}</span>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingTipoId(t.id); setEditTipoText(t.nombre); }} className="text-slate-400 hover:text-indigo-600 p-1"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteTipo(t.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Responsables */}
      {showConfigResponsables && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Gestionar Responsables</h3>
              <button onClick={() => setShowConfigResponsables(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newResponsable} 
                  onChange={e => setNewResponsable(e.target.value)} 
                  placeholder="Nombre de la persona" 
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button onClick={handleAddResponsable} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {responsables.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 py-4">No hay responsables registrados.</p>
                ) : (
                  responsables.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                      {editingRespId === r.id ? (
                        <div className="flex-1 flex gap-2 mr-2">
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                            value={editRespText} 
                            onChange={(e) => setEditRespText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateResponsable(r.id)}
                          />
                          <button onClick={() => handleUpdateResponsable(r.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditingRespId(null)} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-700">{r.nombre}</span>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingRespId(r.id); setEditRespText(r.nombre); }} className="text-slate-400 hover:text-indigo-600 p-1"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteResponsable(r.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
