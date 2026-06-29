const fs = require('fs');
let content = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

content = content.replace(/supabase\.auth\.getSession\(\)\.then\(\(\{ data: \{ session \} \}\) => \{[\s\S]*?return \(\) => \{\n\s*subscription\.unsubscribe\(\);\n\s*\};\n\s*\}\, \[\]\);/, 
  `const fallbackTimeout = setTimeout(() => {
      console.warn('Supabase auth check timed out, continuing anyway.');
      setCheckingSession(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(fallbackTimeout);
      setUserSession(session);
      setCheckingSession(false);
    }).catch(err => {
      clearTimeout(fallbackTimeout);
      console.error('Supabase auth error:', err);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);`
);

content = content.replace(/const novRes = await fetch\('\/api\/novedades'\);[\s\S]*?setNovedades\(fetchedNovedades\);/,
  `const novRes = await fetch('/api/novedades');
      const novData = await novRes.json();
      
      if (!novData.success) {
        console.warn('Error fetching novedades from CockroachDB:', novData.error);
        setDbSyncStatus('error');
        setDbError(novData.error || novData.message || 'Error de conexión');
        return;
      }

      const docRes = await fetch('/api/docentes-evaluacion');
      const docData = await docRes.json();
      
      if (!docData.success) {
        console.warn('Error fetching docentes_evaluacion from CockroachDB:', docData.error);
      }

      setDbSyncStatus('synced');
      setDbError('');

      const fetchedEmployees = empData.employees || [];
      const fetchedNovedades = novData.novedades || [];
      const fetchedDocentes = docData.docentesEvaluacion || [];

      setEmployees(fetchedEmployees);
      setNovedades(fetchedNovedades);
      setDocentesEvaluacion(fetchedDocentes);`
);

content = content.replace(/  };\n\n  if \(checkingSession\) \{/,
  `  };

  const handleTeacherLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingAuth(true);

    let found = docentesEvaluacion.find(d => d.cedula === teacherCedulaLogin.trim());
    if (!found) {
        found = employees.find(emp => emp.cedula === teacherCedulaLogin.trim() && emp.activo !== false);
    }

    if (found) {
      setTimeout(() => {
        setCurrentTeacher(found);
        setIsLoadingAuth(false);
      }, 800);
    } else {
      setTimeout(() => {
        setLoginError('No se encontró un docente con esa cédula registrada en el sistema.');
        setIsLoadingAuth(false);
      }, 600);
    }
  };

  if (checkingSession) {`
);

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', content, 'utf8');
console.log('App.tsx cleanly reconstructed!');
