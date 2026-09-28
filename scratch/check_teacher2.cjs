require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT id, cedula, nombre FROM alvernia_docentes_evaluacion WHERE nombre ILIKE '%NIXON%' OR nombre ILIKE '%BUESAQUILLO%'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
  }).catch(e => {
    console.error("Error in query:", e.message);
    client.end();
  });
});
