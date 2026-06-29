import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Briefcase, Calendar, Clock, FileSpreadsheet, Search, Plus, Trash2, 
  School, CheckCircle2, XCircle, AlertCircle, Info, Activity, UserX, ArrowRight,
  FilePlus, Users2, CalendarDays, FileCheck, RefreshCw, Settings, Lock, LogOut, Award
} from 'lucide-react';

import { 
  Employee, DocenteEvaluacion, Novedad, SEDES_OPCIONES, AREAS_DESEMPENO_OPCIONES, 
  CLASES_NOVEDADES_OPCIONES, CARGOS_OPCIONES, DOCUMENTOS_SOPORTE_OPCIONES, 
  TIPOS_NOMBRAMIENTO_OPCIONES 
} from './types';

import { EvaluacionDocentePanel } from './components/EvaluacionDocentePanel';
import { signInWithGoogleWorkspace, logoutGoogleWorkspace, initGoogleAuth, createGoogleSheetDatabase, findExistingSheet, syncNovedadesToSheet } from './lib/googleWorkspace';
import { INITIAL_EMPLOYEES, INITIAL_NOVEDADES } from './data/mockData';
import { supabase } from './lib/supabase';
import ExcelImporter from './components/ExcelImporter';
import ReportsPanel from './components/ReportsPanel';
import ComputoPanel from './components/ComputoPanel';
import MatriculasPanel from './components/MatriculasPanel';
import CertificadosPanel from './components/CertificadosPanel';
import CertificadosPamaPanel from './components/CertificadosPamaPanel';
import ConstanciasPanel from './components/ConstanciasPanel';
import GlobalConfigPanel from './components/GlobalConfigPanel';
import ConfigurationPanel from './components/ConfigurationPanel';

export default function App() {
  const [userSession, setUserSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [teacherCedulaLogin, setTeacherCedulaLogin] = useState('');
  
  const [appBrandName, setAppBrandName] = useState('App Gestión');
  const [instBrandName, setInstBrandName] = useState('IE ALVERNIA');
  const [sidebarLogoBase64, setSidebarLogoBase64] = useState<string>('./logo.png');

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('alvernia_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [novedades, setNovedades] = useState<Novedad[]>(() => {
    const saved = localStorage.getItem('alvernia_novedades');
    return saved ? JSON.parse(saved) : INITIAL_NOVEDADES;
  });

  const [docentesEvaluacion, setDocentesEvaluacion] = useState<DocenteEvaluacion[]>([]);

  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [dbError, setDbError] = useState<string>('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserSession(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
        setLoginLoading(false);
        return;
      }
      
      setUserSession(data.session);
    } catch (err: any) {
      setLoginError(err.message || 'Error de conexión');
    }
    setLoginLoading(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    
    if (!teacherCedulaLogin.trim()) {
      setLoginError('Ingrese su número de cédula');
      setLoginLoading(false);
      return;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userSession) {
       // Just fetch it if it's there
       if (typeof fetchFromDb === 'function') {
           fetchFromDb();
       }
    }
  }, [userSession]);
