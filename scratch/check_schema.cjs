require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alvernia_evaluaciones_1278' OR table_name = 'alvernia_docentes_evaluacion'").then(res => {
    console.log(res.rows);
    client.end();
  });
});
