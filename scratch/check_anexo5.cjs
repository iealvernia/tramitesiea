require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAnexo5() {
  await client.connect();
  
  try {
    const res = await client.query("SELECT id, cedula, evidencias_anexo5 FROM alvernia_evaluaciones_1278 WHERE cedula = '18186338'");
    
    for (const row of res.rows) {
      console.log(`Record ${row.id}: Anexo5 has ${row.evidencias_anexo5 ? row.evidencias_anexo5.length : 0} items.`);
      if (row.evidencias_anexo5 && row.evidencias_anexo5.length > 0) {
        console.log(JSON.stringify(row.evidencias_anexo5, null, 2));
      }
    }
  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await client.end();
  }
}

checkAnexo5();
