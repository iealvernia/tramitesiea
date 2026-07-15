import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Trash2, 
  School, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  Activity, 
  UserX, 
  ArrowRight,
  FilePlus,
  Users2,
  CalendarDays,
  FileCheck,
  RefreshCw,
  Settings,
  Lock,
  LogOut,
  User,
  Award,
  FileText,
  Pencil,
  Eye,
  EyeOff
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

import { 
  Employee, 
  DocenteEvaluacion, 
  Novedad, 
  SEDES_OPCIONES, 
  AREAS_DESEMPENO_OPCIONES, 
  CLASES_NOVEDADES_OPCIONES, 
  CARGOS_OPCIONES, 
  DOCUMENTOS_SOPORTE_OPCIONES, 
  TIPOS_NOMBRAMIENTO_OPCIONES 
} from './types';

import { EvaluacionDocentePanel } from './components/EvaluacionDocentePanel';

import { 
  signInWithGoogleWorkspace, 
  logoutGoogleWorkspace, 
  initGoogleAuth, 
  createGoogleSheetDatabase,
  findExistingSheet,
  syncNovedadesToSheet
} from './lib/googleWorkspace';

import { INITIAL_EMPLOYEES, INITIAL_NOVEDADES } from './data/mockData';
import ExcelImporter from './components/ExcelImporter';
import ReportsPanel from './components/ReportsPanel';
import ComputoPanel from './components/ComputoPanel';
import MatriculasPanel from './components/MatriculasPanel';
import CertificadosPanel from './components/CertificadosPanel';
import CertificadosPamaPanel from './components/CertificadosPamaPanel';
import ConstanciasPanel from './components/ConstanciasPanel';
import GlobalConfigPanel from './components/GlobalConfigPanel';
import ConfigurationPanel from './components/ConfigurationPanel';
import AgendaPanel from './components/AgendaPanel';
import ConsecutivosPanel from './components/ConsecutivosPanel';

// --- Supabase Mapping Helpers for Employees and Novedades (Permisos) ---
const mapEmployeeToDb = (emp: Employee) => ({
  id: emp.id,
  nombre: emp.nombre,
  cedula: emp.cedula,
  cargo: emp.cargo,
  sede_trabajo: emp.sedeTrabajo,
  dificil_acceso: emp.dificilAcceso,
  horas_aula: emp.horasAula,
  horas_libres: emp.horasLibres,
  area_desempeno: emp.areaDesempeno,
  tipo_nombramiento: emp.tipoNombramiento,
  activo: emp.activo
});

const mapDbToEmployee = (db: any): Employee => ({
  id: db.id,
  nombre: db.nombre,
  cedula: db.cedula,
  cargo: db.cargo,
  sedeTrabajo: db.sede_trabajo,
  dificilAcceso: db.dificil_acceso as 'Si' | 'No',
  horasAula: db.horas_aula || 0,
  horasLibres: db.horas_libres || 0,
  areaDesempeno: db.area_desempeno,
  tipoNombramiento: db.tipo_nombramiento,
  activo: db.activo ?? true
});

const mapNovedadToDb = (nov: Novedad) => ({
  id: nov.id,
  empleado_id: nov.empleadoId,
  clase_novedad: nov.claseNovedad,
  sede_novedad: nov.sedeNovedad,
  fecha_inicio: nov.fechaInicio,
  fecha_fin: nov.fechaFin,
  esta_laborando_normalmente: nov.estaLaborandoNormalmente,
  se_le_asigno_carga_academica: nov.seLeAsignoCargaAcademica,
  documento_soporte_tipo: nov.documentoSoporteTipo,
  documento_soporte_no: nov.documentoSoporteNo,
  documento_soporte_fecha: nov.documentoSoporteFecha,
  observaciones: nov.observaciones || ''
});

const mapDbToNovedad = (db: any): Novedad => ({
  id: db.id,
  empleadoId: db.empleado_id,
  claseNovedad: db.clase_novedad,
  sedeNovedad: db.sede_novedad,
  fechaInicio: db.fecha_inicio,
  fechaFin: db.fecha_fin,
  estaLaborandoNormalmente: db.esta_laborando_normalmente as 'Si' | 'No',
  seLeAsignoCargaAcademica: db.se_le_asigno_carga_academica as 'Si' | 'No',
  documentoSoporteTipo: db.documento_soporte_tipo as 'R' | 'D' | 'A' | 'I' | 'P' | 'O' | '',
  documentoSoporteNo: db.documento_soporte_no || '',
  documentoSoporteFecha: db.documento_soporte_fecha || '',
  observaciones: db.observaciones || ''
});

