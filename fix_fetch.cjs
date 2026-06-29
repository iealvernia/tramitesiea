const fs = require('fs');
let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

const fetchFromDbFull = `  const fetchFromDb = async () => {
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

      const evalRes = await fetch('/api/docentes-evaluacion');
      const evalData = await evalRes.json();

      setDbSyncStatus('synced');
      setDbError('');

      const fetchedEmployees = empData.employees || [];
      const fetchedNovedades = novData.novedades || [];
      const fetchedEval = evalData.success ? (evalData.docentes || []) : [];

      setEmployees(fetchedEmployees);
      setNovedades(fetchedNovedades);
      setDocentesEvaluacion(fetchedEval);
    } catch (e) {
      console.warn('Could not sync from CockroachDB. Fallback to localStorage.', e);
      setDbSyncStatus('error');
      setDbError(e.message || 'Error de red inesperado');
    }
  };`;

const startIndex = app.indexOf('  const fetchFromDb = async () => {');
const endIndex = app.indexOf('  const pushToDb = async (emps: Employee[], novs: Novedad[]) => {');

const before = app.substring(0, startIndex);
const after = app.substring(endIndex);

app = before + fetchFromDbFull + '\n\n' + after;

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', app, 'utf8');
console.log('Fixed fetchFromDb');
