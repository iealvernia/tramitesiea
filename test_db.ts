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
    const res = await pool.query("SELECT COUNT(*) FROM alvernia_matriculas");
    console.log("Matriculas count:", res.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
