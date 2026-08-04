const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool.connect();
    console.log("Connected to DB");
    
    // Check if table exists
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alvernia_evaluaciones_1278'");
    console.log("Table columns:", res.rows);
    
    // Try a dummy insert
    const id = "test-id-" + Date.now();
    await client.query(`
      INSERT INTO alvernia_evaluaciones_1278 (
        id, cedula, periodo, lugar_concertacion, fecha_concertacion, 
        evaluador_nombre, evaluador_cedula, observaciones_admin, estado, 
        compromisos_funcionales, compromisos_comportamentales, evidencias_anexo2, 
        evidencias_anexo5, portfolio_pdf_url, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        cedula = EXCLUDED.cedula,
        periodo = EXCLUDED.periodo,
        lugar_concertacion = EXCLUDED.lugar_concertacion,
        fecha_concertacion = EXCLUDED.fecha_concertacion,
        evaluador_nombre = EXCLUDED.evaluador_nombre,
        evaluador_cedula = EXCLUDED.evaluador_cedula,
        observaciones_admin = EXCLUDED.observaciones_admin,
        estado = EXCLUDED.estado,
        compromisos_funcionales = EXCLUDED.compromisos_funcionales,
        compromisos_comportamentales = EXCLUDED.compromisos_comportamentales,
        evidencias_anexo2 = EXCLUDED.evidencias_anexo2,
        evidencias_anexo5 = EXCLUDED.evidencias_anexo5,
        portfolio_pdf_url = EXCLUDED.portfolio_pdf_url,
        updated_at = EXCLUDED.updated_at
    `, [
      id, "123", 2024, "test", "test", "test", "test", "test", "test", 
      JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), null, new Date().toISOString()
    ]);
    console.log("Insert successful!");
    
    await client.query("DELETE FROM alvernia_evaluaciones_1278 WHERE id = $1", [id]);
    
    client.release();
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}

test();
