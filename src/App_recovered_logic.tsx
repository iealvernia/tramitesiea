  const fetchFromDb = async () => {
    setDbSyncStatus('syncing');
    try {
      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      
      if (!empData.success) {
        console.warn('Error fetching employees from CockroachDB:', empData.error);
        setDbSyncStatus('error');
        setDbError(empData.error || empData.message || 'Error de conexiÃ³n');
        return;
      }

      const novRes = await fetch('/api/novedades');
      const novData = await novRes.json();
      
      if (!novData.success) {
        console.warn('Error fetching novedades from CockroachDB:', novData.error);
        setDbSyncStatus('error');
        setDbError(novData.error || novData.message || 'Error de conexiÃ³n');
        return;
      }

      setDbSyncStatus('synced');
      setDbError('');

      const fetchedEmployees = empData.employees || [];
      const fetchedNovedades = novData.novedades || [];

      setEmployees(fetchedEmployees);
      setNovedades(fetchedNovedades);
    } catch (e: any) {
      console.warn('Could not sync from CockroachDB. Fallback to localStorage.', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de red inesperado');
    }
  };

  const pushToDb = async (emps: Employee[], novs: Novedad[]) => {
    try {
      if (emps.length > 0) {
        const empRes = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: emps })
        });
        const empData = await empRes.json();
        if (!empData.success) throw new Error(empData.error || empData.message);
      }

      if (novs.length > 0) {
        for (const nov of novs) {
          const novRes = await fetch('/api/novedades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nov)
          });
          const novData = await novRes.json();
          if (!novData.success) throw new Error(novData.error || novData.message);
        }
      }
      setDbSyncStatus('synced');
      setDbError('');
    } catch (e: any) {
      console.error('Failed pushing to CockroachDB', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de escritura');
    }
  };

  useEffect(() => {
    if (userSession) {
      fetchFromDb();
    }
  }, [userSession]);

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
    setGoogleStatusMsg('Iniciando sesiÃ³n...');
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
          setGoogleStatusMsg('Creando hoja de cÃ¡lculo en Drive...');
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
        showToast('Â¡Conectado y sincronizado exitosamente con Google Sheets!');
      }
    } catch (error: any) {
      console.error(error);
      setGoogleStatusMsg(null);
      alert(`Error al establecer sincronizaciÃ³n con Google Workspace: ${error.message || error}`);
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
      showToast('Â¡Base de Datos de Google Sheets actualizada con Ã©xito!');
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
            showToast('Â¡Base de Datos de Google Sheets actualizada con Ã©xito!');
          }
        } catch (e: any) {
          alert('Tu sesiÃ³n de Google expirÃ³. Por favor haz clic en conectar de nuevo.');
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
  type TabType = 'novedades' | 'empleados' | 'reportes' | 'computo' | 'matriculas' | 'certificados' | 'certificadosPama' | 'constancias' | 'configuracion' | 'evaluacionDocente';
  const validTabs: TabType[] = ['novedades', 'empleados', 'reportes', 'computo', 'matriculas', 'certificados', 'certificadosPama', 'constancias', 'configuracion', 'evaluacionDocente'];

  const getInitialTab = (): TabType => {
    if (window.location.hash) {
       const hashPath = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
       const match = validTabs.find(t => t.toLowerCase() === hashPath);
       if (match) return match;
    }
    const segments = window.location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1]?.toLowerCase() || '';
    const match = validTabs.find(t => t.toLowerCase() === lastSegment);
    return match || 'novedades';
  };

  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && validTabs.find(t => t.toLowerCase() === segments[segments.length - 1].toLowerCase())) {
        segments.pop();
    }
    const basePath = segments.length > 0 ? '/' + segments.join('/') : '';
    window.history.pushState(null, '', `${basePath}/${tab.toLowerCase()}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [currentTeacher, setCurrentTeacher] = useState<Employee | null>(null);
  const [isTeacherLoginMode, setIsTeacherLoginMode] = useState(true);

  // --- Search and Filters State ---
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSedeFilter, setEmployeeSedeFilter] = useState('TODAS');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  const [novedadSearch, setNovedadSearch] = useState('');
  const [novedadSedeFilter, setNovedadSedeFilter] = useState('TODAS');
  const [novedadClaseFilter, setNovedadClaseFilter] = useState('TODAS');

  // --- Employee Registration Form State ---
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
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
  const [newNovClase, setNewNovClase] = useState<string>(CLASES_NOVEDADES_OPCIONES[15]); // default Permiso de AdopciÃ³n or similar
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
  const [cleanOptions, setCleanOptions] = useState({
    matriculas: false,
    certificados: false,
    pama: false,
    constancias: false,
    evaluacion_docente: false,
    permisos: false,
    configuracion: false
  });
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [novToDelete, setNovToDelete] = useState<{ id: string; desc: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleClearAllData = async () => {
    try {
      const targetsToClean = Object.entries(cleanOptions).filter(([_, v]) => v).map(([k]) => k);
      if (targetsToClean.length === 0) {
        showToast("âš ï¸ No has seleccionado ningÃºn mÃ³dulo para limpiar.");
        return;
      }

      await fetch('/api/database/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: targetsToClean })
      });

      if (cleanOptions.permisos) {
        setEmployees([]);
        setNovedades([]);
      }

      if (cleanOptions.configuracion) {
        const keysToRemove = [
          'iea_rector_name', 'iea_rector_doc', 'iea_rector_cargo',
          'alvernia_institution_name', 'alvernia_institution_dane', 'alvernia_institution_nit',
          'alvernia_educational_level', 'alvernia_calendario', 'alvernia_footer_motto',
          'alvernia_footer_address', 'alvernia_footer_emails', 'alvernia_footer_website',
          'alvernia_footer_city', 'iea_config_customized', 'iea_custom_logo', 'iea_custom_signature',
          'alvernia_habilitation_dates'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('iea_config_updated'));
      }

      setConfirmResetOpen(false);
      showToast("Â¡Datos seleccionados borrados correctamente! La base de datos ha sido limpiada.");
      
      setTimeout(() => window.location.reload(), 1500);

    } catch (e: any) {
      console.error('Could not clear DB records:', e);
      showToast("âŒ Hubo un error limpiando la base de datos.");
    }
  };

  // --- Import handler callback ---
  const handleImportCompleted = async (importedEmployees: Employee[], importedNovedades: Novedad[]) => {
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
      if (importedEmployees.length > 0) {
        const resEmps = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: importedEmployees })
        });
        const dataEmps = await resEmps.json();
        if (!dataEmps.success) throw new Error(dataEmps.error || 'Error al guardar empleados');
      }
      if (importedNovedades.length > 0) {
        const resNovs = await fetch('/api/novedades/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novedades: importedNovedades })
        });
        const dataNovs = await resNovs.json();
        if (!dataNovs.success) throw new Error(dataNovs.error || 'Error al guardar novedades');
      }
      setdbSyncStatus('synced');
    } catch (e: any) {
      console.warn('Could not save imported excel records to CockroachDB:', e);
      setdbSyncStatus('error');
      setdbError(e.message || 'Error de red al importar');
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
      showToast(`Empleado ${targetEmp.nombre} ahora estÃ¡ ${targetEmp.activo ? 'ACTIVO' : 'INHABILITADO'}`);
      try {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: [targetEmp] })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de red');
        setdbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not update active state of employee in CockroachDB:', e);
        setdbSyncStatus('error');
        setdbError(e.message || 'Error de red al alternar activo');
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
      setNewEmpError('Por favor ingrese un nÃºmero de cÃ©dula vÃ¡lido.');
      return;
    }

    // Check duplication ONLY if we are NOT editing
    if (!isEditingEmployee && employees.some(emp => emp.cedula === newEmpCedula)) {
      setNewEmpError(`Ya existe un empleado registrado con la cÃ©dula ${newEmpCedula}.`);
      return;
    }

    const newEmployee: Employee = {
      id: newEmpCedula,
      nombre: newEmpNombre.trim().toUpperCase(),
      cedula: newEmpCedula.trim(),
      cargo: newEmpCargo,
      sedeTrabajo: newEmpSede,
      dificilAcceso: newEmpDificil,
      horasAula: parseInt(newEmpHorasAula, 10) || 0,
      horasLibres: parseInt(newEmpHorasLibres, 10) || 0,
      areaDesempeno: newEmpArea,
      tipoNombramiento: newEmpNombramiento,
      activo: true // This will be preserved by the DB query, but we can set it to the old value if editing.
    };

    if (isEditingEmployee) {
      const oldEmp = employees.find(e => e.cedula === newEmpCedula);
      if (oldEmp) newEmployee.activo = oldEmp.activo; // Preserve original active status
      
      setEmployees(prev => prev.map(emp => emp.cedula === newEmpCedula ? newEmployee : emp));
      
      try {
        const res = await fetch(`/api/employees/${newEmployee.cedula}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEmployee)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de red');
        setdbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not update employee in CockroachDB:', e);
        setdbSyncStatus('error');
        setdbError(e.message || 'Error de red al actualizar docente');
      }
      
      showToast(`Se ha actualizado el funcionario ${newEmployee.nombre}`);
    } else {
      setEmployees(prev => [newEmployee, ...prev]);

      try {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: [newEmployee] })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error de red');
        setdbSyncStatus('synced');
      } catch (e: any) {
        console.warn('Could not insert new employee in CockroachDB:', e);
        setdbSyncStatus('error');
        setdbError(e.message || 'Error de red al guardar docente');
      }
      
      showToast(`Se registrÃ³ correctamente al empleado ${newEmployee.nombre}`);
    }
    
    // Reset Form
    setNewEmpNombre('');
    setNewEmpCedula('');
    setIsEditingEmployee(false);
    setShowAddEmployeeModal(false);
  };

  const handleEditEmployeeClick = (emp: Employee) => {
    setNewEmpNombre(emp.nombre);
    setNewEmpCedula(emp.cedula);
    setNewEmpCargo(emp.cargo || CARGOS_OPCIONES[9]);
    setNewEmpSede(emp.sedeTrabajo || SEDES_OPCIONES[0]);
    setNewEmpDificil(emp.dificilAcceso || 'No');
    setNewEmpHorasAula(emp.horasAula ? emp.horasAula.toString() : '0');
    setNewEmpHorasLibres(emp.horasLibres ? emp.horasLibres.toString() : '0');
    setNewEmpArea(emp.areaDesempeno || 'No Aplica');
    setNewEmpNombramiento(emp.tipoNombramiento || 'Propiedad');
    setIsEditingEmployee(true);
    setShowAddEmployeeModal(true);
  };


  const handleDeleteEmployee = (cedula: string) => {
    const target = employees.find(emp => emp.cedula === cedula);
    if (target) {
      setEmpToDelete(target);
    }
  };

  const executeDeleteEmployee = async () => {
    if (!empToDelete) return;
    const cedula = empToDelete.cedula;

    setEmployees(prev => prev.filter(emp => emp.cedula !== cedula));
    setNovedades(prev => prev.filter(n => n.empleadoId !== cedula));

    try {
      const res = await fetch(`/api/employees/${cedula}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al borrar docente');
      setdbSyncStatus('synced');
    } catch (e: any) {
      console.warn('Could not delete employee and associated novedades from CockroachDB:', e);
      setdbSyncStatus('error');
      setdbError(e.message || 'Error de red al borrar docente');
    }

    showToast(`Se ha eliminado permanentemente el registro del funcionario: ${empToDelete.nombre}`);
    setEmpToDelete(null);
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
      setNewNovError('La fecha y hora de inicio de la novedad debe ser anterior a la fecha y hora de finalizaciÃ³n.');
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
      const res = await fetch('/api/novedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNovelty)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar novedad');
      setdbSyncStatus('synced');
    } catch (e: any) {
      console.warn('Could not insert new novelty in CockroachDB:', e);
      setdbSyncStatus('error');
      setdbError(e.message || 'Error de red al guardar novedad');
    }

    showToast(`Se ha registrado de forma exitosa la novedad: "${newNovelty.claseNovedad}" para ${selectedEmployee.nombre}`);

    // Reset Form fields
    setSelectedEmpIdForNovedad('');
    setEmployeeSelectSearch('');
    setIsEmployeeSelectOpen(false);
    setNewNovDocNo('');
    setNewNovObservaciones('');
  };

  const handleDeleteNovedad = (id: string, desc?: string) => {
    const target = novedades.find(n => n.id === id);
    const resolvedDesc = desc || (target ? target.claseNovedad : 'Novedad');
    setNovToDelete({ id, desc: resolvedDesc });
  };

  const executeDeleteNovedad = async () => {
    if (!novToDelete) return;
    const { id, desc } = novToDelete;

    setNovedades(prev => prev.filter(n => n.id !== id));

    try {
      const res = await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al borrar novedad');
      setdbSyncStatus('synced');
    } catch (e: any) {
      console.warn('Could not delete novelty from CockroachDB:', e);
      setdbSyncStatus('error');
      setdbError(e.message || 'Error de red al borrar novedad');
    }

    showToast(`Se ha eliminado la novedad: "${desc}".`);
    setNovToDelete(null);
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
          <div className="text-center mb-6">
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
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {isTeacherLoginMode ? 'Portal de Docentes (Decreto 1278)' : 'Sistema Integrado de Control Escolar'}
            </p>
          </div>

          {isTeacherLoginMode ? (
            /* TEACHER PORTAL CEDULA LOGIN FORM */
            <form onSubmit={handleTeacherLoginSubmit} className="space-y-5" id="teacher-portal-login-submission">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="teacher-login-error-pill">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">NÃºmero de Documento (CÃ©dula)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 12984577"
                  value={teacherCedulaLogin}
                  onChange={(e) => setTeacherCedulaLogin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  id="teacher-input-cedula"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
                id="teacher-button-submit"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Ingresar al Portal Docente</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeacherLoginMode(false);
                    setLoginError(null);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-all font-semibold cursor-pointer"
                >
                  Â¿Es Administrador del sistema? Ingrese aquÃ­
                </button>
              </div>
            </form>
          ) : (
            /* ADMIN EMAIL/PASSWORD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5" id="auth-form-submission">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="auth-login-error-pill">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Correo ElectrÃ³nico</label>
                <input
                  type="email"
                  required
                  placeholder="eg. matriculas@alvernia.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  id="auth-input-email"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">ContraseÃ±a</label>
                <input
                  type="password"
                  required
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  id="auth-input-password"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
                id="auth-button-submit"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Ingresar al Sistema de GestiÃ³n</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeacherLoginMode(true);
                    setLoginError(null);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-all font-semibold cursor-pointer"
                >
                  â† Volver al Portal de Docentes 1278
                </button>
              </div>
            </form>
          )}

          {/* Prompt footer info */}
          <div className="text-center mt-6 border-t border-slate-800 pt-4">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Este es un sistema institucional privado. El acceso estÃ¡ restringido Ãºnicamente a usuarios autorizados de la InstituciÃ³n Educativa Alvernia.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans antialiased text-slate-800" id="main-app-container">
      
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
              src={sidebarLogoBase64} 
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
          <div className="flex-1 truncate">
            <h1 className="text-white font-extrabold text-xs md:text-sm leading-tight uppercase tracking-wider truncate" title={instBrandName}>{instBrandName}</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-wider truncate" title={appBrandName}>{appBrandName}</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1" id="sidebar-tab-navigation">
          {currentTeacher ? (
            /* TEACHER PORTAL SIDEBAR NAVIGATION */
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                  Mi EvaluaciÃ³n
                </p>
              </div>

              <button
                onClick={() => setActiveTab('evaluacionDocente')}
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
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
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
                  teacherMessagesStatus === 'red'
                    ? 'bg-rose-50 border border-rose-200 text-rose-600 shadow-md shadow-rose-600/10'
                    : teacherMessagesStatus === 'green'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-md shadow-emerald-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-mensajes-sidebar-teacher"
              >
                <AlertCircle className={`w-4 h-4 shrink-0 ${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}`} />
                RetroalimentaciÃ³n
              </button>
            </>
          ) : (
            /* ADMINISTRATOR SIDEBAR NAVIGATION */
            <>
              <button
                onClick={() => setActiveTab('novedades')}
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
                  activeTab === 'novedades'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-novedades-sidebar"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Agenda de Permisos
              </button>

              <button
                onClick={() => setActiveTab('empleados')}
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
                  activeTab === 'empleados'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-empleados-sidebar"
              >
                <Users className="w-4 h-4 shrink-0" />
                Personal y Carga (Excel)
              </button>

              <button
                onClick={() => setActiveTab('computo')}
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
                  activeTab === 'computo'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="tab-btn-computo-sidebar"
              >
                <Clock className="w-4 h-4 shrink-0" />
                CÃ³mputo Absoluto
              </button>

              <button
                onClick={() => setActiveTab('reportes')}
                className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider ${
                  activeTab === 'reportes'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
       

