import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, MapPin, Users, User, ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';
import { AgendaEvento, Responsable } from '../types';

export default function AgendaPanel({ hasPermission }: { hasPermission?: (modulo: string, accion?: "VIEW" | "MODIFICAR" | "ELIMINAR") => boolean }) {
  const [eventos, setEventos] = useState<AgendaEvento[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigTipos, setShowConfigTipos] = useState(false);
  const [showConfigResponsables, setShowConfigResponsables] = useState(false);
  
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [newTipoText, setNewTipoText] = useState('');
  
  const [tiposEvento, setTiposEvento] = useState<string[]>(['Reunión', 'Préstamo de Espacio', 'Evento Institucional']);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState<Partial<AgendaEvento>>({
    titulo: '',
    tipo: 'Reunión',
    fecha_inicio: '',
    fecha_fin: '',
    participantes: '',
    lugar_espacio: '',
    estado: 'Programada',
    creado_por: '',
    ano: new Date().getFullYear().toString()
  });

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (data.data) {
        setEventos(data.data);
      }
      
      const resResp = await fetch('/api/responsables');
      const dataResp = await resResp.json();
      if (dataResp.data) {
        setResponsables(dataResp.data);
      }
      
      const storedTipos = localStorage.getItem('agendaTipos');
      if (storedTipos) {
        setTiposEvento(JSON.parse(storedTipos));
      }
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        id: formData.id || crypto.randomUUID(),
        ano: new Date(formData.fecha_inicio || Date.now()).getFullYear().toString()
      };
      
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setShowModal(false);
      setFormData({
        titulo: '',
        tipo: 'Reunión',
        fecha_inicio: '',
        fecha_fin: '',
        participantes: '',
        lugar_espacio: '',
        estado: 'Programada',
        creado_por: '',
        ano: new Date().getFullYear().toString()
      });
      fetchEventos();
    } catch (error) {
      console.error('Error saving evento:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento de la agenda?')) return;
    try {
      await fetch(`/api/agenda/${id}`, { method: 'DELETE' });
      fetchEventos();
    } catch (error) {
      console.error('Error deleting evento:', error);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const monthEventos = eventos.filter(e => {
    const d = new Date(e.fecha_inicio);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  });

  const selectedDayEventos = eventos.filter(e => {
    const d = new Date(e.fecha_inicio);
    return d.getFullYear() === selectedDate.getFullYear() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getDate() === selectedDate.getDate();
  }).sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

  const handleNewEvent = (dateToUse?: Date) => {
    const date = new Date(dateToUse || selectedDate);
    date.setHours(9, 0, 0, 0);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setFormData({ 
      id: undefined,
      titulo: '',
      tipo: 'Reunión',
      fecha_inicio: localISOTime,
      fecha_fin: localISOTime,
      participantes: '',
      lugar_espacio: '',
      estado: 'Programada',
      creado_por: '',
      ano: new Date().getFullYear().toString()
    });
    setShowModal(true);
  };

  const handleEditEvent = (evento: AgendaEvento) => {
    setFormData(evento);
    setShowModal(true);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-slate-100 bg-slate-50/50 min-h-[100px] rounded-lg"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      
      const dayEvents = monthEventos.filter(e => new Date(e.fecha_inicio).getDate() === i);
      
      days.push(
        <div 
          key={i} 
          onClick={() => setSelectedDate(date)}
          className={`p-2 border border-slate-100 min-h-[100px] rounded-lg cursor-pointer transition-colors hover:bg-indigo-50/50 relative flex flex-col group ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-400' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-indigo-600 text-white' : isSelected ? 'bg-indigo-200 text-indigo-800' : 'text-slate-700'}`}>
              {i}
            </span>
            <div className="flex items-center gap-1">
              {dayEvents.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 mt-1 mr-1">{dayEvents.length} ev</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(date);
                  handleNewEvent(date);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 bg-indigo-100 text-indigo-600 rounded flex-shrink-0 hover:bg-indigo-200 transition-all mt-0.5"
                title="Nuevo evento este día"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 mt-1">
            {dayEvents.slice(0, 3).map(e => (
              <div key={e.id} className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded ${e.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700' : e.estado === 'Cancelada' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {e.titulo}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-slate-500 font-medium px-1">+{dayEvents.length - 3} más</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-start">
      
      {/* Calendar Area */}
      <div className="xl:col-span-2 space-y-4">
        
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Agenda Institucional</h2>
              <p className="text-sm text-slate-500">Programación de espacios y reuniones</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-32 text-center font-bold text-slate-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => handleNewEvent()}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

      </div>

      {/* Side Panel for Selected Day */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-fit">
        <div className="bg-slate-50/50 p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-indigo-500" />
            Agenda del Día
          </h3>
          <p className="text-slate-500 text-sm mt-1 capitalize">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="p-5 flex-1 max-h-[600px] overflow-y-auto space-y-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Cargando...</p>
          ) : selectedDayEventos.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No hay eventos para este día</p>
              <button onClick={() => handleNewEvent()} className="mt-4 text-indigo-600 font-semibold text-sm hover:underline">
                Programar algo
              </button>
            </div>
          ) : (
            selectedDayEventos.map(evento => (
              <div key={evento.id} className="relative pl-4 py-2 group">
                <div className={`absolute left-0 top-3 bottom-0 w-1 rounded-full ${evento.estado === 'Completada' ? 'bg-emerald-400' : evento.estado === 'Cancelada' ? 'bg-rose-400' : 'bg-indigo-400'}`}></div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 leading-tight pr-4">{evento.titulo}</h4>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditEvent(evento)}
                        className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                        title="Editar Evento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(evento.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Eliminar Evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600 mt-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-medium text-slate-700">
                          {new Date(evento.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(evento.fecha_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{evento.lugar_espacio}</span>
                    </div>
                    {evento.participantes && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{evento.participantes}</span>
                      </div>
                    )}
                    {evento.creado_por && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{evento.creado_por}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                      {evento.tipo}
                    </span>
                    <select 
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md outline-none cursor-pointer appearance-none text-center ${
                        evento.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                        evento.estado === 'Cancelada' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                        'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                      value={evento.estado}
                      onChange={async (e) => {
                        try {
                          const updated = {...evento, estado: e.target.value};
                          await fetch('/api/agenda', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updated)
                          });
                          fetchEventos();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      <option value="Programada">Programada</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Programar Evento / Espacio</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Título del Evento</label>
                <input required type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ej. Reunión de Consejo" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    value={formData.tipo} 
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setShowTipoModal(true);
                      } else {
                        setFormData({...formData, tipo: e.target.value});
                      }
                    }}
                  >
                    {tiposEvento.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="ADD_NEW" className="font-bold text-indigo-600">+ Agregar Nuevo Tipo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                    <option>Programada</option>
                    <option>Completada</option>
                    <option>Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Inicio</label>
                  <input required type="datetime-local" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Fin</label>
                  <input required type="datetime-local" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lugar o Espacio</label>
                <input required type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.lugar_espacio} onChange={e => setFormData({...formData, lugar_espacio: e.target.value})} placeholder="Ej. Auditorio Principal" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Participantes</label>
                <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.participantes} onChange={e => setFormData({...formData, participantes: e.target.value})} placeholder="Ej. Docentes de área, Rector" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Creado por</label>
                <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.creado_por} onChange={e => setFormData({...formData, creado_por: e.target.value})}>
                  <option value="" disabled>Seleccione un responsable...</option>
                  {responsables.map(r => (
                    <option key={r.id} value={r.nombre}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal para Nuevo Tipo de Evento */}
      {showTipoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Nuevo Tipo de Evento</h3>
              <button 
                onClick={() => {
                  setShowTipoModal(false);
                  setNewTipoText('');
                  if (formData.tipo === 'ADD_NEW' || !formData.tipo) {
                    setFormData({...formData, tipo: tiposEvento[0]});
                  }
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Tipo</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                  value={newTipoText} 
                  onChange={e => setNewTipoText(e.target.value)} 
                  placeholder="Ej. Capacitación" 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTipoText.trim() !== '') {
                      e.preventDefault();
                      const updatedTipos = [...new Set([...tiposEvento, newTipoText.trim()])];
                      setTiposEvento(updatedTipos);
                      localStorage.setItem('agendaTipos', JSON.stringify(updatedTipos));
                      setFormData({...formData, tipo: newTipoText.trim()});
                      setNewTipoText('');
                      setShowTipoModal(false);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowTipoModal(false);
                  setNewTipoText('');
                  if (formData.tipo === 'ADD_NEW' || !formData.tipo) {
                    setFormData({...formData, tipo: tiposEvento[0]});
                  }
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (newTipoText.trim() !== '') {
                    const updatedTipos = [...new Set([...tiposEvento, newTipoText.trim()])];
                    setTiposEvento(updatedTipos);
                    localStorage.setItem('agendaTipos', JSON.stringify(updatedTipos));
                    setFormData({...formData, tipo: newTipoText.trim()});
                    setNewTipoText('');
                    setShowTipoModal(false);
                  }
                }}
                disabled={!newTipoText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
