const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.COCKROACH_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSequence() {
  try {
    const res1 = await pool.query('SELECT max(id) FROM alvernia_matriculas');
    const maxId = res1.rows[0].max;
    console.log('Max ID in table:', maxId);
    
    if (maxId) {
      const res2 = await pool.query(`SELECT setval('alvernia_matriculas_id_seq', $1)`, [maxId]);
      console.log('Sequence set to:', res2.rows[0].setval);
    } else {
      console.log('Table is empty, no need to update sequence.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
fixSequence();
