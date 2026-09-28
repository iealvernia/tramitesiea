require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").then(res => {
    console.log(res.rows);
    client.end();
  });
});
