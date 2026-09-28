require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAll() {
  await client.connect();
  
  try {
    const res = await client.query("SELECT id, cedula, evidencias_anexo2, evidencias_anexo5 FROM alvernia_evaluaciones_1278");
    let foundAnexo2 = 0;
    let foundAnexo5 = 0;
    
    for (const row of res.rows) {
      if (row.evidencias_anexo2 && row.evidencias_anexo2.some(e => e.folio === 'N/A')) {
        foundAnexo2++;
      }
      if (row.evidencias_anexo5 && row.evidencias_anexo5.some(e => e.folio === 'N/A')) {
        foundAnexo5++;
      }
    }
    console.log(`Found ${foundAnexo2} records with N/A in anexo2.`);
    console.log(`Found ${foundAnexo5} records with N/A in anexo5.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkAll();
