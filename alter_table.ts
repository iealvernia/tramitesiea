import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.COCKROACH_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await pool.query("ALTER TABLE alvernia_caja_transacciones ADD COLUMN tercero VARCHAR(255);");
    console.log("Column tercero added.");
  } catch(e) {
    console.error("Error adding column:", e.message);
  } finally {
    pool.end();
  }
}
test();
