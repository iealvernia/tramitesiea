require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixNixon() {
  await client.connect();
  
  try {
    const res = await client.query("SELECT id, cedula, evidencias_anexo2 FROM alvernia_evaluaciones_1278 WHERE cedula = '18186338'");
    
    for (const row of res.rows) {
      const originalLength = row.evidencias_anexo2.length;
      
      // Filter out elements where folio === 'N/A'
      const filteredEvidencias = row.evidencias_anexo2.filter(ev => ev.folio !== 'N/A');
      const newLength = filteredEvidencias.length;
      
      console.log(`Updating record ${row.id}: ${originalLength} items -> ${newLength} items`);
      
      await client.query("UPDATE alvernia_evaluaciones_1278 SET evidencias_anexo2 = $1 WHERE id = $2", [JSON.stringify(filteredEvidencias), row.id]);
    }
    
    console.log("Update completed successfully for NIXON ARTURO BUESAQUILLO INSUASTY.");
  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await client.end();
  }
}

fixNixon();
