const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/iealvernia' });

async function check() {
  try {
    const res1 = await pool.query('SELECT max(id) FROM alvernia_matriculas');
    console.log('Max ID:', res1.rows[0].max);
    const res2 = await pool.query("SELECT nextval('alvernia_matriculas_id_seq')");
    console.log('Next Val:', res2.rows[0].nextval);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
