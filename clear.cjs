const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://gestiontramitesiea:QuIK2mS0gho5w3gB_9vU2g@gestiontramitesiea-17065.jxf.gcp-europe-west2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full' });

async function run() {
  try {
    const res = await pool.query('DELETE FROM alvernia_docentes_evaluacion');
    console.log('Cleared table, deleted rows:', res.rowCount);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
