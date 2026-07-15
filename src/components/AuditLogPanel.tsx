import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';

export default function AuditLogPanel({ showToast }: { showToast: (msg: string, type?: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando bitácora', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = filterModule === 'ALL' || log.modulo === filterModule;
    return matchesSearch && matchesModule;
  });

  const modules = Array.from(new Set(logs.map(l => l.modulo).filter(Boolean)));

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando bitácora...</div>;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">Bitácora de Auditoría</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Registro de acciones y eventos del sistema</p>
          </div>
        </div>
        <button onClick={fetchLogs} type="button" className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase cursor-pointer">
          Refrescar
        </button>
      </div>

      <div className="p-5 border-b border-slate-100 bg-white flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por usuario, acción o detalles..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-amber-500"
          />
        </div>
        <select 
          value={filterModule} 
          onChange={e => setFilterModule(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-amber-500"
        >
          <option value="ALL">Todos los módulos</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md shadow-sm z-10">
            <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400">
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Módulo</th>
              <th className="p-3">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-bold text-slate-700">{log.user_email}</td>
                <td className="p-3">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase border border-slate-200">
                    {log.accion}
                  </span>
                </td>
                <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{log.modulo}</td>
                <td className="p-3 text-slate-600 max-w-md truncate" title={log.detalles}>{log.detalles}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400 font-medium">No se encontraron registros en la bitácora.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
