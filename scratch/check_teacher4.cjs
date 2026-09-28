require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT id, cedula, evidencias_anexo2 FROM alvernia_evaluaciones_1278 WHERE cedula = '18186338'").then(res => {
    console.log(res.rows.map(r => ({id: r.id, anexo2_length: r.evidencias_anexo2.length})));
    client.end();
  }).catch(e => {
    console.error("Error in query:", e.message);
    client.end();
  });
});
