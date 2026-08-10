const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_fecha_inicio TEXT;');
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_fecha_final TEXT;');
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_dias_incapacidad INTEGER;');
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_dias_valorados INTEGER;');
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_competencias_mejorar TEXT;');
    await pool.query('ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN eval_estrategias_mejorar TEXT;');
    console.log('Columns added successfully');
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
