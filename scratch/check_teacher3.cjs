require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT id, cedula, evidencias_anexo2 FROM alvernia_evaluaciones_1278 WHERE cedula = '18186338'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
  }).catch(e => {
    console.error("Error in query:", e.message);
    client.end();
  });
});
