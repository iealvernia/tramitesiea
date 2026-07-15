import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, LabelList 
} from 'recharts';
import { Users, GraduationCap, Building2, Calendar, TrendingUp, UserCheck, UserX, FileText, Award, Layers, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#06b6d4'];

// --- SUB-COMPONENTS TO PREVENT CONDITIONAL HOOKS ---

function MatriculasView({ currentData, userSession, currentMonth, currentYear }: any) {
  const metrics = useMemo(() => {
    const filteredStudents = (userSession?.user && userSession.user.rol !== 'ADMIN' && userSession.user.sede && userSession.user.sede !== 'TODAS')
      ? currentData.filter((s: any) => (s.sede || 'COL ALVERNIA') === userSession.user.sede)
      : currentData.map((s: any) => ({...s, sede: s.sede || 'COL ALVERNIA', grado: s.grado || 'SIN ASIGNAR', sexo: s.sexo || 'NO REGISTRA', fechaMatricula: s.fecha_matricula || s.fechaMatricula || new Date().toISOString()}));

    const totalMatriculas = filteredStudents.length;
    let matriculasMesActual = 0;
    let matriculasHoy = 0;
    const sedesCount: any = {};
    const gradosCount: any = {};
    const generoCount: any = {};
    const counts = new Array(12).fill(0);
    const today = new Date();

    filteredStudents.forEach((s: any) => {
      if (s.fechaMatricula) {
        const d = new Date(s.fechaMatricula);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) matriculasMesActual++;
        if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) matriculasHoy++;
        if (d.getFullYear() === currentYear) counts[d.getMonth()]++;
      }
      sedesCount[s.sede] = (sedesCount[s.sede] || 0) + 1;
      gradosCount[s.grado] = (gradosCount[s.grado] || 0) + 1;
      generoCount[s.sexo] = (generoCount[s.sexo] || 0) + 1;
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return {
      totalMatriculas, matriculasMesActual, matriculasHoy,
      sedesData: Object.entries(sedesCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value),
      gradosData: Object.entries(gradosCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value),
      generoData: Object.entries(generoCount).map(([name, value]) => ({ name, value })),
      mesesData: counts.map((v, i) => ({ name: monthNames[i], Matriculas: v })).filter(d => d.Matriculas > 0 || monthNames.indexOf(d.name) <= currentMonth)
    };
  }, [currentData, userSession, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center"><Users className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Matrículas</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.totalMatriculas}</h3></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><TrendingUp className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nuevas (Este Mes)</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">+{metrics.matriculasMesActual}</h3></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Calendar className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nuevas Hoy</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">+{metrics.matriculasHoy}</h3></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Matrículas por Sede</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.sedesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{metrics.sedesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-rose-400" /> Distribución por Género</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.generoData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{metrics.generoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'MASCULINO' ? '#3b82f6' : entry.name === 'FEMENINO' ? '#ec4899' : '#94a3b8'} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-amber-500" /> Matrículas por Grado</h4>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.gradosData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}><LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} /></Bar></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}

function EmpleadosView({ currentData }: any) {
  const metrics = useMemo(() => {
    const data = currentData;
    const total = data.length;
    const activos = data.filter((e: any) => e.estado === 'Activo' || e.estado === 'Activa').length;
    const inactivos = total - activos;
    const cargosCount: any = {};
    data.forEach((e: any) => { cargosCount[e.cargo || 'SIN CARGO'] = (cargosCount[e.cargo || 'SIN CARGO'] || 0) + 1; });
    return {
      total, activos, inactivos,
      cargosData: Object.entries(cargosCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value)
    };
  }, [currentData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Users className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Personal</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total}</h3></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><UserCheck className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Activos</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.activos}</h3></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center"><UserX className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Inactivos</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.inactivos}</h3></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Personal por Cargo</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.cargosData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{metrics.cargosData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-400" /> Estado del Personal</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name: 'Activos', value: metrics.activos}, {name: 'Inactivos', value: metrics.inactivos}]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{[{name: 'Activos'}, {name: 'Inactivos'}].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Activos' ? '#10b981' : '#ef4444'} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /></PieChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}

function NovedadesView({ currentData, currentMonth, currentYear }: any) {
  const metrics = useMemo(() => {
    const data = currentData;
    const total = data.length;
    let thisMonth = 0;
    const clasesCount: any = {};
    data.forEach((n: any) => {
      const d = new Date(n.fecha_inicio);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) thisMonth++;
      clasesCount[n.clase_novedad || 'OTRO'] = (clasesCount[n.clase_novedad || 'OTRO'] || 0) + 1;
    });
    return { total, thisMonth, clasesData: Object.entries(clasesCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value) };
  }, [currentData, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Calendar className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Permisos/Novedades</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total}</h3></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center"><Clock className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Novedades Este Mes</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.thisMonth}</h3></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Distribución por Clase de Novedad</h4>
        <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.clasesData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

function DocsView({ currentData, color, Icon, title }: any) {
  const metrics = useMemo(() => {
    const data = currentData;
    const total = data.length;
    const aniosCount: any = {};
    data.forEach((d: any) => { aniosCount[d.anio || 'N/A'] = (aniosCount[d.anio || 'N/A'] || 0) + 1; });
    return { total, aniosData: Object.entries(aniosCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => a.name.localeCompare(b.name)) };
  }, [currentData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
          <div className={`w-14 h-14 bg-${color}-100 text-${color}-600 rounded-2xl flex items-center justify-center`}><Icon className="w-7 h-7" /></div>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total {title}</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total}</h3></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Distribución por Año Lectivo</h4>
        <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.aniosData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="value" stroke={`#${color === 'sky' ? '0ea5e9' : color === 'emerald' ? '10b981' : '8b5cf6'}`} fill={`#${color === 'sky' ? 'e0f2fe' : color === 'emerald' ? 'd1fae5' : 'ede9fe'}`} /></AreaChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

function AgendaView({ currentData }: any) {
  const metrics = useMemo(() => {
    const data = currentData;
    const total = data.length;
    const estadoCount: any = {};
    const tipoCount: any = {};
    data.forEach((n: any) => {
      estadoCount[n.estado || 'NO DEFINIDO'] = (estadoCount[n.estado || 'NO DEFINIDO'] || 0) + 1;
      tipoCount[n.tipo || 'NO DEFINIDO'] = (tipoCount[n.tipo || 'NO DEFINIDO'] || 0) + 1;
    });
    return { 
      total, 
      estadoData: Object.entries(estadoCount).map(([name, value]) => ({ name, value })),
      tipoData: Object.entries(tipoCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value)
    };
  }, [currentData]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Calendar className="w-7 h-7" /></div>
        <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Eventos Programados</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total}</h3></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Eventos por Estado</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.estadoData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{metrics.estadoData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Tipo de Evento</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.tipoData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}

function ConsecutivosView({ currentData }: any) {
  const metrics = useMemo(() => {
    const data = currentData;
    const total = data.length;
    const aniosCount: any = {};
    const tipoCount: any = {};
    data.forEach((d: any) => { 
      aniosCount[d.ano || 'N/A'] = (aniosCount[d.ano || 'N/A'] || 0) + 1; 
      tipoCount[d.tipo_oficio || 'NO DEFINIDO'] = (tipoCount[d.tipo_oficio || 'NO DEFINIDO'] || 0) + 1;
    });
    return {
      total,
      aniosData: Object.entries(aniosCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
      tipoData: Object.entries(tipoCount).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value)
    };
  }, [currentData]);

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center"><FileText className="w-7 h-7" /></div>
        <div><p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Oficios / Consecutivos</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total}</h3></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Oficios por Año</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.aniosData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#e0f2fe" /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Tipo de Oficio</h4>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.tipoData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPanel({ userSession, hasPermission }: { userSession?: any, hasPermission?: (modulo: string, accion?: "VIEW" | "MODIFICAR" | "ELIMINAR") => boolean }) {
  // Tabs management
  const availableTabs = useMemo(() => [
    { id: 'matriculas', label: 'Matrículas', mod: 'MATRICULAS' },
    { id: 'empleados', label: 'Personal', mod: 'EMPLEADOS' },
    { id: 'novedades', label: 'Permisos', mod: 'NOVEDADES' },
    { id: 'cert_gral', label: 'Certificados (Gral)', mod: 'CERTIFICADOS_GENERALES' },
    { id: 'cert_pama', label: 'Certificados (PAMA)', mod: 'CERTIFICADOS_PAMA' },
    { id: 'constancias', label: 'Constancias', mod: 'CONSTANCIAS_ESTUDIO' },
    { id: 'agenda', label: 'Agenda', mod: 'AGENDA_INSTITUCIONAL' },
    { id: 'consecutivos', label: 'Oficios', mod: 'CONSECUTIVOS' },
  ].filter(tab => hasPermission ? hasPermission(tab.mod) : true), [hasPermission]);

  const [activeTab, setActiveTab] = useState<string>(availableTabs.length > 0 ? availableTabs[0].id : '');
  const [isPending, startTransition] = useTransition();

  // Data State
  const [dataCache, setDataCache] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const loadDataForTab = async (tabId: string) => {
    if (dataCache[tabId]) return; // Already loaded

    setLoading(true);
    let endpoint = '';
    
    switch (tabId) {
      case 'matriculas': endpoint = '/api/matriculas'; break;
      case 'empleados': endpoint = '/api/employees'; break;
      case 'novedades': endpoint = '/api/novedades'; break;
      case 'cert_gral': endpoint = '/api/certificados'; break;
      case 'cert_pama': endpoint = '/api/certificados-pama'; break;
      case 'constancias': endpoint = '/api/constancias'; break;
      case 'agenda': endpoint = '/api/agenda'; break;
      case 'consecutivos': endpoint = '/api/consecutivos'; break;
    }

    if (endpoint) {
      try {
        const res = await fetch(endpoint);
        const json = await res.json();
        if (!json.error && json.data) {
          setDataCache(prev => ({ ...prev, [tabId]: json.data }));
        } else if (json.users) {
           setDataCache(prev => ({ ...prev, [tabId]: json.users }));
        } else if (json.employees) {
           setDataCache(prev => ({ ...prev, [tabId]: json.employees }));
        } else if (json.novedades) {
           setDataCache(prev => ({ ...prev, [tabId]: json.novedades }));
        }
      } catch (err) {
        console.error(`Error fetching data for ${tabId}:`, err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab) {
      loadDataForTab(activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (id: string) => {
    startTransition(() => {
      setActiveTab(id);
    });
  };

  if (availableTabs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bienvenido a I.E. Alvernia</h2>
        <p className="text-slate-500 mt-2 text-sm">No tienes permisos para visualizar estadísticas en este momento. Utiliza el menú lateral para acceder a tus módulos habilitados.</p>
      </div>
    );
  }

  const currentData = dataCache[activeTab] || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // --- MAIN RENDER ---
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <BarChart className="w-8 h-8 text-indigo-600" />
          PANEL PRINCIPAL (DASHBOARD)
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
          Estadísticas y visión global de la Institución Educativa Alvernia.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className={`min-h-[400px] transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'matriculas' && <MatriculasView currentData={currentData} userSession={userSession} currentMonth={currentMonth} currentYear={currentYear} />}
            {activeTab === 'empleados' && <EmpleadosView currentData={currentData} />}
            {activeTab === 'novedades' && <NovedadesView currentData={currentData} currentMonth={currentMonth} currentYear={currentYear} />}
            {activeTab === 'cert_gral' && <DocsView currentData={currentData} color="sky" Icon={Award} title="Certificados Generales" />}
            {activeTab === 'cert_pama' && <DocsView currentData={currentData} color="emerald" Icon={Award} title="Certificados PAMA" />}
            {activeTab === 'constancias' && <DocsView currentData={currentData} color="indigo" Icon={FileText} title="Constancias Emitidas" />}
            {activeTab === 'agenda' && <AgendaView currentData={currentData} />}
            {activeTab === 'consecutivos' && <ConsecutivosView currentData={currentData} />}
          </>
        )}
      </div>

    </div>
  );
}
