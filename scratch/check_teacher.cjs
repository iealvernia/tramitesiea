require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT id, cedula, nombres, apellidos, anexo2_data FROM alvernia_evaluaciones_1278 WHERE nombres ILIKE '%NIXON%' OR apellidos ILIKE '%NIXON%' OR nombres ILIKE '%BUESAQUILLO%' OR apellidos ILIKE '%BUESAQUILLO%'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
  }).catch(e => {
    console.error("Error in query:", e.message);
    client.end();
  });
});
