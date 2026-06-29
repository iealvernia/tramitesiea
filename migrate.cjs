const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://gestiontramitesiea:QuIK2mS0gho5w3gB_9vU2g@gestiontramitesiea-17065.jxf.gcp-europe-west2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full' });

async function run() {
  try {
    const res = await pool.query('INSERT INTO alvernia_docentes_evaluacion (id, cedula, nombre, cargo, sede_trabajo, activo, dificil_acceso, horas_aula, horas_libres, area_desempeno, tipo_nombramiento) SELECT id, cedula, nombre, cargo, sede_trabajo, activo, dificil_acceso, horas_aula, horas_libres, area_desempeno, tipo_nombramiento FROM alvernia_employees WHERE cargo ILIKE \'%docente%\' OR cargo ILIKE \'%rector%\' OR cargo ILIKE \'%coordinador%\' ON CONFLICT (id) DO NOTHING');
    console.log('Migrated rows:', res.rowCount);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
