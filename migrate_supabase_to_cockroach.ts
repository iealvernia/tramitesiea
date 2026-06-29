import pg from "pg";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

const SUPABASE_URL = 'https://odvgmujuhgktfgrtzxwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdmdtdWp1aGdrdGZncnR6eHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjYzNTQsImV4cCI6MjA3NTc0MjM1NH0.WgYUziTE30h5s35wAw91VAkgM000gm-w3x0agY9pe5c';

const { Pool } = pg;
const dbUrl = process.env.COCKROACH_DB_URL;
if (!dbUrl) {
  console.error("No COCKROACH_DB_URL found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const fetchSupabaseTable = (tableName: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
    https.get(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', err => reject(err));
  });
};

const tablesToMigrate = [
  { supabase: 'matriculas', cockroach: 'alvernia_matriculas' },
  { supabase: 'certificados', cockroach: 'alvernia_certificados' },
  { supabase: 'certificados_pama', cockroach: 'alvernia_certificados_pama' },
  { supabase: 'constancias', cockroach: 'alvernia_constancias' }
];

async function run() {
  const client = await pool.connect();
  try {
    for (const table of tablesToMigrate) {
      console.log(`Fetching from Supabase table: ${table.supabase}...`);
      const rows = await fetchSupabaseTable(table.supabase);
      console.log(`Found ${rows.length} rows.`);
      
      for (const row of rows) {
        const columns = Object.keys(row).join(", ");
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        try {
          await client.query(`INSERT INTO ${table.cockroach} (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`, values);
        } catch (err: any) {
           console.error(`Error inserting row ${row.id} into ${table.cockroach}:`, err.message);
        }
      }
      console.log(`Migrated ${table.supabase} -> ${table.cockroach}`);
    }
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
