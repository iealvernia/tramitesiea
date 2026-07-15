import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Users, GraduationCap, Building2, Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function DashboardPanel({ userSession }: { userSession?: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase / API
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matriculas');
      const json = await res.json();
      if (!json.error && json.data) {
        // Convert snake_case to camelCase
        const formatted = json.data.map((item: any) => ({
          ...item,
          sede: item.sede || 'COL ALVERNIA',
          grado: item.grado || 'SIN ASIGNAR',
          sexo: item.sexo || 'NO REGISTRA',
          fechaMatricula: item.fecha_matricula || item.fechaMatricula || new Date().toISOString()
        }));
        setStudents(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching matriculas para dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on session
  const filteredStudents = useMemo(() => {
    if (userSession?.user && userSession.user.rol !== 'ADMIN' && userSession.user.sede && userSession.user.sede !== 'TODAS') {
      return students.filter(s => s.sede === userSession.user.sede);
    }
    return students;
  }, [students, userSession]);

  // Derived Stats
  const totalMatriculas = filteredStudents.length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const matriculasMesActual = filteredStudents.filter(s => {
    if (!s.fechaMatricula) return false;
    const d = new Date(s.fechaMatricula);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const matriculasHoy = filteredStudents.filter(s => {
    if (!s.fechaMatricula) return false;
    const d = new Date(s.fechaMatricula);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  // Chart Data: Sedes
  const sedesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach(s => counts[s.sede] = (counts[s.sede] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredStudents]);

  // Chart Data: Grados
  const gradosData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach(s => counts[s.grado] = (counts[s.grado] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredStudents]);

  // Chart Data: Genero
  const generoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach(s => counts[s.sexo] = (counts[s.sexo] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredStudents]);

  // Chart Data: Por Mes (este año)
  const mesesData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const counts = new Array(12).fill(0);
    filteredStudents.forEach(s => {
      if (s.fechaMatricula) {
        const d = new Date(s.fechaMatricula);
        if (d.getFullYear() === currentYear) {
          counts[d.getMonth()]++;
        }
      }
    });
    return counts.map((count, i) => ({ mes: monthNames[i], matriculas: count }));
  }, [filteredStudents, currentYear]);

  // Chart Data: Por Año
  const aniosData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach(s => {
      if (s.fechaMatricula) {
        const y = new Date(s.fechaMatricula).getFullYear();
        counts[y] = (counts[y] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([year, value]) => ({ year, matriculas: value })).sort((a, b) => Number(a.year) - Number(b.year));
  }, [filteredStudents]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Panel Principal (Dashboard)</h2>
        <p className="text-sm text-slate-500 font-medium">Estadísticas y visión global de matrículas institucionales</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Matrículas</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{totalMatriculas}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Nuevas (Este mes)</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">+{matriculasMesActual}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Nuevas Hoy</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">+{matriculasHoy}</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Matriculas por Sede */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Building2 className="w-4 h-4 text-indigo-500" /> Matrículas por Sede
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sedesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sedesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} estudiantes`, 'Matrículas']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriculas por Genero */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-pink-500" /> Distribución por Género
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={generoData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {generoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name.toUpperCase().includes('FEM') ? '#ec4899' : '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} estudiantes`, 'Matrículas']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriculas por Grado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-6">
            <GraduationCap className="w-4 h-4 text-amber-500" /> Matrículas por Grado
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradosData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Estudiantes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriculas por Mes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Evolución Mensual ({currentYear})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mesesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="matriculas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMes)" name="Nuevas Matrículas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriculas por Año */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-purple-500" /> Histórico por Año
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aniosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="matriculas" stroke="#8b5cf6" strokeWidth={4} activeDot={{ r: 6 }} name="Total Matrículas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
