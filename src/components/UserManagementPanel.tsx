import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit, Trash2, Key, Check, X, UserX, UserCheck, Eye, EyeOff } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { id: 'AGENDA_INSTITUCIONAL', label: 'Agenda Institucional' },
  { id: 'CONSECUTIVOS', label: 'Control Consecutivos' },
  { id: 'NOVEDADES', label: 'Agenda de Permisos' },
  { id: 'EMPLEADOS', label: 'Personal y Carga' },
  { id: 'COMPUTO', label: 'Cómputo Absoluto' },
  { id: 'REPORTES', label: 'Reportes Generales' },
  { id: 'MATRICULAS', label: 'Control de Matrículas' },
  { id: 'CERTIFICADOS', label: 'Certificados Generales' },
  { id: 'CERTIFICADOS_PAMA', label: 'Certificados PAMA' },
  { id: 'CONSTANCIAS', label: 'Constancias de Estudio' },
  { id: 'EVALUACION', label: 'Evaluación Docente 1278' },
  { id: 'CAJAMENOR', label: 'Caja Menor' },
  { id: 'CONFIGURACION', label: 'Configuración General' }
];

export default function UserManagementPanel({ logAction, userSession, showToast }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '', email: '', password: '', nombre: '', rol: 'USER', permisos: [] as string[], activo: true, sede: 'TODAS'
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      email: user.email,
      password: user.plain_password || '',
      nombre: user.nombre || '',
      rol: user.rol || 'USER',
      permisos: typeof user.permisos === 'string' ? JSON.parse(user.permisos) : (user.permisos || []),
      activo: user.activo,
      sede: user.sede || 'TODAS'
    });
  };

  const handleNew = () => {
    setEditingUser({ isNew: true });
    setFormData({ id: '', email: '', password: '', nombre: '', rol: 'USER', permisos: [], activo: true, sede: 'TODAS' });
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const togglePermission = (permId: string, type: 'VIEW' | 'MODIFICAR' | 'ELIMINAR' = 'VIEW') => {
    if (formData.rol === 'ADMIN') return;
    
    let newPerms = [...formData.permisos];
    
    if (type === 'VIEW') {
      if (newPerms.includes(permId)) {
        newPerms = newPerms.filter(p => p !== permId && p !== `${permId}_MODIFICAR` && p !== `${permId}_ELIMINAR`);
      } else {
        newPerms.push(permId);
      }
    } else {
      const suffixId = `${permId}_${type}`;
      if (newPerms.includes(suffixId)) {
        newPerms = newPerms.filter(p => p !== suffixId);
      } else {
        newPerms.push(suffixId);
        if (!newPerms.includes(permId)) {
          newPerms.push(permId);
        }
      }
    }
    
    setFormData({ ...formData, permisos: newPerms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      showToast('Usuario guardado exitosamente');
      await logAction(
        formData.id ? 'ACTUALIZAR_USUARIO' : 'CREAR_USUARIO',
        'CONFIGURACION',
        `Usuario: ${formData.email} | Rol: ${formData.rol}`
      );
      
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) {
      showToast(e.message || 'Error guardando usuario', 'error');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (userSession?.user?.email === email) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar el usuario ${email}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      showToast('Usuario eliminado');
      await logAction('ELIMINAR_USUARIO', 'CONFIGURACION', `Email eliminado: ${email}`);
      fetchUsers();
    } catch (e: any) {
      showToast(e.message || 'Error eliminando usuario', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">Gestión de Usuarios</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de acceso, roles y permisos</p>
          </div>
        </div>
        {!editingUser && (
          <button onClick={handleNew} type="button" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="p-6">
        {editingUser ? (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5">Nombre Completo</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl" required />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5">Correo Electrónico</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl" required />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5">
                  Contraseña {formData.id && formData.rol === 'ADMIN' ? '(Dejar en blanco para no cambiar)' : ''}
                </label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 pr-10 text-xs bg-white border border-slate-200 rounded-xl" required={!formData.id || (formData.id && formData.rol !== 'ADMIN' && !formData.password)} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5">Rol del Sistema</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value, permisos: e.target.value === 'ADMIN' ? [] : formData.permisos})} className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700">
                  <option value="USER">Usuario (Acceso Restringido)</option>
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5">Sede Asignada</label>
                <select value={formData.sede} onChange={e => setFormData({...formData, sede: e.target.value})} className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700">
                  <option value="TODAS">Todas las Sedes</option>
                  <option value="SAN NICOLAS">San Nicolás</option>
                  <option value="COL ALVERNIA">Col Alvernia</option>
                  <option value="SAN MARTIN">San Martín</option>
                  <option value="EL JARDIN">El Jardín</option>
                  <option value="LA GABRIELA">La Gabriela</option>
                  <option value="ANTONIO NARIÑO">Antonio Nariño</option>
                  <option value="VILLA PAZ">Villa Paz</option>
                </select>
              </div>
            </div>

            {formData.rol === 'USER' && (
              <div className="border-t border-slate-200 pt-5 mt-5">
                <label className="text-[10px] font-extrabold text-indigo-600 uppercase block mb-3 flex items-center gap-1"><Shield className="w-3 h-3"/> Permisos de Acceso a Módulos</label>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2">Módulo</th>
                        <th className="p-2 text-center">Acceso (Ver)</th>
                        <th className="p-2 text-center">Modificar</th>
                        <th className="p-2 text-center">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {AVAILABLE_PERMISSIONS.map(perm => {
                        const hasView = formData.permisos.includes(perm.id) || formData.permisos.some(p => p.startsWith(`${perm.id}_`));
                        const hasMod = formData.permisos.includes(`${perm.id}_MODIFICAR`);
                        const hasDel = formData.permisos.includes(`${perm.id}_ELIMINAR`);
                        
                        return (
                          <tr key={perm.id} className="hover:bg-slate-50/50">
                            <td className="p-2 font-semibold text-slate-700">{perm.label}</td>
                            <td className="p-2 text-center">
                              <input type="checkbox" checked={hasView} onChange={() => togglePermission(perm.id, 'VIEW')} className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                            </td>
                            <td className="p-2 text-center">
                              <input type="checkbox" checked={hasMod} onChange={() => togglePermission(perm.id, 'MODIFICAR')} disabled={!hasView} className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:opacity-40" />
                            </td>
                            <td className="p-2 text-center">
                              <input type="checkbox" checked={hasDel} onChange={() => togglePermission(perm.id, 'ELIMINAR')} disabled={!hasView} className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:opacity-40" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-3 pt-4">
              <button type="button" onClick={handleCancel} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase hover:text-slate-700 cursor-pointer">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase shadow-sm hover:bg-indigo-500 flex items-center gap-1.5 cursor-pointer">
                <Check className="w-4 h-4" /> Guardar Usuario
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 bg-slate-50/50">
                  <th className="p-3">Nombre / Email</th>
                  <th className="p-3">Rol / Sede</th>
                  <th className="p-3">Permisos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{u.nombre || 'Sin nombre'}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.rol === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.rol === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {u.rol === 'ADMIN' ? 'Admin' : 'Usuario'}
                      </span>
                      <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Sede: {u.sede || 'TODAS'}</div>
                    </td>
                    <td className="p-3">
                      {u.rol === 'ADMIN' ? (
                        <span className="text-[10px] font-bold text-slate-400 italic">Acceso Total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.permisos?.length ? u.permisos.map((p: string) => (
                            <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase border border-slate-200">{p}</span>
                          )) : <span className="text-slate-400 italic text-[9px]">Sin permisos</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {u.activo ? (
                        <UserCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <UserX className="w-4 h-4 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 flex justify-end gap-2">
                      <button type="button" onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer" title="Editar">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(u.id, u.email)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer" title="Eliminar" disabled={userSession?.user?.email === u.email}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">No hay usuarios registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