export default function App() {
  // --- Supabase Authentication State ---
  const [userSession, setUserSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isTeacherLogin, setIsTeacherLogin] = useState(false);
  const [teacherCedulaLogin, setTeacherCedulaLogin] = useState('');

  const [appTitle, setAppTitle] = useState(() => localStorage.getItem('iea_app_title') || 'PERMISOS IEA');
  const [appBrandName, setAppBrandName] = useState(() => localStorage.getItem('iea_app_name') || 'APP GESTIÓN ADMINISTRATIVA');

  useEffect(() => {
    const handleConfigUpdate = () => {
      setAppTitle(localStorage.getItem('iea_app_title') || 'PERMISOS IEA');
      setAppBrandName(localStorage.getItem('iea_app_name') || 'APP GESTIÓN ADMINISTRATIVA');
    };
    window.addEventListener('iea_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('iea_config_updated', handleConfigUpdate);
  }, []);

  // --- Static Asset Preloader for reliable school logo and signature ---
  useEffect(() => {
    const preloadStaticAssets = async () => {
      const storedLogo = localStorage.getItem('iea_custom_logo');
      const storedSignature = localStorage.getItem('iea_custom_signature');
      let changed = false;

      // Safe base64 conversion helper
      const getBase64FromUrl = async (url: string): Promise<string> => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      if (!storedLogo) {
        try {
          const base64 = await getBase64FromUrl('./logo.png');
          localStorage.setItem('iea_custom_logo', base64);
          changed = true;
          console.log('[IEA] Preloaded static logo.png to offline storage successfully.');
        } catch (e) {
          console.warn('[IEA] Failed preloading logo.png, using default vector graphics:', e);
        }
      }

      if (!storedSignature) {
        try {
          const base64 = await getBase64FromUrl('./firma_rector.png');
          localStorage.setItem('iea_custom_signature', base64);
          changed = true;
          console.log('[IEA] Preloaded static firma_rector.png to offline storage successfully.');
        } catch (e) {
          console.warn('[IEA] Failed preloading firma_rector.png:', e);
        }
      }

      if (changed) {
        window.dispatchEvent(new Event('iea_config_updated'));
      }
    };

    preloadStaticAssets();
  }, []);

  useEffect(() => {
    const sessionStr = localStorage.getItem('alvernia_admin_session');
    if (sessionStr) {
      setUserSession(JSON.parse(sessionStr));
    }
    setCheckingSession(false);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas o problema de conexión.');
      }
      const session = { user: data.user };
      localStorage.setItem('alvernia_admin_session', JSON.stringify(session));
      setUserSession(session);
      showToast('¡Inicio de sesión exitoso!');
    } catch (err: any) {
      console.error('Error in login:', err);
      setLoginError(err.message || 'Credenciales inválidas o problema de conexión.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    // Si es docente, solo limpiar currentTeacher
    if (currentTeacher) {
      setCurrentTeacher(null);
      setActiveTab('novedades');
      setIsTeacherLogin(false);
      setLoginError(null);
      showToast('Sesión de docente cerrada correctamente.');
      return;
    }
    // Si es administrador, limpiar sesión local
    localStorage.removeItem('alvernia_admin_session');
    setUserSession(null);
    setActiveTab('novedades');
    showToast('Sesión cerrada correctamente.');
  };

  const hasPermission = (modulo: string, accion: 'VIEW' | 'MODIFICAR' | 'ELIMINAR' = 'VIEW') => {
    if (!userSession?.user) return false;
    if (userSession.user.email === 'matriculas@alvernia.com' || userSession.user.rol === 'ADMIN') return true;
    
    const perms = userSession.user.permisos;
    if (!perms) return false;
    
    const hasPerm = (pArray: string[]) => {
      if (accion === 'VIEW') {
        return pArray.some(p => p === modulo || p.startsWith(`${modulo}_`));
      }
      return pArray.includes(`${modulo}_${accion}`);
    };

    if (Array.isArray(perms)) {
      return hasPerm(perms);
    }
    
    if (typeof perms === 'string') {
      try {
        const parsed = JSON.parse(perms);
        if (Array.isArray(parsed)) return hasPerm(parsed);
      } catch (e) {
        if (accion === 'VIEW') {
          return perms.includes(modulo) || perms.includes(`${modulo}_`);
        }
        return perms.includes(`${modulo}_${accion}`);
      }
    }
    
    return false;
  };

  const logAction = async (accion: string, modulo: string, detalles: string) => {
    if (!userSession?.user) return;
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userSession.user.email,
          accion,
          modulo,
          detalles
        })
      });
    } catch (e) {
      console.error('Failed to log action', e);
    }
  };

  // --- Persistent Storage State ---
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('alvernia_employees');
    const wasCleared = localStorage.getItem('alvernia_data_cleared') === 'true';
    if (saved) return JSON.parse(saved);
    // Si los datos fueron limpiados intencionalmente, no recargar los datos de demostración
    return wasCleared ? [] : INITIAL_EMPLOYEES;
  });

  const [novedades, setNovedades] = useState<Novedad[]>(() => {
    const saved = localStorage.getItem('alvernia_novedades');
    const wasCleared = localStorage.getItem('alvernia_data_cleared') === 'true';
    if (saved) return JSON.parse(saved);
    return wasCleared ? [] : INITIAL_NOVEDADES;
  });

  // --- CockroachDB Synchronization State ---
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [dbError, setDbError] = useState<string>('');

  // --- Evaluación Docente State ---
  // Persistencia local como caché; se sincroniza con CockroachDB al iniciar sesión
  const [docentesEvaluacion, setDocentesEvaluacion] = useState<DocenteEvaluacion[]>(() => {
    const saved = localStorage.getItem('alvernia_docentes_evaluacion');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTeacher, setCurrentTeacher] = useState<DocenteEvaluacion | null>(null);
  const [teacherMessagesStatus, setTeacherMessagesStatus] = useState<'none' | 'red' | 'green'>('none');
  const [triggerOpenMessages, setTriggerOpenMessages] = useState(0);

  // Cargar docentes de evaluación desde CockroachDB al iniciar sesión
  const fetchDocentesEvaluacion = async () => {
    try {
      const res = await fetch('/api/docentesEvaluacion');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.docentesEvaluacion)) {
        setDocentesEvaluacion(data.docentesEvaluacion);
        localStorage.setItem('alvernia_docentes_evaluacion', JSON.stringify(data.docentesEvaluacion));
      }
    } catch (err) {
      console.warn('No se pudieron cargar los docentes de evaluación desde el backend:', err);
    }
  };

  const fetchFromDb = async () => {
    setDbSyncStatus('syncing');
    try {
      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      
      if (!empData.success) {
        console.warn('Error fetching employees from CockroachDB:', empData.error);
        setDbSyncStatus('error');
        setDbError(empData.error || empData.message || 'Error de conexión');
        return;
      }

      const novRes = await fetch('/api/novedades');
      const novData = await novRes.json();
      
      if (!novData.success) {
        console.warn('Error fetching novedades from CockroachDB:', novData.error);
        setDbSyncStatus('error');
        setDbError(novData.error || novData.message || 'Error de conexión');
        return;
      }

      setDbSyncStatus('synced');
      setDbError('');

      const mappedEmployees = (empData.employees || []).map(mapDbToEmployee);
      const mappedNovedades = (novData.novedades || []).map(mapDbToNovedad);

      if (mappedEmployees.length > 0 || mappedNovedades.length > 0) {
        setEmployees(mappedEmployees);
        setNovedades(mappedNovedades);
        localStorage.setItem('alvernia_employees', JSON.stringify(mappedEmployees));
        localStorage.setItem('alvernia_novedades', JSON.stringify(mappedNovedades));
      } else {
        // Onboarding seed (solo si los datos NO fueron limpiados intencionalmente)
        const wasCleared = localStorage.getItem('alvernia_data_cleared') === 'true';
        if (wasCleared) {
          setEmployees([]);
          setNovedades([]);
          localStorage.setItem('alvernia_employees', '[]');
          localStorage.setItem('alvernia_novedades', '[]');
          return;
        }

        const currentLocalEmployees = JSON.parse(localStorage.getItem('alvernia_employees') || '[]');
        const currentLocalNovedades = JSON.parse(localStorage.getItem('alvernia_novedades') || '[]');

        const seedEmployees = currentLocalEmployees.length > 0 ? currentLocalEmployees : INITIAL_EMPLOYEES;
        const seedNovedades = currentLocalNovedades.length > 0 ? currentLocalNovedades : INITIAL_NOVEDADES;

        setEmployees(seedEmployees);
        setNovedades(seedNovedades);
        localStorage.setItem('alvernia_employees', JSON.stringify(seedEmployees));
        localStorage.setItem('alvernia_novedades', JSON.stringify(seedNovedades));

        await pushToDb(seedEmployees, seedNovedades);
      }
    } catch (e: any) {
      console.warn('Network error fetching from CockroachDB:', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de red');
    }
  };

  const pushToDb = async (emps: Employee[], novs: Novedad[]) => {
    try {
      if (emps.length > 0) {
        const resEmps = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emps.map(mapEmployeeToDb))
        });
        const dataEmps = await resEmps.json();
        if (!dataEmps.success) throw new Error(dataEmps.error || 'Error al guardar empleados');
      }

      if (novs.length > 0) {
        const resNovs = await fetch('/api/novedades/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novs.map(mapNovedadToDb))
        });
        const dataNovs = await resNovs.json();
        if (!dataNovs.success) throw new Error(dataNovs.error || 'Error al guardar novedades');
      }
      setDbSyncStatus('synced');
      setDbError('');
    } catch (e: any) {
      console.error('Failed seeding to DB', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de escritura');
    }
  };

  useEffect(() => {
    if (userSession) {
      // Background pull from CockroachDB
      fetchFromDb();
      fetchDocentesEvaluacion();
    }
  }, [userSession]);

  // Persistir docentes de evaluación en localStorage
  useEffect(() => {
    localStorage.setItem('alvernia_docentes_evaluacion', JSON.stringify(docentesEvaluacion));
  }, [docentesEvaluacion]);

  // Sync to database
  useEffect(() => {
    localStorage.setItem('alvernia_employees', JSON.stringify(employees));
  }, [employees]);

  const employeesDict = useMemo(() => {
    const dict: Record<string, Employee> = {};
    employees.forEach(e => {
      dict[e.cedula] = e;
    });
    return dict;
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('alvernia_novedades', JSON.stringify(novedades));
  }, [novedades]);

  // --- Google Workspace Integration state ---
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem('alvernia_spreadsheet_id'));
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => localStorage.getItem('alvernia_spreadsheet_url'));
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [autoSyncGoogle, setAutoSyncGoogle] = useState<boolean>(() => localStorage.getItem('alvernia_auto_sync_google') === 'true');
  const [googleStatusMsg, setGoogleStatusMsg] = useState<string | null>(null);

  // Initialize Auth listeners and token refreshes
  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Handle Connecting and Initial Syncing
  const handleConnectAndSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    setGoogleStatusMsg('Iniciando sesión...');
    try {
      const result = await signInWithGoogleWorkspace();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.token);
        
        let checkedId = spreadsheetId;
        let checkedUrl = spreadsheetUrl;
        
        setGoogleStatusMsg('Buscando hoja en tu Drive...');
        const existingId = await findExistingSheet(result.token, 'I.E. Alvernia - Registro de Permisos');
        if (existingId) {
          checkedId = existingId;
          checkedUrl = `https://docs.google.com/spreadsheets/d/${existingId}/edit`;
          setSpreadsheetId(existingId);
          setSpreadsheetUrl(checkedUrl);
          localStorage.setItem('alvernia_spreadsheet_id', existingId);
          localStorage.setItem('alvernia_spreadsheet_url', checkedUrl);
        } else {
          setGoogleStatusMsg('Creando hoja de cálculo en Drive...');
          const newSheet = await createGoogleSheetDatabase(result.token, 'I.E. Alvernia - Registro de Permisos');
          checkedId = newSheet.id;
          checkedUrl = newSheet.url;
          setSpreadsheetId(newSheet.id);
          setSpreadsheetUrl(newSheet.url);
          localStorage.setItem('alvernia_spreadsheet_id', newSheet.id);
          localStorage.setItem('alvernia_spreadsheet_url', newSheet.url);
        }
        
        setGoogleStatusMsg('Enviando datos de permisos...');
        await syncNovedadesToSheet(result.token, checkedId!, novedades, employeesDict);
        setGoogleStatusMsg(null);
        showToast('¡Conectado y sincronizado exitosamente con Google Sheets!');
      }
    } catch (error: any) {
      console.error(error);
      setGoogleStatusMsg(null);
      alert(`Error al establecer sincronización con Google Workspace: ${error.message || error}`);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Handle Manual Synchronizations
  const handleManualSyncGoogle = async () => {
    if (!googleToken || !spreadsheetId) {
      return handleConnectAndSyncGoogle();
    }
    setIsSyncingGoogle(true);
    setGoogleStatusMsg('Actualizando datos...');
    try {
      await syncNovedadesToSheet(googleToken, spreadsheetId, novedades, employeesDict);
      showToast('¡Base de Datos de Google Sheets actualizada con éxito!');
    } catch (error: any) {
      console.error(error);
      if (error.status === 401 || (error.message && error.message.includes('401'))) {
        setGoogleStatusMsg('Token vencido. Re-autenticando...');
        try {
          const result = await signInWithGoogleWorkspace();
          if (result) {
            setGoogleUser(result.user);
            setGoogleToken(result.token);
            await syncNovedadesToSheet(result.token, spreadsheetId, novedades, employeesDict);
            showToast('¡Base de Datos de Google Sheets actualizada con éxito!');
          }
        } catch (e: any) {
          alert('Tu sesión de Google expiró. Por favor haz clic en conectar de nuevo.');
          setGoogleUser(null);
          setGoogleToken(null);
        }
      } else {
        alert(`Error al sincronizar con Google Sheets: ${error.message || error}`);
      }
    } finally {
      setIsSyncingGoogle(false);
      setGoogleStatusMsg(null);
    }
  };

  // Google Sheets Auto-sync listener on register/delete of novedades
  useEffect(() => {
    const runAutoSync = async () => {
      if (autoSyncGoogle && googleToken && spreadsheetId && novedades.length > 0) {
        try {
          await syncNovedadesToSheet(googleToken, spreadsheetId, novedades, employeesDict);
          console.log('Automated sync completed.');
        } catch (err) {
          console.warn('Auto-sync error (token might be expired):', err);
        }
      }
    };
    runAutoSync();
  }, [novedades, autoSyncGoogle, googleToken, spreadsheetId, employeesDict]);

  // Click outside listener for the searchable employee dropdown in the form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.getElementById('search-employee-combobox-container');
      if (container && !container.contains(event.target as Node)) {
        setIsEmployeeSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Active Subview State ---
  const [activeTab, setActiveTab] = useState<'novedades' | 'empleados' | 'reportes' | 'computo' | 'matriculas' | 'certificados' | 'certificadosPama' | 'constancias' | 'configuracion' | 'agenda' | 'consecutivos' | 'evaluacionDocente'>('novedades');

  // --- URL Routing Sync ---
  const location = useLocation();
  const navigate = useNavigate();

  const tabToPath: Record<string, string> = {
    'novedades': '/agenda-permisos',
    'empleados': '/personal',
    'reportes': '/reportes',
    'computo': '/computo',
    'matriculas': '/matriculas',
    'certificados': '/certificados',
    'certificadosPama': '/certificados-pama',
    'constancias': '/constancias',
    'configuracion': '/configuracion',
    'agenda': '/agenda-institucional',
    'consecutivos': '/control-consecutivos',
    'evaluacionDocente': '/evaluacion-docente'
  };

  const pathToTab = Object.fromEntries(Object.entries(tabToPath).map(([k, v]) => [v, k]));

  // 1. URL -> State (on initial load or back/forward button)
  useEffect(() => {
    const currentPath = location.pathname;
    if (pathToTab[currentPath] && pathToTab[currentPath] !== activeTab) {
      setActiveTab(pathToTab[currentPath] as any);
    } else if (currentPath === '/') {
      setActiveTab('novedades');
    }
  }, [location.pathname]);

  // 2. State -> URL (when user clicks a button to change tab)
  useEffect(() => {
    const desiredPath = tabToPath[activeTab] || '/';
    if (location.pathname !== desiredPath) {
      navigate(desiredPath);
    }
  }, [activeTab]);

  // --- Search and Filters State ---
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSedeFilter, setEmployeeSedeFilter] = useState('TODAS');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  const [novedadSearch, setNovedadSearch] = useState('');
  const [novedadSedeFilter, setNovedadSedeFilter] = useState('TODAS');
  const [novedadClaseFilter, setNovedadClaseFilter] = useState('TODAS');

  // --- Employee Registration Form State ---
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [newEmpNombre, setNewEmpNombre] = useState('');
  const [newEmpCedula, setNewEmpCedula] = useState('');
  const [newEmpCargo, setNewEmpCargo] = useState(CARGOS_OPCIONES[9]); // default Docente de aula
  const [newEmpSede, setNewEmpSede] = useState<string>(SEDES_OPCIONES[0]);
  const [newEmpDificil, setNewEmpDificil] = useState<'Si' | 'No'>('No');
  const [newEmpHorasAula, setNewEmpHorasAula] = useState('24');
  const [newEmpHorasLibres, setNewEmpHorasLibres] = useState('16');
  const [newEmpArea, setNewEmpArea] = useState<string>(AREAS_DESEMPENO_OPCIONES[0]);
  const [newEmpNombramiento, setNewEmpNombramiento] = useState<string>(TIPOS_NOMBRAMIENTO_OPCIONES[1]); // default Propiedad
  const [newEmpError, setNewEmpError] = useState<string | null>(null);

  // --- Novedad Registration Form State ---
  const [selectedEmpIdForNovedad, setSelectedEmpIdForNovedad] = useState('');
  const [newNovClase, setNewNovClase] = useState<string>(CLASES_NOVEDADES_OPCIONES[15]); // default Permiso de Adopción or similar
  const [newNovSede, setNewNovSede] = useState<string>(SEDES_OPCIONES[0]);
  
  // Start and End datetime inputs (requires datetime-local format)
  const defaultStartDate = new Date().toISOString().substring(0, 10) + "T07:00";
  const defaultEndDate = new Date().toISOString().substring(0, 10) + "T14:00";
  const [newNovFechaInicio, setNewNovFechaInicio] = useState(defaultStartDate);
  const [newNovFechaFin, setNewNovFechaFin] = useState(defaultEndDate);
  
  const [newNovLaborando, setNewNovLaborando] = useState<'Si' | 'No'>('No');
  const [newNovCarga, setNewNovCarga] = useState<'Si' | 'No'>('Si');
  
  const [newNovDocTipo, setNewNovDocTipo] = useState<'R' | 'D' | 'A' | 'I' | 'P' | 'O' | ''>('P');
  const [newNovDocNo, setNewNovDocNo] = useState('');
  const [newNovDocFecha, setNewNovDocFecha] = useState(new Date().toISOString().substring(0, 10));
  const [newNovObservaciones, setNewNovObservaciones] = useState('');
  const [newNovError, setNewNovError] = useState<string | null>(null);

  // --- Searchable Employee Selector Form State ---
  const [employeeSelectSearch, setEmployeeSelectSearch] = useState('');
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);

  // --- Success Alerts State ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [cleanOptions, setCleanOptions] = useState<Record<string, boolean>>({
    permisos: false,
    matriculas: false,
    certificados: false,
    pama: false,
    constancias: false,
    evaluacion_docente: false,
    docentes_evaluacion: false,
    configuracion: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- Agenda Notification Daemon ---
  useEffect(() => {
    let notifiedEvents = JSON.parse(localStorage.getItem('alvernia_notified_events') || '{}');
    
    const checkAgenda = async () => {
      try {
        const res = await fetch('/api/agenda');
        const data = await res.json();
        if (data.data) {
          const today = new Date().toISOString().split('T')[0];
          data.data.forEach((ev: any) => {
            if (ev.fecha_inicio.startsWith(today) && ev.estado === 'Programada') {
              if (!notifiedEvents[ev.id]) {
                showToast(`📅 Tienes un evento hoy: ${ev.titulo} a las ${new Date(ev.fecha_inicio).toLocaleTimeString()}`);
                notifiedEvents[ev.id] = true;
                localStorage.setItem('alvernia_notified_events', JSON.stringify(notifiedEvents));
              }
            }
          });
        }
      } catch (err) {
        console.error("Error comprobando agenda:", err);
      }
    };

    checkAgenda();
    const interval = setInterval(checkAgenda, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleClearSelectedData = async () => {
    const targets = Object.entries(cleanOptions).filter(([, v]) => v).map(([k]) => k);
    if (targets.length === 0) {
      showToast("⚠️ No ha seleccionado ningún módulo para limpiar.");
      return;
    }

    try {
      await fetch('/api/database/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });

      // Limpiar estado local y localStorage según los módulos seleccionados
      if (cleanOptions.permisos) {
        setEmployees([]);
        setNovedades([]);
        // Guardar array vacío (no eliminar) y marcar como limpiado para evitar recargar datos de demostración
        localStorage.setItem('alvernia_employees', '[]');
        localStorage.setItem('alvernia_novedades', '[]');
        localStorage.setItem('alvernia_data_cleared', 'true');
      }

      if (cleanOptions.docentes_evaluacion) {
        setDocentesEvaluacion([]);
        setCurrentTeacher(null);
        localStorage.setItem('alvernia_docentes_evaluacion', '[]');
      }

      if (cleanOptions.configuracion) {
        const configKeys = [
          'iea_rector_name', 'iea_rector_doc', 'iea_rector_cargo',
          'alvernia_institution_name', 'alvernia_institution_dane', 'alvernia_institution_nit',
          'alvernia_educational_level', 'alvernia_calendario', 'alvernia_footer_motto',
          'alvernia_footer_address', 'alvernia_footer_emails', 'alvernia_footer_website',
          'alvernia_footer_city', 'iea_config_customized', 'iea_custom_logo', 'iea_custom_signature',
          'alvernia_habilitation_dates'
        ];
        configKeys.forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('iea_config_updated'));
      }

      setConfirmResetOpen(false);
      showToast("¡Módulos seleccionados limpiados correctamente! Recargando...");

      // Resetear las selecciones del modal
      setCleanOptions({
        permisos: false, matriculas: false, certificados: false, pama: false,
        constancias: false, evaluacion_docente: false, docentes_evaluacion: false, configuracion: false,
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      console.error('Could not clear DB records:', e);
      showToast("❌ Hubo un error limpiando la base de datos. Intente nuevamente.");
    }
  };

  const toggleCleanOption = (key: string) => {
    setCleanOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllCleanOptions = (value: boolean) => {
    setCleanOptions({
      permisos: value, matriculas: value, certificados: value, pama: value,
      constancias: value, evaluacion_docente: value, docentes_evaluacion: value, configuracion: value,
    });
  };

  const CLEAN_MODULES: { key: string; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'permisos', label: 'Talento Humano y Permisos', desc: 'Funcionarios y novedades', icon: <Users className="w-4 h-4" /> },
    { key: 'matriculas', label: 'Matrículas', desc: 'Registro de estudiantes', icon: <Users2 className="w-4 h-4" /> },
    { key: 'certificados', label: 'Certificados de Grado', desc: 'Certificados generales', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'pama', label: 'Certificados PAMA', desc: 'Acreditaciones PAMA', icon: <Award className="w-4 h-4" /> },
    { key: 'constancias', label: 'Constancias de Estudio', desc: 'Constancias de matrícula', icon: <FilePlus className="w-4 h-4" /> },
    { key: 'evaluacion_docente', label: 'Evaluación Docente 1278', desc: 'Evaluaciones y actas', icon: <Activity className="w-4 h-4" /> },
    { key: 'docentes_evaluacion', label: 'Listado Docentes Evaluación', desc: 'Docentes para ingreso', icon: <User className="w-4 h-4" /> },
    { key: 'configuracion', label: 'Configuración Institucional', desc: 'Datos del plantel y rector', icon: <Settings className="w-4 h-4" /> },
  ];

  // --- Import handler callback ---
  const handleImportCompleted = async (importedEmployees: Employee[], importedNovedades: Novedad[]) => {
    // Al cargar datos reales, permitir que el onboarding seed funcione de nuevo en el futuro
    localStorage.removeItem('alvernia_data_cleared');
    let finalEmployees: Employee[] = [];
    let finalNovedades: Novedad[] = [];

    // Merge strategy: Keep existing, update matching IDs, append new ones
    setEmployees(prev => {
      const merged = [...prev];
      importedEmployees.forEach(newEmp => {
        const foundIdx = merged.findIndex(e => e.cedula === newEmp.cedula);
        if (foundIdx !== -1) {
          merged[foundIdx] = { ...merged[foundIdx], ...newEmp };
        } else {
          merged.push(newEmp);
        }
      });
      finalEmployees = merged;
      return merged;
    });

    setNovedades(prev => {
      const mergedNovedades = [...prev];
      importedNovedades.forEach(newNov => {
        const isDuplicate = mergedNovedades.some(
          n => n.empleadoId === newNov.empleadoId && n.fechaInicio === newNov.fechaInicio
        );
        if (!isDuplicate) {
          mergedNovedades.push(newNov);
        }
      });
      finalNovedades = mergedNovedades;
      return mergedNovedades;
    });

    try {
      await pushToDb(importedEmployees, importedNovedades);
    } catch (e: any) {
      console.warn('Could not save imported excel records to DB:', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de red al importar');
    }

    showToast(`Se han importado exitosamente ${importedEmployees.length} empleados de la base de datos.`);
  };

  // --- Employee operations ---
  const handleToggleEmployeeActive = async (cedula: string) => {
    let updatedEmp: Employee | null = null;
    const nextEmployees = employees.map(emp => {
      if (emp.cedula === cedula) {
        const nextState = !emp.activo;
        updatedEmp = { ...emp, activo: nextState };
        return updatedEmp;
      }
      return emp;
    });

    setEmployees(nextEmployees);

    if (updatedEmp) {
      const targetEmp = updatedEmp as Employee;
      showToast(`Empleado ${targetEmp.nombre} ahora está ${targetEmp.activo ? 'ACTIVO' : 'INHABILITADO'}`);
      try {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([mapEmployeeToDb(targetEmp)])
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de base de datos');
        setDbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not update active state of employee in DB:', e);
        setDbSyncStatus('error');
        setDbError(e.message || 'Error de red al alternar activo');
      }
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewEmpError(null);

    if (!newEmpNombre.trim()) {
      setNewEmpError('Por favor ingrese los nombres y apellidos completos.');
      return;
    }
    if (!newEmpCedula.trim() || isNaN(Number(newEmpCedula))) {
      setNewEmpError('Por favor ingrese un número de cédula válido.');
      return;
    }

    // Check duplication
    if (!editingEmployeeId && employees.some(emp => emp.cedula === newEmpCedula)) {
      setNewEmpError(`Ya existe un empleado registrado con la cédula ${newEmpCedula}.`);
      return;
    }
    if (editingEmployeeId && editingEmployeeId !== newEmpCedula && employees.some(emp => emp.cedula === newEmpCedula)) {
      setNewEmpError(`Ya existe un empleado registrado con la cédula ${newEmpCedula}.`);
      return;
    }

    const existingEmp = editingEmployeeId ? employees.find(e => e.cedula === editingEmployeeId) : null;

    const newEmployee: Employee = {
      id: existingEmp ? existingEmp.id : newEmpCedula,
      nombre: newEmpNombre.trim().toUpperCase(),
      cedula: newEmpCedula.trim(),
      cargo: newEmpCargo,
      sedeTrabajo: newEmpSede,
      dificilAcceso: newEmpDificil,
      horasAula: parseInt(newEmpHorasAula, 10) || 0,
      horasLibres: parseInt(newEmpHorasLibres, 10) || 0,
      areaDesempeno: newEmpArea,
      tipoNombramiento: newEmpNombramiento,
      activo: existingEmp ? existingEmp.activo : true
    };

    if (editingEmployeeId) {
      setEmployees(prev => prev.map(emp => emp.cedula === editingEmployeeId ? newEmployee : emp));
      try {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([mapEmployeeToDb(newEmployee)])
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de base de datos');
        setDbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not update employee in DB:', e);
        setDbSyncStatus('error');
        setDbError(e.message || 'Error de red al actualizar docente');
      }
      showToast(`Se actualizó correctamente al empleado ${newEmployee.nombre}`);
    } else {
      setEmployees(prev => [newEmployee, ...prev]);
      // Al registrar un empleado real, permitir que el onboarding seed funcione de nuevo en el futuro
      localStorage.removeItem('alvernia_data_cleared');

      try {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([mapEmployeeToDb(newEmployee)])
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de base de datos');
        setDbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not insert new employee in DB:', e);
        setDbSyncStatus('error');
        setDbError(e.message || 'Error de red al guardar docente');
      }
      showToast(`Se registró correctamente al empleado ${newEmployee.nombre}`);
    }
    
    // Reset Form
    setNewEmpNombre('');
    setNewEmpCedula('');
    setEditingEmployeeId(null);
    setShowAddEmployeeModal(false);
    
    // Log Audit Action
    logAction(
      editingEmployeeId ? 'EDITAR_EMPLEADO' : 'CREAR_EMPLEADO',
      'EMPLEADOS',
      `Se ${editingEmployeeId ? 'editó' : 'registró'} el empleado ${newEmployee.nombre} (CC: ${newEmployee.cedula})`
    ).catch(console.error);
  };

  const handleDeleteEmployee = async (cedula: string) => {
    if (window.confirm('¿Está completamente seguro de eliminar este empleado? Esto también borrará su historial.')) {
      setEmployees(prev => prev.filter(emp => emp.cedula !== cedula));
      setNovedades(prev => prev.filter(n => n.empleadoId !== cedula));

      try {
        const res = await fetch(`/api/employees/${cedula}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de base de datos');
        setDbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not delete employee and associated novedades from DB:', e);
        setDbSyncStatus('error');
        setDbError(e.message || 'Error de red al borrar docente');
      }

      showToast('Se ha eliminado militarmente el registro del funcionario.');
      
      logAction(
        'ELIMINAR_EMPLEADO',
        'EMPLEADOS',
        `Se eliminó el empleado con cédula ${cedula} y su historial de novedades`
      ).catch(console.error);
    }
  };

  // --- Novedad / Permission operations ---
  const handleAddNovedadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewNovError(null);

    if (!selectedEmpIdForNovedad) {
      setNewNovError('Debe seleccionar el empleado o funcionario que solicita el permiso.');
      return;
    }

    // Check date logic
    if (!newNovFechaInicio || !newNovFechaFin) {
      setNewNovError('Las fechas y horas del permiso son requeridas.');
      return;
    }

    const startMs = new Date(newNovFechaInicio).getTime();
    const endMs = new Date(newNovFechaFin).getTime();

    if (startMs >= endMs) {
      setNewNovError('La fecha y hora de inicio de la novedad debe ser anterior a la fecha y hora de finalización.');
      return;
    }

    const selectedEmployee = employees.find(emp => emp.cedula === selectedEmpIdForNovedad);
    if (!selectedEmployee) {
      setNewNovError('El empleado seleccionado ya no existe en el sistema.');
      return;
    }

    const newNovelty: Novedad = {
      id: `nov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      empleadoId: selectedEmpIdForNovedad,
      claseNovedad: newNovClase,
      sedeNovedad: newNovSede,
      fechaInicio: newNovFechaInicio,
      fechaFin: newNovFechaFin,
      estaLaborandoNormalmente: newNovLaborando,
      seLeAsignoCargaAcademica: newNovCarga,
      documentoSoporteTipo: newNovDocTipo,
      documentoSoporteNo: newNovDocNo.trim() || 'SOP-MANUAL',
      documentoSoporteFecha: newNovDocFecha,
      observaciones: newNovObservaciones.trim()
    };

    setNovedades(prev => [newNovelty, ...prev]);

    try {
      const res = await fetch('/api/novedades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([mapNovedadToDb(newNovelty)])
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error de base de datos');
      setDbSyncStatus('synced');
    } catch (e: any) {
      console.warn('Could not insert new novelty in DB:', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de red al guardar novedad');
    }

    showToast(`Se ha registrado de forma exitosa la novedad: "${newNovelty.claseNovedad}" para ${selectedEmployee.nombre}`);

    // Reset Form fields
    setSelectedEmpIdForNovedad('');
    setEmployeeSelectSearch('');
    setIsEmployeeSelectOpen(false);
    setNewNovDocNo('');
    setNewNovObservaciones('');
  };

  const handleDeleteNovedad = async (id: string) => {
    if (window.confirm('¿Desea suprimir esta novedad? El registro será borrado permanentemente.')) {
      setNovedades(prev => prev.filter(n => n.id !== id));

      try {
        const res = await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de base de datos');
        setDbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not delete novelty from DB:', e);
        setDbSyncStatus('error');
        setDbError(e.message || 'Error de red al borrar novedad');
      }

      showToast('La novedad ha sido eliminada.');
    }
  };

  // --- Computed selections and filters ---

  // Filter employees for the registration form searchable dropdown
  const filteredSelectEmployees = useMemo(() => {
    const query = employeeSelectSearch.toLowerCase().trim();
    if (!query) return employees;
    return employees.filter(emp => {
      return (
        emp.nombre.toLowerCase().includes(query) ||
        emp.cedula.includes(query) ||
        emp.cargo.toLowerCase().includes(query)
      );
    });
  }, [employees, employeeSelectSearch]);

  // Employee directory filter
  const filteredEmployeesList = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.nombre.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          emp.cedula.includes(employeeSearch);
      const matchSede = employeeSedeFilter === 'TODAS' || emp.sedeTrabajo === employeeSedeFilter;
      const matchStatus = employeeStatusFilter === 'TODOS' || 
                           (employeeStatusFilter === 'ACTIVOS' && emp.activo) ||
                           (employeeStatusFilter === 'INACTIVOS' && !emp.activo);

      return matchSearch && matchSede && matchStatus;
    });
  }, [employees, employeeSearch, employeeSedeFilter, employeeStatusFilter]);

  // Novedades list filtered for history view
  const filteredNovedadesList = useMemo(() => {
    return novedades.filter(n => {
      const emp = employeesDict[n.empleadoId];
      const matchSearch = novedadSearch === '' || 
                          (emp && emp.nombre.toLowerCase().includes(novedadSearch.toLowerCase())) ||
                          n.empleadoId.includes(novedadSearch) || 
                          n.claseNovedad.toLowerCase().includes(novedadSearch.toLowerCase()) ||
                          (n.documentoSoporteNo || '').toLowerCase().includes(novedadSearch.toLowerCase());
                          
      const matchSede = novedadSedeFilter === 'TODAS' || n.sedeNovedad === novedadSedeFilter;
      const matchClase = novedadClaseFilter === 'TODAS' || n.claseNovedad === novedadClaseFilter;

      return matchSearch && matchSede && matchClase;
    });
  }, [novedades, novedades, employeesDict, novedadSearch, novedadSedeFilter, novedadClaseFilter]);

  // Quick stats panels (Totals)
  const statsOverview = useMemo(() => {
    const totalEmp = employees.length;
    const activos = employees.filter(e => e.activo).length;
    const inactivos = totalEmp - activos;
    const totalPermisos = novedades.length;
    
    // Calculate current active leaves (where current client time lies between start and end date)
    const nowTime = new Date().getTime();
    const activeToday = novedades.filter(n => {
      const start = new Date(n.fechaInicio).getTime();
      const end = new Date(n.fechaFin).getTime();
      return nowTime >= start && nowTime <= end;
    }).length;

    return {
      totalEmp,
      activos,
      inactivos,
      totalPermisos,
      activeToday
    };
  }, [employees, novedades]);

  // Handle auto-populating novelty Sede based on selected Employee's default Sede
  const handleEmployeeSelectionForNovedad = (cedula: string) => {
    setSelectedEmpIdForNovedad(cedula);
    const emp = employeesDict[cedula];
    if (emp) {
      setNewNovSede(emp.sedeTrabajo);
    }
  };

  const handleTeacherLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const cedula = teacherCedulaLogin.trim();

    try {
      // Si la lista de docentes está vacía, cargarla desde el backend
      let listaDocentes = docentesEvaluacion;
      if (listaDocentes.length === 0) {
        const res = await fetch('/api/docentesEvaluacion');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.docentesEvaluacion)) {
            listaDocentes = data.docentesEvaluacion;
            setDocentesEvaluacion(listaDocentes);
            localStorage.setItem('alvernia_docentes_evaluacion', JSON.stringify(listaDocentes));
          }
        }
      }

      // Check the separate docentesEvaluacion list
      const teacher = listaDocentes.find(d => String(d.cedula) === cedula || String(d.cedula).replace(/\s/g, '') === cedula);
      if (!teacher) {
        setLoginError("No se encontró ningún docente activo con esta cédula en el listado de Evaluación Docente.");
        return;
      }
      setCurrentTeacher(teacher);
      setActiveTab('evaluacionDocente');
      setTeacherCedulaLogin('');
    } catch (err: any) {
      console.error('Error en login de docente:', err);
      setLoginError("Error de conexión al verificar el docente. Intente nuevamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const getSedeFormatted = (s: string) => {
    if (s === 'COL ALVERNIA') return 'COL. ALVERNIA (PRINCIPAL)';
    return s;
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans" id="auth-checking-state">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Comprobando credenciales...</p>
        </div>
      </div>
    );
  }

  if (!userSession && !currentTeacher) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans" id="supabase-login-container">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Auth form card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl relative z-10"
          id="auth-credentials-card"
        >
          {/* Logo brand / Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 border border-slate-800/20 overflow-hidden shrink-0">
              <img 
                src="./logo.png" 
                alt="Logo IEA" 
                className="w-full h-full object-contain p-1.5" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('login-logo-fallback-container');
                  if (fallback) fallback.style.display = 'flex';
                }} 
                referrerPolicy="no-referrer"
              />
              <div id="login-logo-fallback-container" className="hidden w-full h-full bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl items-center justify-center" style={{ display: 'none' }}>
                <School className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">I.E. Alvernia</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Sistema Integrado de Control de Permisos y Matrículas</p>
          </div>

          
          {/* Login Type Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => {
                setIsTeacherLogin(false);
                setLoginError(null);
                setLoginLoading(false);
              }}
              className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all ${!isTeacherLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Administrador
            </button>
            <button
              onClick={() => {
                setIsTeacherLogin(true);
                setLoginError(null);
                setLoginLoading(false);
              }}
              className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all ${isTeacherLogin ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Docentes
            </button>
          </div>

          {!isTeacherLogin ? (
            /* ADMIN LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5" id="auth-form-submission-admin">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="auth-login-error-pill-admin">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="eg. matriculas@alvernia.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="•••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Ingreso Administrador</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TEACHER LOGIN FORM */
            <form onSubmit={handleTeacherLoginSubmit} className="space-y-5" id="auth-form-submission-teacher">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="auth-login-error-pill-teacher">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl mb-4">
                <p className="text-xs text-emerald-400 font-medium text-center">
                  Módulo exclusivo para acceder a tus evaluaciones de desempeño y anexos.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Número de Cédula</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1002345678"
                    value={teacherCedulaLogin}
                    onChange={(e) => setTeacherCedulaLogin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Ingreso Docentes</span>
                  </>
                )}
              </button>
            </form>
          )}


          {/* Prompt footer info */}
          <div className="text-center mt-6 border-t border-slate-800 pt-4">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Este es un sistema institucional privado. El acceso está restringido únicamente a usuarios autorizados de la Institución Educativa Alvernia.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans antialiased text-slate-800" id="main-app-container" style={{height: '100dvh'}}>
      
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-slate-900 text-white shadow-xl py-3 px-5 rounded-xl border border-slate-750 flex items-center gap-3 max-w-sm"
            id="app-toast-alert"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Sidebar Navigation --- */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 h-full hidden lg:flex" id="sleek-sidebar">
        {/* Branding header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center shadow-md border border-slate-700/50 overflow-hidden shrink-0">
            <img 
              src="./logo.png" 
              alt="Logo IEA" 
              className="w-full h-full object-contain p-0.5" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('sidebar-brand-text-fallback');
                if (fallback) fallback.style.display = 'block';
              }} 
              referrerPolicy="no-referrer"
            />
            <span id="sidebar-brand-text-fallback" className="hidden text-white font-black text-xs uppercase" style={{ display: 'none' }}>IEA</span>
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm leading-none uppercase tracking-wider">{appTitle}</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-wider">{appBrandName}</p>
          </div>
        </div>

        
        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar-tab-navigation">
          {currentTeacher ? (
            /* TEACHER PORTAL SIDEBAR NAVIGATION */
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                  Mi Evaluación
                </p>
              </div>

              <button
                onClick={() => setActiveTab('evaluacionDocente')}
                className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                  activeTab === 'evaluacionDocente'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-evaluacion-sidebar-teacher"
              >
                <Award className="w-4 h-4 shrink-0 text-blue-400" />
                Mis Anexos 2 y 5
              </button>

              <button
                onClick={() => {
                  setActiveTab('evaluacionDocente');
                  setTriggerOpenMessages(prev => prev + 1);
                }}
                className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                  teacherMessagesStatus === 'red'
                    ? 'bg-rose-50 border border-rose-200 text-rose-600 shadow-md shadow-rose-600/10'
                    : teacherMessagesStatus === 'green'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-md shadow-emerald-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-mensajes-sidebar-teacher"
              >
                <AlertCircle className={`w-4 h-4 shrink-0 ${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}`} />
                Retroalimentación
              </button>
            </>
          ) : (
            /* ADMINISTRATOR SIDEBAR NAVIGATION */
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                  Herramientas Institucionales
                </p>
              </div>

              {hasPermission('AGENDA_INSTITUCIONAL') && (
                <button
                  onClick={() => setActiveTab("agenda")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "agenda"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  Agenda Institucional
                </button>
              )}

              {hasPermission('CONSECUTIVOS') && (
                <button
                  onClick={() => setActiveTab("consecutivos")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "consecutivos"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  Control Consecutivos
                </button>
              )}
              
              <div className="pt-3 pb-1 border-t border-slate-700/50 mt-2">
                <p className="px-4 text-[9px] font-extrabold text-blue-400 uppercase tracking-widest leading-none">
                  Gestión Administrativa
                </p>
              </div>

              {hasPermission('NOVEDADES') && (
                <button
                  onClick={() => setActiveTab('novedades')}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === 'novedades'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  id="tab-btn-novedades-sidebar"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  Agenda de Permisos
                </button>
              )}

              {hasPermission('EMPLEADOS') && (
                <button
                  onClick={() => setActiveTab('empleados')}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === 'empleados'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  id="tab-btn-empleados-sidebar"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Personal y Carga (Excel)
                </button>
              )}

              {hasPermission('COMPUTO') && (
                <button
                  onClick={() => setActiveTab('computo')}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === 'computo'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  id="tab-btn-computo-sidebar"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  Cómputo Absoluto
                </button>
              )}

              {hasPermission('REPORTES') && (
                <button
                  onClick={() => setActiveTab('reportes')}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === 'reportes'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  id="tab-btn-reportes-sidebar"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  Reportes Generales
                </button>
              )}

              <div className="pt-3 pb-1 border-t border-slate-700/50 mt-2">
                <p className="px-4 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none">
                  Gestión Académica
                </p>
              </div>
              
              {hasPermission('MATRICULAS') && (
                <button
                  onClick={() => setActiveTab("matriculas")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "matriculas"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  id="tab-btn-matriculas-sidebar"
                >
                  <School className="w-4 h-4 shrink-0" />
                  Control de Matrículas
                </button>
              )}
              
              {hasPermission('CERTIFICADOS') && (
                <button
                  onClick={() => setActiveTab("certificados")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "certificados"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  id="tab-btn-certificados-sidebar"
                >
                  <FileCheck className="w-4 h-4 shrink-0" />
                  Certificados Generales
                </button>
              )}

              {hasPermission('CERTIFICADOS_PAMA') && (
                <button
                  onClick={() => setActiveTab("certificadosPama")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "certificadosPama"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  id="tab-btn-certificadospama-sidebar"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  Certificados PAMA
                </button>
              )}

              {hasPermission('CONSTANCIAS') && (
                <button
                  onClick={() => setActiveTab("constancias")}
                  className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                    activeTab === "constancias"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  id="tab-btn-constancias-sidebar"
                >
                  <FilePlus className="w-4 h-4 shrink-0" />
                  Constancias de Estudio
                </button>
              )}

              {hasPermission('EVALUACION') && (
                <>
                  <div className="pt-3 pb-1 border-t border-slate-700/50 mt-2">
                    <p className="px-4 text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest leading-none">
                      Evaluación Docente
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("evaluacionDocente")}
                    className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                      activeTab === "evaluacionDocente"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-btn-evaluacion-sidebar"
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    Evaluación Docente 1278
                  </button>
                </>
              )}

              {hasPermission('CONFIGURACION') && (
                <>
                  <div className="pt-3 pb-1 border-t border-slate-700/50 mt-2">
                    <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                      Gestión del Sistema
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("configuracion")}
                    className={`w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-[11px] text-left uppercase tracking-wider ${
                      activeTab === "configuracion"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-btn-configuracion-sidebar"
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    Configuración General
                  </button>
                </>
              )}
            </>
          )}
        </nav>


        {/* Sidebar profile footer with logout */}
        <div className="px-4 pt-3 pb-5 border-t border-slate-800 shrink-0" id="sidebar-profile-footer">
          <div className="flex items-center justify-between gap-2 p-1">
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-550/30 flex items-center justify-center text-blue-300 font-bold text-xs uppercase shrink-0">
                {userSession?.user?.email?.slice(0, 2) || 'AV'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">I.E. Alvernia</p>
                <p className="text-[11px] text-slate-300 font-semibold truncate" title={userSession?.user?.email}>
                  {userSession?.user?.email || 'Administrador'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-all shrink-0"
              title="Cerrar sesión"
              id="sidebar-logout-button"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Right Workspace Panel --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="workspace-main-panel">
        
        {/* Sleek Top Header Banner */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0" id="top-header">
          <div className="flex items-center gap-3">
            {/* Mobile Header elements */}
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center lg:hidden shrink-0 shadow-sm">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900" id="header-selected-title">
                {activeTab === 'novedades' && 'Agenda y Registro de Permisos de Empleados'}
                {activeTab === 'empleados' && 'Planilla General de Talento Humano'}
                {activeTab === 'computo' && 'Módulo de Cómputo de Días de Permiso por Docente'}
                {activeTab === 'reportes' && 'Panel Consolidado y Exportaciones de Novedades'}
                {activeTab === 'matriculas' && 'Control General de Matrículas Escolares (Supabase)'}
                {activeTab === 'certificados' && 'Certificados y Calificaciones Finales de Grado (Supabase)'}
                {activeTab === 'certificadosPama' && 'Programa de Alimentación y Matrícula Académica PAMA (Supabase)'}
                {activeTab === 'constancias' && 'Constancias y Certificados de Matrícula Vigentes (Supabase)'}
                {activeTab === 'configuracion' && 'Ajustes Generales y Configuración del Sistema'}
              </h2>
              <p className="text-xs text-slate-550 uppercase tracking-wider font-bold lg:block hidden">
                Institución Educativa Alvernia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap" id="header-date-and-actions">
            {/* Quick date display */}
            <div className="border border-slate-200 bg-slate-50 border-r-4 border-r-blue-500 rounded px-3 py-1.5 text-[11px] font-mono font-semibold text-slate-650 flex items-center gap-1.5 h-[34px]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{new Date().toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Mobile Logout option */}
            <button
              onClick={handleLogout}
              className="lg:hidden flex items-center justify-center p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg cursor-pointer transition-all h-[34px]"
              title="Cerrar sesión"
              id="mobile-logout-button"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-500" />
            </button>

            {/* Mobile Navigation tab options row */}
            <div className="flex lg:hidden gap-1 flex-wrap" id="mobile-tab-navigation">
              {hasPermission('NOVEDADES') && (
                <button
                  onClick={() => setActiveTab('novedades')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'novedades' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Agenda
                </button>
              )}
              {hasPermission('EMPLEADOS') && (
                <button
                  onClick={() => setActiveTab('empleados')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'empleados' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Personal
                </button>
              )}
              {hasPermission('COMPUTO') && (
                <button
                  onClick={() => setActiveTab('computo')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'computo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Cómputo
                </button>
              )}
              {hasPermission('REPORTES') && (
                <button
                  onClick={() => setActiveTab('reportes')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'reportes' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Reportes
                </button>
              )}
              {hasPermission('MATRICULAS') && (
                <button
                  onClick={() => setActiveTab('matriculas')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'matriculas' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Matrículas
                </button>
              )}
              {hasPermission('CERTIFICADOS') && (
                <button
                  onClick={() => setActiveTab('certificados')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'certificados' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Certificados
                </button>
              )}
              {hasPermission('CERTIFICADOS_PAMA') && (
                <button
                  onClick={() => setActiveTab('certificadosPama')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'certificadosPama' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  PAMA
                </button>
              )}
              {hasPermission('CONSTANCIAS') && (
                <button
                  onClick={() => setActiveTab('constancias')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'constancias' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Constancias
                </button>
              )}
              {hasPermission('AGENDA_INSTITUCIONAL') && (
                <button
                  onClick={() => setActiveTab('agenda')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'agenda' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Agenda
                </button>
              )}
              {hasPermission('CONSECUTIVOS') && (
                <button
                  onClick={() => setActiveTab('consecutivos')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'consecutivos' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Consecutivos
                </button>
              )}
              {hasPermission('CONFIGURACION') && (
                <button
                  onClick={() => setActiveTab('configuracion')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    activeTab === 'configuracion' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                  } cursor-pointer`}
                >
                  Configuración
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body container with scroll */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" id="workspace-dynamic-content">
          
          


          {/* KPI Cards section - solo para administrador */}
          {!currentTeacher && !['matriculas', 'certificados', 'certificadosPama', 'constancias', 'configuracion', 'consecutivos', 'agenda'].includes(activeTab) && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-row">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-650 shrink-0">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{statsOverview.activos}</p>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Funcionarios Activos</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-650 shrink-0">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{statsOverview.inactivos}</p>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Personal Inhabilitado</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{statsOverview.totalPermisos}</p>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Historial Novedades</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{statsOverview.activeToday}</p>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Permisos Activos Hoy</p>
                </div>
              </div>
            </section>
          )}

          {/* Active Layout view viewport */}
          <div className="space-y-6" id="tabs-rendering-viewport">
          
          {/* ==================== TAB 1: NOVEDADES Y PERMISOS ==================== */}
          {activeTab === 'novedades' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              id="novedades-tab-grid"
            >
              
              {/* Form Side - Register new leave */}
              <div className="space-y-6 lg:col-span-1" id="novedad-form-wrapper">
                


                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="form-card">
                  <div className="flex items-center gap-2 mb-4">
                    <FilePlus className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-base">Registrar Nuevo Permiso / Novedad</h3>
                  </div>

                  <form onSubmit={handleAddNovedadSubmit} className="space-y-4" id="form-register-novedad">
                    
                    {/* Select Employee (Searchable Autocomplete Combobox) */}
                    <div className="space-y-1.5" id="form-field-employee">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Docente / Funcionario de Alvernia <span className="text-red-500">*</span>
                      </label>
                      
                      {selectedEmpIdForNovedad && employeesDict[selectedEmpIdForNovedad] ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-150 rounded-xl shadow-xs" id="selected-employee-card">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                              {employeesDict[selectedEmpIdForNovedad].nombre.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-xs truncate uppercase leading-tight">
                                {employeesDict[selectedEmpIdForNovedad].nombre}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                C.C. {employeesDict[selectedEmpIdForNovedad].cedula} • {employeesDict[selectedEmpIdForNovedad].cargo}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleEmployeeSelectionForNovedad('');
                              setEmployeeSelectSearch('');
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0 focus:outline-none"
                            title="Cambiar funcionario"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div id="search-employee-combobox-container" className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Buscar por Nombre, Apellidos o Cédula..."
                              value={employeeSelectSearch}
                              onFocus={() => setIsEmployeeSelectOpen(true)}
                              onChange={(e) => {
                                setEmployeeSelectSearch(e.target.value);
                                setIsEmployeeSelectOpen(true);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
                              id="combobox-search-input"
                            />
                            {employeeSelectSearch && (
                              <button
                                type="button"
                                onClick={() => setEmployeeSelectSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 focus:outline-none p-0.5 hover:bg-slate-200/50 rounded-full"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Options dropdown */}
                          <AnimatePresence>
                            {isEmployeeSelectOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50"
                                id="combobox-options-dropdown"
                              >
                                <div className="max-h-60 overflow-y-auto" id="combobox-scroll-area">
                                  {filteredSelectEmployees.length === 0 ? (
                                    <div className="p-4 text-center text-slate-450 text-xs">
                                      No se encontraron funcionarios coincidentes
                                    </div>
                                  ) : (
                                    filteredSelectEmployees.map(emp => {
                                      const isActivo = emp.activo;
                                      return (
                                        <button
                                          key={emp.cedula}
                                          type="button"
                                          disabled={!isActivo}
                                          onClick={() => {
                                            handleEmployeeSelectionForNovedad(emp.cedula);
                                            setIsEmployeeSelectOpen(false);
                                          }}
                                          className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors focus:outline-none ${
                                            isActivo 
                                              ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' 
                                              : 'bg-slate-50/50 opacity-40 cursor-not-allowed'
                                          }`}
                                        >
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                            isActivo ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                                          }`}>
                                            {emp.nombre.charAt(0)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 text-xs truncate uppercase leading-tight">
                                              {emp.nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-450 font-medium truncate mt-0.5">
                                              C.C. {emp.cedula} • {emp.cargo} {!isActivo && ' (INHABILITADO)'}
                                            </p>
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Auto fields displaying position info of selected employee */}
                    {selectedEmpIdForNovedad && employeesDict[selectedEmpIdForNovedad] && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-600" id="form-novedad-emp-metadata">
                        <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> <strong>Cargo:</strong> <span className="truncate">{employeesDict[selectedEmpIdForNovedad].cargo}</span></div>
                        <div className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-slate-400" /> <strong>Sede Ordinaria:</strong> <span>{getSedeFormatted(employeesDict[selectedEmpIdForNovedad].sedeTrabajo)}</span></div>
                        <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-slate-400" /> <strong>Área de Desempeño:</strong> <span>{employeesDict[selectedEmpIdForNovedad].areaDesempeno}</span></div>
                      </div>
                    )}

                    {/* Sede where novelty happened */}
                    <div className="space-y-1.5" id="form-field-sede-novedad">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Sede donde se presenta la Novedad <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newNovSede}
                        onChange={(e) => setNewNovSede(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        id="form-novedad-sede"
                      >
                        {SEDES_OPCIONES.map(s => (
                          <option key={s} value={s}>{getSedeFormatted(s)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Type of Leave */}
                    <div className="space-y-1.5" id="form-field-clase-novedad">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Clase de Novedad (Selección Obligatoria) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newNovClase}
                        onChange={(e) => setNewNovClase(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 max-h-32"
                        id="form-novedad-clase"
                      >
                        {CLASES_NOVEDADES_OPCIONES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date and hour range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="form-field-time-range">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Inicio del Permiso <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newNovFechaInicio}
                          onChange={(e) => setNewNovFechaInicio(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-fecha-inicio"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Finalización del Permiso <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newNovFechaFin}
                          onChange={(e) => setNewNovFechaFin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-fecha-fin"
                        />
                      </div>
                    </div>

                    {/* Obligatory novelty parameters */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3" id="form-field-flags">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block truncate" title="¿Está laborando normalmente?">
                          ¿Laborando normalmente?
                        </label>
                        <select
                           value={newNovLaborando}
                           onChange={(e) => setNewNovLaborando(e.target.value as 'Si' | 'No')}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                           id="form-novedad-laborando"
                        >
                          <option value="No">No</option>
                          <option value="Si">Si (Sí)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block truncate" title="¿Se le asignó carga académica?">
                          ¿Asignó carga académica?
                        </label>
                        <select
                          value={newNovCarga}
                          onChange={(e) => setNewNovCarga(e.target.value as 'Si' | 'No')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-carga-academica"
                        >
                          <option value="Si">Sí (Si)</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Support document data */}
                    <div className="border-t border-slate-100 pt-3 space-y-3" id="form-field-support">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Documento que lo Soporta
                        </label>
                        <select
                          value={newNovDocTipo}
                          onChange={(e) => setNewNovDocTipo(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-doc-tipo"
                        >
                          <option value="">-- Sin soporte doc especificado --</option>
                          {DOCUMENTOS_SOPORTE_OPCIONES.map(opt => (
                            <option key={opt.clave} value={opt.clave}>{opt.descripcion}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-500 block">
                            Núm de Radicado / Soporte
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: R-045 o INC-8821"
                            value={newNovDocNo}
                            onChange={(e) => setNewNovDocNo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            id="form-novedad-doc-no"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-500 block">
                            Fecha de Expedición
                          </label>
                          <input
                            type="date"
                            value={newNovDocFecha}
                            onChange={(e) => setNewNovDocFecha(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            id="form-novedad-doc-fecha"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observaciones extra comments */}
                    <div className="space-y-1.5" id="form-field-comments">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Observaciones y Detalles del Permiso
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Escriba aquí destalles del permiso o reemplazos del docente..."
                        value={newNovObservaciones}
                        onChange={(e) => setNewNovObservaciones(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                        id="form-novedad-observaciones"
                      />
                    </div>

                    {newNovError && (
                      <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs flex items-start gap-2" id="new-novedad-error-banner">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{newNovError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      id="form-submit-novedad"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Novedad en Agenda
                    </button>

                  </form>
                </div>
              </div>

              {/* View/Listing Table Side - History & Search */}
              <div className="space-y-6 lg:col-span-2" id="novedades-history-ledger-wrapper">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="ledger-card">
                  
                  {/* Ledger Header & Search Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-base" id="history-box-title">Historial de Novedades y Permisos</h3>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                        {filteredNovedadesList.length} registros filtrados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="ledger-search-row">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar por Docente, CC, Radicado..."
                          value={novedadSearch}
                          onChange={(e) => setNovedadSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                          id="search-novedad-input"
                        />
                      </div>

                      <div>
                        <select
                          value={novedadSedeFilter}
                          onChange={(e) => setNovedadSedeFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                          id="filter-novedad-sede"
                        >
                          <option value="TODAS">TODAS LAS SEDES</option>
                          {SEDES_OPCIONES.map(s => (
                            <option key={s} value={s}>{getSedeFormatted(s)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={novedadClaseFilter}
                          onChange={(e) => setNovedadClaseFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px] truncate"
                          id="filter-novedad-clase"
                        >
                          <option value="TODAS">TODAS LAS NOVEDADES</option>
                          {CLASES_NOVEDADES_OPCIONES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  {filteredNovedadesList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl" id="ledger-empty-state">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm text-slate-600">No se encontraron registros de novedades</p>
                      <p className="text-xs text-slate-400">Modifica los filtros o registra un nuevo permiso en el formulario.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl" id="ledger-table-container">
                      <table className="w-full text-left border-collapse text-xs" id="table-ledger">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                            <th className="p-3">Docente / Servidor</th>
                            <th className="p-3">Sede</th>
                            <th className="p-3">Novedad</th>
                            <th className="p-3">Inicio / Fin del Permiso</th>
                            <th className="p-3">Soporte</th>
                            <th className="p-3 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredNovedadesList.map((nov) => {
                            const emp = employeesDict[nov.empleadoId];
                            const docSopOption = nov.documentoSoporteTipo ? DOCUMENTOS_SOPORTE_OPCIONES.find(o => o.clave === nov.documentoSoporteTipo) : null;
                            const isCurrentActive = new Date().getTime() >= new Date(nov.fechaInicio).getTime() && new Date().getTime() <= new Date(nov.fechaFin).getTime();

                            return (
                              <tr key={nov.id} className={`hover:bg-slate-50/50 ${isCurrentActive ? 'bg-amber-50/35 border-l-4 border-l-amber-500' : ''}`}>
                                <td className="p-3">
                                  {emp ? (
                                    <div>
                                      <p className="font-bold text-slate-900 group-hover:underline">{emp.nombre}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">CC {emp.cedula} • {emp.cargo.substring(0, 30)}...</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-bold text-rose-700">Funcionario Borrado</p>
                                      <p className="text-[10px] text-slate-400 font-mono">ID {nov.empleadoId}</p>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold">{getSedeFormatted(nov.sedeNovedad)}</span>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium text-amber-900 leading-tight">{nov.claseNovedad}</p>
                                  {nov.observaciones && <p className="text-[10px] text-slate-400 max-w-[180px] truncate" title={nov.observaciones}>Obs: {nov.observaciones}</p>}
                                </td>
                                <td className="p-3">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] flex items-center gap-1 text-slate-650">
                                      <span className="font-bold text-blue-750">Desde:</span> {nov.fechaInicio.replace('T', ' ')}
                                    </div>
                                    <div className="text-[10px] flex items-center gap-1 text-slate-650">
                                      <span className="font-bold text-rose-700">Hasta:</span> {nov.fechaFin.replace('T', ' ')}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {nov.documentoSoporteTipo ? (
                                    <div>
                                      <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        {nov.documentoSoporteTipo}
                                      </span>
                                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{nov.documentoSoporteNo}</p>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">Sin adjunto</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteNovedad(nov.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar permiso"
                                    id={`btn-del-nov-${nov.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== TAB 2: GESTION DE EMPLEADOS (PERSONAL) ==================== */}
          {activeTab === 'empleados' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
              id="empleados-tab-view"
            >
              
              {/* Excel Importer Box Area */}
              <ExcelImporter onImportCompleted={handleImportCompleted} />

              {/* Advanced search and listings segment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="directory-card">
                
                {/* Search control bars */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6" id="directory-search-header">
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-base" id="directory-label">Directorios de Empleados Institucionales</h3>
                    <p className="text-xs text-slate-400">Total de {filteredEmployeesList.length} funcionarios visibles en los criterios de búsqueda.</p>
                  </div>

                  <div className="flex flex-wrap gap-2" id="directory-control-blocks">
                    
                    {/* Add manual employee trigger */}
                    <button
                      onClick={() => {
                        setEditingEmployeeId(null);
                        setNewEmpNombre('');
                        setNewEmpCedula('');
                        setNewEmpCargo(CARGOS_OPCIONES[9]);
                        setNewEmpSede(SEDES_OPCIONES[0]);
                        setNewEmpDificil('No');
                        setNewEmpHorasAula('24');
                        setNewEmpHorasLibres('16');
                        setNewEmpArea(AREAS_DESEMPENO_OPCIONES[0]);
                        setNewEmpNombramiento(TIPOS_NOMBRAMIENTO_OPCIONES[1]);
                        setShowAddEmployeeModal(true);
                      }}
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-colors font-bold text-xs shadow-sm cursor-pointer"
                      id="btn-trigger-add-manual-employee animate-pulse"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Funcionario Manual
                    </button>

                    {/* Clear app data action trigger */}
                    <button
                      onClick={() => setConfirmResetOpen(true)}
                      className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-xs border border-red-200 shadow-sm cursor-pointer"
                      id="btn-trigger-reset-app-data"
                      title="Eliminar todos los datos para cargar registros reales"
                    >
                      <Trash2 className="w-4 h-4 text-red-650" />
                      Limpiar Base de Datos
                    </button>

                  </div>

                </div>

                {/* Sub row search boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" id="directory-secondary-filter-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por Nombre y Apellido o Cédula..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                      id="search-emp-input"
                    />
                  </div>

                  <div>
                    <select
                      value={employeeSedeFilter}
                      onChange={(e) => setEmployeeSedeFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                      id="filter-emp-sede"
                    >
                      <option value="TODAS">TODAS LAS SEDES DE TRABAJO</option>
                      {SEDES_OPCIONES.map(s => (
                        <option key={s} value={s}>{getSedeFormatted(s)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={employeeStatusFilter}
                      onChange={(e) => setEmployeeStatusFilter(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                      id="filter-emp-status"
                    >
                      <option value="TODOS">TODOS LOS ESTADOS DE ASISTENCIA</option>
                      <option value="ACTIVOS">FUNCIONARIOS ACTIVOS (LA&zwnj;BORANDO)</option>
                      <option value="INACTIVOS">FUNCIONARIOS INHABILITADOS (RETIRADOS)</option>
                    </select>
                  </div>
                </div>

                {/* Manual employee insertion modal/form widget */}
                <AnimatePresence>
                  {showAddEmployeeModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 border border-slate-150 rounded-xl p-5 mb-6 space-y-4 shadow-inner overflow-hidden"
                      id="modal-add-employee"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">{editingEmployeeId ? 'Edición de Funcionario' : 'Formulario de Registro Manual de Nuevo Empleado'}</h4>
                        <button 
                          onClick={() => {
                            setShowAddEmployeeModal(false);
                            setEditingEmployeeId(null);
                          }}
                          className="text-xs bg-slate-200 hover:bg-slate-350 px-2 py-1 rounded text-slate-650 cursor-pointer font-bold"
                        >
                          Cerrar Formulario
                        </button>
                      </div>

                      <form onSubmit={handleAddEmployeeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4" id="form-add-emp">
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Nombres y Apellidos Completos *</label>
                          <input
                            type="text"
                            placeholder="Ej: ALBA GÓMEZ ROJAS"
                            value={newEmpNombre}
                            onChange={(e) => setNewEmpNombre(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-nombre"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Cédula del Funcionario (Único) *</label>
                          <input
                            type="text"
                            placeholder="Ej: 1085223405"
                            value={newEmpCedula}
                            onChange={(e) => setNewEmpCedula(e.target.value)}
                            disabled={!!editingEmployeeId}
                            className={`bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500 ${editingEmployeeId ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                            id="field-emp-cedula"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Cargo Administrativo / Docente *</label>
                          <select
                            value={newEmpCargo}
                            onChange={(e) => setNewEmpCargo(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-cargo"
                          >
                            {CARGOS_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Sede de Trabajo Ordinario *</label>
                          <select
                            value={newEmpSede}
                            onChange={(e) => setNewEmpSede(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-sede"
                          >
                            {SEDES_OPCIONES.map(s => (
                              <option key={s} value={s}>{getSedeFormatted(s)}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block text-ellipsis overflow-hidden">H/A (Horas Aula)</label>
                            <input
                              type="number"
                              value={newEmpHorasAula}
                              onChange={(e) => setNewEmpHorasAula(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                              id="field-emp-ha"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block text-ellipsis overflow-hidden">H/L (Horas Libres)</label>
                            <input
                              type="number"
                              value={newEmpHorasLibres}
                              onChange={(e) => setNewEmpHorasLibres(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                              id="field-emp-hl"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Área de Desempeño Escolar *</label>
                          <select
                            value={newEmpArea}
                            onChange={(e) => setNewEmpArea(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-area"
                          >
                            {AREAS_DESEMPENO_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Tipo Nombramiento *</label>
                          <select
                            value={newEmpNombramiento}
                            onChange={(e) => setNewEmpNombramiento(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-nombramiento"
                          >
                            {TIPOS_NOMBRAMIENTO_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">¿Es Zona de Difícil Acceso? *</label>
                          <select
                            value={newEmpDificil}
                            onChange={(e) => setNewEmpDificil(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-dificil"
                          >
                            <option value="No">No</option>
                            <option value="Si">Sí (Zona de Difícil Acceso)</option>
                          </select>
                        </div>

                        <div className="flex items-end justify-end h-full" id="field-emp-btn-row">
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow shadow-blue-700 font-bold flex items-center justify-center gap-1 cursor-pointer"
                            id="btn-apply-add-emp"
                          >
                            <Plus className="w-3.5 h-3.5" /> {editingEmployeeId ? 'Guardar Cambios' : 'Guardar Nuevo Funcionario'}
                          </button>
                        </div>

                        {newEmpError && (
                          <div className="col-span-1 md:col-span-3 p-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs" id="add-emp-error-alert">
                            {newEmpError}
                          </div>
                        )}

                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Directory data list */}
                {filteredEmployeesList.length === 0 ? (
                  <div className="py-12 border border-dashed border-slate-150 text-slate-400 text-center rounded-xl" id="directory-empty-state">
                    <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No se encontraron funcionarios</p>
                    <p className="text-xs text-slate-400">Intenta buscando con palabras clave o haz clic en "Registrar Funcionario Manual" para agregar uno nuevo.</p>
                  </div>
                ) : (
                  <div className="space-y-2" id="directory-employees-grid">
                    {filteredEmployeesList.map((emp) => {
                      const totalNovedadesCount = novedades.filter(n => n.empleadoId === emp.cedula).length;

                      return (
                        <div 
                          key={emp.cedula} 
                          className={`px-4 py-3 rounded-xl border transition-all flex flex-col lg:grid lg:grid-cols-12 lg:gap-4 items-stretch lg:items-center ${
                            emp.activo 
                              ? 'bg-white border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-xs' 
                              : 'bg-slate-50 border-slate-100 opacity-80'
                          }`}
                          id={`employee-card-${emp.cedula}`}
                        >
                          {/* Col 1: Identification & Status */}
                          <div className="lg:col-span-3 flex flex-col gap-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
                                emp.activo 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/70' 
                                  : 'bg-slate-150 text-slate-600 border border-slate-250/70'
                              }`}>
                                {emp.activo ? 'Laborando normalmente' : 'Inhabilitado / Retirado'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-850 text-sm tracking-tight mt-0.5 truncate" title={emp.nombre}>{emp.nombre}</h4>
                            <span className="font-mono text-[10px] text-slate-400">CC. {emp.cedula}</span>
                          </div>

                          {/* Col 2: Cargo & Sede */}
                          <div className="lg:col-span-3 flex flex-col gap-0.5 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100/60 pr-2">
                            <div className="truncate">
                              <span className="text-[10px] text-slate-400 font-mono inline-block w-12">Cargo:</span>
                              <span className="text-xs font-semibold text-slate-700 inline-block truncate max-w-[190px]" title={emp.cargo}>{emp.cargo}</span>
                            </div>
                            <div className="truncate">
                              <span className="text-[10px] text-slate-400 font-mono inline-block w-12">Sede:</span>
                              <span className="text-xs font-bold text-slate-800" title={getSedeFormatted(emp.sedeTrabajo)}>
                                {getSedeFormatted(emp.sedeTrabajo)}
                              </span>
                            </div>
                          </div>

                          {/* Col 3: Área, Nombramiento & Hours */}
                          <div className="lg:col-span-3 flex flex-col gap-1 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100/60 pr-2">
                            <div className="flex items-center gap-x-3 text-xs">
                              <div className="truncate flex-1">
                                <span className="text-[10px] text-slate-400 font-mono">Área: </span>
                                <span className="text-zinc-650 font-medium truncate inline-block max-w-[100px]" title={emp.areaDesempeno}>{emp.areaDesempeno}</span>
                              </div>
                              <div className="truncate shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">Nomb.: </span>
                                <span className="text-cyan-800 font-bold">{emp.tipoNombramiento}</span>
                              </div>
                            </div>
                            <div className="text-[10px] flex items-center flex-wrap gap-1.5 text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">Aula: {emp.horasAula}h</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">Libres: {emp.horasLibres}h</span>
                              {emp.dificilAcceso === 'Si' && (
                                <span className="bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded border border-orange-100 leading-none text-[9px]">
                                  Difícil Acceso
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Col 4: Novedades and Controls */}
                          <div className="lg:col-span-3 flex flex-row lg:flex-cols items-center lg:justify-between justify-between gap-2 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100/60">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 shrink-0">
                              <Activity className="w-3.5 h-3.5 text-blue-600" />
                              Novedades: <span className="text-slate-800 font-black">{totalNovedadesCount}</span>
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Inactivate Toggle Trigger Button */}
                              <button
                                onClick={() => handleToggleEmployeeActive(emp.cedula)}
                                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border shrink-0 ${
                                  emp.activo
                                    ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/70 text-rose-700'
                                    : 'bg-blue-50 border-blue-100 hover:bg-blue-100/70 text-blue-700'
                                }`}
                                id={`toggle-active-btn-${emp.cedula}`}
                              >
                                {emp.activo ? 'Inhabilitar' : 'Habilitar'}
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => {
                                  setEditingEmployeeId(emp.cedula);
                                  setNewEmpNombre(emp.nombre);
                                  setNewEmpCedula(emp.cedula);
                                  setNewEmpCargo(emp.cargo);
                                  setNewEmpSede(emp.sedeTrabajo);
                                  setNewEmpDificil(emp.dificilAcceso);
                                  setNewEmpHorasAula(emp.horasAula.toString());
                                  setNewEmpHorasLibres(emp.horasLibres.toString());
                                  setNewEmpArea(emp.areaDesempeno);
                                  setNewEmpNombramiento(emp.tipoNombramiento);
                                  setShowAddEmployeeModal(true);
                                  setTimeout(() => {
                                    document.getElementById('modal-add-employee')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                }}
                                className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-150 rounded-lg cursor-pointer"
                                title="Editar docente"
                                id={`btn-edit-emp-${emp.cedula}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteEmployee(emp.cedula)}
                                className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-150 rounded-lg"
                                title="Borrar docente"
                                id={`btn-del-emp-${emp.cedula}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* ==================== TAB 3: CÓMPUTO DE DÍAS POR DOCENTE ==================== */}
          {activeTab === 'computo' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="computo-tab-view"
            >
              <ComputoPanel 
                employees={employees} 
                novedades={novedades}
                hasPermission={hasPermission}
              />
            </motion.div>
          )}

          {/* ==================== TAB 4: REPORTES Y EXPORTACIÓN ==================== */}
          {activeTab === 'reportes' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="reportes-tab-view"
            >
              <ReportsPanel 
                employees={employees} 
                novedades={novedades}
                hasPermission={hasPermission}
              />
            </motion.div>
          )}

          {/* ==================== TAB 5: CONTROL DE MATRÍCULAS ==================== */}
          {activeTab === 'matriculas' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="matriculas-tab-view"
            >
              <MatriculasPanel showToast={showToast} hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB 6: CERTIFICADOS DE GRADO ==================== */}
          {activeTab === 'certificados' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="certificados-tab-view"
            >
              <CertificadosPanel hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB 7: ACREDITACIONES PAMA ==================== */}
          {activeTab === 'certificadosPama' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="pama-tab-view"
            >
              <CertificadosPamaPanel hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB 8: CONSTANCIAS DE MATRÍCULA ==================== */}
          {activeTab === 'constancias' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="constancias-tab-view"
            >
              <ConstanciasPanel hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB 9: EVALUACIÓN DOCENTE 1278 ==================== */}
          {activeTab === 'evaluacionDocente' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="evaluacion-docente-tab-view"
            >
              <EvaluacionDocentePanel
                docentesEvaluacion={docentesEvaluacion}
                setDocentesEvaluacion={setDocentesEvaluacion}
                showToast={showToast}
                currentTeacher={currentTeacher}
                setCurrentTeacher={setCurrentTeacher}
                onTeacherMessagesChange={setTeacherMessagesStatus}
                triggerOpenMessages={triggerOpenMessages}
              />
            </motion.div>
          )}

          {/* ==================== TAB: AGENDA INSTITUCIONAL ==================== */}
          {activeTab === 'agenda' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AgendaPanel hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB: CONTROL DE CONSECUTIVOS ==================== */}
          {activeTab === 'consecutivos' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ConsecutivosPanel hasPermission={hasPermission} />
            </motion.div>
          )}

          {/* ==================== TAB 10: CONFIGURACIÓN GENERAL DEL SISTEMA ==================== */}
          {activeTab === 'configuracion' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="configuration-tab-view"
            >
              <ConfigurationPanel 
                userSession={userSession}
                logAction={logAction}
                googleUser={googleUser}
                googleToken={googleToken}
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                isSyncingGoogle={isSyncingGoogle}
                autoSyncGoogle={autoSyncGoogle}
                googleStatusMsg={googleStatusMsg}
                setAutoSyncGoogle={setAutoSyncGoogle}
                handleConnectAndSyncGoogle={handleConnectAndSyncGoogle}
                handleManualSyncGoogle={handleManualSyncGoogle}
                handleLogoutGoogle={() => {
                  logoutGoogleWorkspace();
                  setGoogleUser(null);
                  setGoogleToken(null);
                  showToast('Sesión de Google Workspace cerrada.');
                }}
                showToast={showToast}
                onResetAllData={() => setConfirmResetOpen(true)}
                supabaseSyncStatus={dbSyncStatus}
                supabaseDbError={dbError}
                fetchFromSupabase={fetchFromDb}
              />
            </motion.div>
          )}

        </div>

      </div>

      {/* Corporate humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 shrink-0" id="crm-footer">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-slate-450 font-bold uppercase tracking-widest">
            Institución Educativa Alvernia • Gestión de Talento Humano
          </p>
          <p className="text-xs text-slate-400">
            Desarrollado con altos estándares para el control de asistencia, novedades e incapacidades del personal del colegio Alvernia (Directivos, Docentes, Auxiliares Administrativos, Auxiliares de Servicios Generales y Celadores).
          </p>
        </div>
      </footer>

      {/* --- Safe Reset Confirmation Dialog Modal --- */}
      <AnimatePresence>
        {confirmResetOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4" id="reset-confirm-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
              id="reset-confirm-box"
            >
              {/* Header */}
              <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white shrink-0">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-base leading-none">Limpieza Selectiva de Datos</h3>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-slate-800 text-sm font-bold">
                    Seleccione los módulos que desea limpiar:
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Esta acción eliminará de forma definitiva los registros de los módulos seleccionados, tanto en la base de datos como localmente.
                  </p>
                </div>

                {/* Select All / None */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => selectAllCleanOptions(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                  >
                    Seleccionar todo
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => selectAllCleanOptions(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
                  >
                    Quitar selección
                  </button>
                </div>

                {/* Module Checkboxes */}
                <div className="space-y-2">
                  {CLEAN_MODULES.map(mod => (
                    <label
                      key={mod.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        cleanOptions[mod.key]
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={cleanOptions[mod.key] || false}
                        onChange={() => toggleCleanOption(mod.key)}
                        className="w-4 h-4 rounded accent-red-600 cursor-pointer shrink-0"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cleanOptions[mod.key] ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                        {mod.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{mod.label}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{mod.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-amber-50 text-amber-950 p-3.5 rounded-xl border border-amber-200 text-[11px] leading-relaxed flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Propósito:</span>
                    Borre los datos de demostración para cargar, mediante importación de Excel o registro directo, sus <strong>datos reales institucionales</strong>.
                  </div>
                </div>

                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-50/70 px-2 py-1 rounded text-center border border-red-100">
                  ¡Atención: Esta acción no se puede deshacer!
                </p>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="py-2 px-4 rounded-xl hover:bg-slate-200 text-slate-650 transition-colors cursor-pointer font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearSelectedData}
                  className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer font-bold text-xs shadow-sm shadow-red-500/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!Object.values(cleanOptions).some(v => v)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar Módulos Seleccionados
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>

    </div>
  );
}
