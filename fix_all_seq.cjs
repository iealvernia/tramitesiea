const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.COCKROACH_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const serialTables = [
  'alvernia_matriculas', 'alvernia_constancias', 'alvernia_consecutivos_oficios', 
  'alvernia_evaluaciones_1278', 'alvernia_docentes_evaluacion', 'alvernia_novedades', 
  'alvernia_actas_generales', 'alvernia_actas_seguimiento', 'alvernia_agenda_eventos', 
  'alvernia_tipos_oficio', 'alvernia_responsables', 'alvernia_admins'
];

async function fixSequences() {
  try {
    for (const table of serialTables) {
      try {
        const res1 = await pool.query(`SELECT max(id) FROM ${table}`);
        const maxId = res1.rows[0].max;
        
        if (maxId) {
          const res2 = await pool.query(`SELECT setval('${table}_id_seq', $1)`, [maxId]);
          console.log(`${table}: Sequence set to ${res2.rows[0].setval}`);
        } else {
          console.log(`${table}: Table is empty.`);
        }
      } catch (err) {
        console.error(`${table}: Error fixing sequence - ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    pool.end();
  }
}
fixSequences();
