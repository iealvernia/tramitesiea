import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3000;

// Setup JSON parsing with high limit to handle PDF/Word base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- CockroachDB Lazy Initialization ---
let pgPool: pg.Pool | null = null;
let isDbBroken = false;

function getDbPool(): pg.Pool | null {
  if (isDbBroken) return null;
  if (!pgPool) {
    const dbUrl = process.env.COCKROACH_DB_URL;
    if (dbUrl && dbUrl.trim() !== "" && dbUrl !== '""') {
      try {
        pgPool = new Pool({
          connectionString: dbUrl,
          ssl: {
            rejectUnauthorized: false // CockroachDB Cloud usually requires SSL
          },
          connectionTimeoutMillis: 5000, // Don't hang forever
        });
        console.log("CockroachDB Pool initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize CockroachDB Pool:", err);
        isDbBroken = true;
      }
    }
  }
  return pgPool;
}

// Ensure CockroachDB tables exist
async function ensureDbTables() {
  const pool = getDbPool();
  if (!pool) return;
  try {
    const client = await pool.connect();
    console.log("Checking and bootstraping CockroachDB tables...");
    
    // Create evaluations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_evaluaciones_1278 (
        id TEXT PRIMARY KEY,
        cedula TEXT NOT NULL,
        periodo INT NOT NULL,
        lugar_concertacion TEXT,
        fecha_concertacion TEXT,
        evaluador_nombre TEXT,
        evaluador_cedula TEXT,
        observaciones_admin TEXT,
        estado TEXT,
        compromisos_funcionales JSONB,
        compromisos_comportamentales JSONB,
        evidencias_anexo2 JSONB,
        evidencias_anexo5 JSONB,
        portfolio_pdf_url TEXT,
        updated_at TEXT
      );
    `);

    // Ensure backwards compatibility by adding the new columns if they don't exist
    await client.query(`
      ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN IF NOT EXISTS evidencias_anexo5 JSONB;
      ALTER TABLE alvernia_evaluaciones_1278 ADD COLUMN IF NOT EXISTS observaciones_admin TEXT;
    `);

    // Create custom employees table to allow load/save from Excel
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_employees (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cedula TEXT NOT NULL UNIQUE,
        cargo TEXT,
        sede_trabajo TEXT,
        dificil_acceso TEXT,
        horas_aula INT,
        horas_libres INT,
        area_desempeno TEXT,
        tipo_nombramiento TEXT,
        activo BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_docentes_evaluacion table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_docentes_evaluacion (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cedula TEXT NOT NULL UNIQUE,
        cargo TEXT,
        sede_trabajo TEXT,
        dificil_acceso TEXT,
        horas_aula INT,
        horas_libres INT,
        area_desempeno TEXT,
        tipo_nombramiento TEXT,
        activo BOOLEAN DEFAULT TRUE,
        lugar_expedicion_cedula TEXT,
        correo_electronico TEXT,
        numero_celular TEXT,
        firma_docente TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure backwards compatibility by adding columns if they don't exist
    await client.query(`
      ALTER TABLE alvernia_docentes_evaluacion ADD COLUMN IF NOT EXISTS lugar_expedicion_cedula TEXT;
      ALTER TABLE alvernia_docentes_evaluacion ADD COLUMN IF NOT EXISTS correo_electronico TEXT;
      ALTER TABLE alvernia_docentes_evaluacion ADD COLUMN IF NOT EXISTS numero_celular TEXT;
      ALTER TABLE alvernia_docentes_evaluacion ADD COLUMN IF NOT EXISTS firma_docente TEXT;
    `);

    // Create alvernia_config table for institutional & rector settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_config (
        id TEXT PRIMARY KEY,
        institution_name TEXT,
        institution_dane TEXT,
        rector_name TEXT,
        rector_document TEXT,
        rector_document_expedition TEXT,
        rector_cargo TEXT,
        rector_signature TEXT,
        logo_base64 TEXT,
        habilitation_dates JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS app_name TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS app_title TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS institution_nit TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS educational_level TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS calendario TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS footer_motto TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS footer_address TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS footer_website TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS footer_city TEXT;
      ALTER TABLE alvernia_config ADD COLUMN IF NOT EXISTS ihs_config JSONB;
    `);

    // Create alvernia_novedades table for Agenda de Permisos
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_novedades (
        id TEXT PRIMARY KEY,
        empleado_id TEXT NOT NULL,
        clase_novedad TEXT,
        sede_novedad TEXT,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        esta_laborando_normalmente TEXT,
        se_le_asigno_carga_academica TEXT,
        documento_soporte_tipo TEXT,
        documento_soporte_no TEXT,
        documento_soporte_fecha TEXT,
        observaciones TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_actas_generales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_actas_generales (
        id TEXT PRIMARY KEY,
        numero TEXT,
        anio TEXT,
        fecha TEXT,
        lugar TEXT,
        hora TEXT,
        objetivo TEXT,
        orden_dia TEXT,
        desarrollo TEXT,
        cuadro_info TEXT,
        cronograma JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_actas_seguimiento table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_actas_seguimiento (
        id TEXT PRIMARY KEY,
        numero TEXT,
        anio TEXT,
        fecha TEXT,
        lugar TEXT,
        hora TEXT,
        objetivo TEXT,
        orden_dia TEXT,
        desarrollo TEXT,
        cuadro_info TEXT,
        docentes_observaciones JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Create alvernia_matriculas table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_matriculas (
        id SERIAL PRIMARY KEY,
        primer_apellido TEXT,
        segundo_apellido TEXT,
        primer_nombre TEXT,
        segundo_nombre TEXT,
        tipo_documento TEXT,
        numero_documento TEXT,
        fecha_nacimiento TEXT,
        lugar_nacimiento TEXT,
        lugar_expedicion TEXT,
        sexo TEXT,
        correo_estudiante TEXT,
        estrato TEXT,
        tipo_sangre TEXT,
        municipio_residencia TEXT,
        direccion_residencia TEXT,
        telefono_celular TEXT,
        eps_afiliacion TEXT,
        nivel_educativo TEXT,
        grado TEXT,
        fecha_matricula TEXT,
        jornada TEXT,
        sede TEXT,
        grupo_etnico TEXT,
        vive_con TEXT,
        repitente TEXT,
        discapacidad TEXT,
        estudio_anterior TEXT,
        institucion_anterior TEXT,
        num_hermanos TEXT,
        grados TEXT,
        acudiente_apellidos TEXT,
        acudiente_nombres TEXT,
        acudiente_documento TEXT,
        acudiente_municipio TEXT,
        acudiente_direccion TEXT,
        acudiente_telefono TEXT,
        acudiente_parentesco TEXT,
        acudiente_profesion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_certificados table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_certificados (
        id TEXT PRIMARY KEY,
        anio TEXT,
        nombre TEXT,
        documento TEXT,
        tipo_documento TEXT,
        grado TEXT,
        jornada TEXT,
        comportamiento TEXT,
        notas JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_certificados_pama table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_certificados_pama (
        id TEXT PRIMARY KEY,
        anio TEXT,
        tipo_documento TEXT,
        documento TEXT,
        nombre TEXT,
        grado TEXT,
        fecha_grado TEXT,
        jornada TEXT,
        acta TEXT,
        folio TEXT,
        libro TEXT,
        codigo_icfes TEXT,
        codigo_dane TEXT,
        sede TEXT,
        intensidad_horaria TEXT,
        caracter TEXT,
        lugar_expedicion TEXT,
        beneficiario_exencion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_constancias table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_constancias (
        id SERIAL PRIMARY KEY,
        anio TEXT,
        tipo_documento TEXT,
        documento TEXT,
        apellido1 TEXT,
        apellido2 TEXT,
        nombre1 TEXT,
        nombre2 TEXT,
        nombre_completo TEXT,
        fecha_nacimiento TEXT,
        sede TEXT,
        jornada TEXT,
        grado_cod TEXT,
        grado_texto TEXT,
        fecha_inicio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // Create alvernia_agenda_eventos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_agenda_eventos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        tipo TEXT,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        participantes TEXT,
        lugar_espacio TEXT,
        estado TEXT,
        creado_por TEXT,
        ano TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_consecutivos_oficios table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_consecutivos_oficios (
        id TEXT PRIMARY KEY,
        numero_consecutivo INT,
        ano TEXT,
        elaborado_por TEXT,
        entidad_destino TEXT,
        tipo_oficio TEXT,
        asunto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure backwards compatibility by adding the new columns for document generation
    await client.query(`
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Oficio';
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS prefijo TEXT DEFAULT 'REC';
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS es_generado BOOLEAN DEFAULT FALSE;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS cuerpo_documento TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS destinatario_nombre TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS destinatario_cargo TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS destinatario_lugar TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS revisado_por TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS despedida TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS firma_nombre TEXT;
      ALTER TABLE alvernia_consecutivos_oficios ADD COLUMN IF NOT EXISTS firma_cargo TEXT;
    `);

    // Create alvernia_tipos_oficio table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_tipos_oficio (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default tipos de oficio if table is empty
    const { rows: tiposRows } = await client.query('SELECT COUNT(*) FROM alvernia_tipos_oficio');
    if (parseInt(tiposRows[0].count) === 0) {
      const defaults = [
        'Resolución', 'Circular', 'Oficio Remisorio', 'Acta', 
        'Certificación', 'Respuesta a Derecho de Petición', 'Citación'
      ];
      for (const t of defaults) {
        await client.query('INSERT INTO alvernia_tipos_oficio (id, nombre) VALUES ($1, $2)', [crypto.randomUUID(), t]);
      }
    }

    // Create alvernia_responsables table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_responsables (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alvernia_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT,
        rol TEXT DEFAULT 'USER',
        permisos JSONB,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed default admin if table is empty
    const { rows: users } = await client.query('SELECT id, email FROM alvernia_users LIMIT 1');
    if (users.length === 0) {
      const defaultEmail = 'matriculas@alvernia.com';
      const defaultPassword = 'admin';
      const hash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
      const allPerms = JSON.stringify(['MATRICULAS', 'CERTIFICADOS', 'EVALUACION', 'CONFIGURACION', 'AGENDA', 'CONSECUTIVOS']);
      await client.query(
        'INSERT INTO alvernia_users (id, email, password_hash, nombre, rol, permisos) VALUES ($1, $2, $3, $4, $5, $6)',
        [crypto.randomUUID(), defaultEmail, hash, 'Administrador Principal', 'ADMIN', allPerms]
      );
      console.log('Seeded default admin user in alvernia_users');
    }

    // Create alvernia_audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alvernia_audit_log (
        id SERIAL PRIMARY KEY,
        user_email TEXT,
        accion TEXT,
        modulo TEXT,
        detalles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add sede and plain_password columns to existing tables if they don't exist
    await pool.query(`
      ALTER TABLE alvernia_users ADD COLUMN IF NOT EXISTS sede TEXT DEFAULT 'TODAS';
      ALTER TABLE alvernia_users ADD COLUMN IF NOT EXISTS plain_password TEXT;
    `);

    console.log("CockroachDB tables are verified/created successfully.");
  } catch (err: any) {
    console.error("Error ensuring CockroachDB tables:", err);
    const msg = err.message || "";
    if (
      msg.includes("password authentication failed") ||
      msg.includes("authentication failed") ||
      msg.includes("refused") ||
      msg.includes("failed authentication attempts")
    ) {
      console.warn("CockroachDB authentication failed. Disabling CockroachDB to prevent lockouts and slow down start times.");
      isDbBroken = true;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
  }
}

// Call bootstrap in background
ensureDbTables();

// --- Cloudflare R2 S3 Lazy Client ---
let s3Client: S3Client | null = null;
function getS3Client(): S3Client | null {
  if (!s3Client) {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (endpoint && accessKeyId && secretAccessKey) {
      try {
        s3Client = new S3Client({
          endpoint,
          region: "auto",
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        console.log("Cloudflare R2 Client initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize Cloudflare R2 Client:", err);
      }
    }
  }
  return s3Client;
}


// --- API ENDPOINTS ---

// Check backend status and DB/R2 configuration
// --- USER MANAGEMENT ENDPOINTS ---

app.get("/api/users", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "Database not connected" });
  try {
    const { rows } = await pool.query("SELECT id, email, nombre, rol, permisos, activo, sede, plain_password, created_at FROM alvernia_users ORDER BY created_at DESC");
    res.json({ success: true, users: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "Database not connected" });
  
  const { id, email, password, nombre, rol, permisos, activo, sede } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });

  try {
    const plainPw = rol === 'ADMIN' ? null : (password || null);
    
    if (id) {
      if (password && password.trim() !== '') {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        await pool.query(
          "UPDATE alvernia_users SET email=$1, password_hash=$2, nombre=$3, rol=$4, permisos=$5, activo=$6, sede=$7, plain_password=$8 WHERE id=$9",
          [email, hash, nombre, rol, JSON.stringify(permisos), activo, sede || 'TODAS', plainPw, id]
        );
      } else {
        // Si no envía contraseña, borramos la plain_password si es que se volvió ADMIN
        // O la mantenemos si no envió (el UPDATE no toca la contraseña a menos que explícitamente se requiera)
        if (rol === 'ADMIN') {
          await pool.query(
            "UPDATE alvernia_users SET email=$1, nombre=$2, rol=$3, permisos=$4, activo=$5, sede=$6, plain_password=NULL WHERE id=$7",
            [email, nombre, rol, JSON.stringify(permisos), activo, sede || 'TODAS', id]
          );
        } else {
          await pool.query(
            "UPDATE alvernia_users SET email=$1, nombre=$2, rol=$3, permisos=$4, activo=$5, sede=$6 WHERE id=$7",
            [email, nombre, rol, JSON.stringify(permisos), activo, sede || 'TODAS', id]
          );
        }
      }
      res.json({ success: true, id });
    } else {
      if (!password) return res.status(400).json({ error: "Contraseña requerida para nuevo usuario" });
      const newId = crypto.randomUUID();
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      await pool.query(
        "INSERT INTO alvernia_users (id, email, password_hash, nombre, rol, permisos, activo, sede, plain_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [newId, email, hash, nombre, rol || 'USER', JSON.stringify(permisos || []), activo !== false, sede || 'TODAS', plainPw]
      );
      res.json({ success: true, id: newId });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "Database not connected" });
  try {
    await pool.query("DELETE FROM alvernia_users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOG ENDPOINTS ---

app.post("/api/audit", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(200).json({ success: false, fallback: true }); // Ignore if DB is down
  
  const { user_email, accion, modulo, detalles } = req.body;
  try {
    await pool.query(
      "INSERT INTO alvernia_audit_log (user_email, accion, modulo, detalles) VALUES ($1, $2, $3, $4)",
      [user_email || 'UNKNOWN', accion, modulo, detalles]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/audit", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "Database not connected" });
  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_audit_log ORDER BY created_at DESC LIMIT 1000");
    res.json({ success: true, logs: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(500).json({ error: "Database not connected" });
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

  try {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    // We check both the new users table and legacy admins table for backward compatibility initially
    const { rows } = await pool.query("SELECT * FROM alvernia_users WHERE email = $1 AND password_hash = $2 AND activo = true", [email, hash]);
    
    if (rows.length > 0) {
      const user = rows[0];
      return res.json({ 
        success: true, 
        user: { 
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          permisos: user.permisos
        } 
      });
    } else {
      // Legacy fallback
      const { rows: legacyRows } = await pool.query("SELECT * FROM alvernia_admins WHERE email = $1 AND password_hash = $2", [email, hash]);
      if (legacyRows.length > 0) {
         return res.json({ 
          success: true, 
          user: { 
            email: legacyRows[0].email,
            rol: 'ADMIN', // legacy is admin
            permisos: ['MATRICULAS', 'CERTIFICADOS', 'EVALUACION', 'CONFIGURACION', 'AGENDA', 'CONSECUTIVOS']
          } 
        });
      }
      return res.status(401).json({ error: "Credenciales inválidas o usuario inactivo" });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/api/health", async (req, res) => {
  const dbConfigured = !!process.env.COCKROACH_DB_URL;
  const r2Configured = !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
  
  let dbStatus = "not_configured";
  if (isDbBroken) {
    dbStatus = "disabled_due_to_auth_failure";
  } else if (dbConfigured) {
    const pool = getDbPool();
    if (pool) {
      try {
        const client = await pool.connect();
        dbStatus = "connected";
        client.release();
      } catch (err: any) {
        dbStatus = `error: ${err.message || err}`;
        const msg = err.message || "";
        if (
          msg.includes("password authentication failed") ||
          msg.includes("authentication failed") ||
          msg.includes("refused") ||
          msg.includes("failed authentication attempts")
        ) {
          console.warn("Disabling CockroachDB pool due to connection error in health check.");
          isDbBroken = true;
          if (pgPool) {
            pgPool.end().catch(() => {});
            pgPool = null;
          }
        }
      }
    } else {
      dbStatus = "initialization_failed";
    }
  }

  res.json({
    status: "ok",
    cockroachDb: {
      configured: dbConfigured,
      status: dbStatus
    },
    cloudflareR2: {
      configured: r2Configured,
      bucket: process.env.R2_BUCKET_NAME || null
    }
  });
});

// Fetch all evaluation records from CockroachDB
app.get("/api/evaluaciones", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "CockroachDB no estÃ¡ configurado o no se puede conectar. Usando almacenamiento local/Supabase."
    });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_evaluaciones_1278");
    
    // Map database snake_case or JSONB back to the application types
    const mappedEvaluaciones = rows.map(row => ({
      id: row.id,
      cedula: row.cedula,
      periodo: Number(row.periodo),
      lugarConcertacion: row.lugar_concertacion,
      fechaConcertacion: row.fecha_concertacion,
      evaluadorNombre: row.evaluador_nombre,
      evaluadorCedula: row.evaluador_cedula,
      observacionesAdmin: row.observaciones_admin,
      estado: row.estado,
      compromisosFuncionales: typeof row.compromisos_funcionales === "string" ? JSON.parse(row.compromisos_funcionales) : row.compromisos_funcionales,
      compromisosComportamentales: typeof row.compromisos_comportamentales === "string" ? JSON.parse(row.compromisos_comportamentales) : row.compromisos_comportamentales,
      evidenciasAnexo2: typeof row.evidencias_anexo2 === "string" ? JSON.parse(row.evidencias_anexo2) : row.evidencias_anexo2,
      evidenciasAnexo5: typeof row.evidencias_anexo5 === "string" ? JSON.parse(row.evidencias_anexo5) : row.evidencias_anexo5,
      portfolioPdfUrl: row.portfolio_pdf_url,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, evaluaciones: mappedEvaluaciones });
  } catch (err: any) {
    console.error("Error reading from CockroachDB:", err);
    const msg = err.message || "";
    if (
      msg.includes("password authentication failed") ||
      msg.includes("authentication failed") ||
      msg.includes("refused") ||
      msg.includes("failed authentication attempts")
    ) {
      console.warn("Disabling CockroachDB due to auth failure in get evaluations.");
      isDbBroken = true;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Save or Update a single evaluation record in CockroachDB
app.post("/api/evaluaciones", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "CockroachDB no estÃ¡ conectado. El guardado se almacenÃ³ localmente."
    });
  }

  const {
    id,
    cedula,
    periodo,
    lugarConcertacion,
    fechaConcertacion,
    evaluadorNombre,
    evaluadorCedula,
    observacionesAdmin,
    estado,
    compromisosFuncionales,
    compromisosComportamentales,
    evidenciasAnexo2,
    evidenciasAnexo5,
    portfolioPdfUrl,
    updatedAt
  } = req.body;

  if (!id || !cedula) {
    return res.status(400).json({ success: false, error: "id and cedula are required fields." });
  }

  try {
    await pool.query(`
      INSERT INTO alvernia_evaluaciones_1278 (
        id, cedula, periodo, lugar_concertacion, fecha_concertacion, 
        evaluador_nombre, evaluador_cedula, observaciones_admin, estado, 
        compromisos_funcionales, compromisos_comportamentales, evidencias_anexo2, 
        evidencias_anexo5, portfolio_pdf_url, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        cedula = EXCLUDED.cedula,
        periodo = EXCLUDED.periodo,
        lugar_concertacion = EXCLUDED.lugar_concertacion,
        fecha_concertacion = EXCLUDED.fecha_concertacion,
        evaluador_nombre = EXCLUDED.evaluador_nombre,
        evaluador_cedula = EXCLUDED.evaluador_cedula,
        observaciones_admin = EXCLUDED.observaciones_admin,
        estado = EXCLUDED.estado,
        compromisos_funcionales = EXCLUDED.compromisos_funcionales,
        compromisos_comportamentales = EXCLUDED.compromisos_comportamentales,
        evidencias_anexo2 = EXCLUDED.evidencias_anexo2,
        evidencias_anexo5 = EXCLUDED.evidencias_anexo5,
        portfolio_pdf_url = EXCLUDED.portfolio_pdf_url,
        updated_at = EXCLUDED.updated_at
    `, [
      id,
      cedula,
      periodo,
      lugarConcertacion,
      fechaConcertacion,
      evaluadorNombre,
      evaluadorCedula,
      observacionesAdmin,
      estado,
      JSON.stringify(compromisosFuncionales || []),
      JSON.stringify(compromisosComportamentales || []),
      JSON.stringify(evidenciasAnexo2 || []),
      JSON.stringify(evidenciasAnexo5 || []),
      portfolioPdfUrl || null,
      updatedAt || new Date().toISOString()
    ]);

    res.json({ success: true, message: `EvaluaciÃ³n guardada exitosamente en CockroachDB.` });
  } catch (err: any) {
    console.error("Error upserting evaluation in CockroachDB:", err);
    const msg = err.message || "";
    if (
      msg.includes("password authentication failed") ||
      msg.includes("authentication failed") ||
      msg.includes("refused") ||
      msg.includes("failed authentication attempts")
    ) {
      console.warn("Disabling CockroachDB due to auth failure in post evaluations.");
      isDbBroken = true;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Delete all evaluation records for a specific teacher and period
app.delete("/api/evaluaciones/teacher/:cedula/:periodo", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { cedula, periodo } = req.params;
  try {
    await pool.query("DELETE FROM alvernia_evaluaciones_1278 WHERE cedula = $1 AND periodo = $2", [cedula, parseInt(periodo)]);
    res.json({ success: true, message: "Evaluaciones eliminadas exitosamente." });
  } catch (err: any) {
    console.error("Error deleting evaluation from CockroachDB:", err);
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Delete an evaluation record from CockroachDB
app.delete("/api/evaluaciones/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { id } = req.params;
  try {
    await pool.query("DELETE FROM alvernia_evaluaciones_1278 WHERE id = $1", [id]);
    res.json({ success: true, message: "EvaluaciÃ³n eliminada exitosamente." });
  } catch (err: any) {
    console.error("Error deleting evaluation from CockroachDB:", err);
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Fetch all novedades (Agenda de permisos) from CockroachDB
app.get("/api/novedades", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, novedades: [] });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_novedades");
    const mappedNovedades = rows.map(r => ({
      id: r.id,
      empleadoId: r.empleado_id,
      claseNovedad: r.clase_novedad,
      sedeNovedad: r.sede_novedad,
      fechaInicio: r.fecha_inicio,
      fechaFin: r.fecha_fin,
      estaLaborandoNormalmente: r.esta_laborando_normalmente,
      seLeAsignoCargaAcademica: r.se_le_asigno_carga_academica,
      documentoSoporteTipo: r.documento_soporte_tipo,
      documentoSoporteNo: r.documento_soporte_no,
      documentoSoporteFecha: r.documento_soporte_fecha,
      observaciones: r.observaciones
    }));
    res.json({ success: true, novedades: mappedNovedades });
  } catch (err: any) {
    console.error("Error reading novedades from CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Save or Upsert a novedad in CockroachDB
app.post("/api/novedades", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const nov = req.body;
  if (!nov.id || !nov.empleadoId) {
    return res.status(400).json({ success: false, error: "id and empleadoId are required." });
  }

  try {
    await pool.query(`
      INSERT INTO alvernia_novedades (
        id, empleado_id, clase_novedad, sede_novedad, fecha_inicio, fecha_fin, 
        esta_laborando_normalmente, se_le_asigno_carga_academica, documento_soporte_tipo, 
        documento_soporte_no, documento_soporte_fecha, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        empleado_id = EXCLUDED.empleado_id,
        clase_novedad = EXCLUDED.clase_novedad,
        sede_novedad = EXCLUDED.sede_novedad,
        fecha_inicio = EXCLUDED.fecha_inicio,
        fecha_fin = EXCLUDED.fecha_fin,
        esta_laborando_normalmente = EXCLUDED.esta_laborando_normalmente,
        se_le_asigno_carga_academica = EXCLUDED.se_le_asigno_carga_academica,
        documento_soporte_tipo = EXCLUDED.documento_soporte_tipo,
        documento_soporte_no = EXCLUDED.documento_soporte_no,
        documento_soporte_fecha = EXCLUDED.documento_soporte_fecha,
        observaciones = EXCLUDED.observaciones,
        updated_at = CURRENT_TIMESTAMP
    `, [
      nov.id, nov.empleadoId, nov.claseNovedad, nov.sedeNovedad, nov.fechaInicio, nov.fechaFin,
      nov.estaLaborandoNormalmente, nov.seLeAsignoCargaAcademica, nov.documentoSoporteTipo,
      nov.documentoSoporteNo, nov.documentoSoporteFecha, nov.observaciones
    ]);
    res.json({ success: true, message: "Novedad guardada exitosamente." });
  } catch (err: any) {
    console.error("Error saving novedad to CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Bulk Import Novedades
app.post("/api/novedades/bulk", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { novedades } = req.body;
  if (!Array.isArray(novedades)) {
    return res.status(400).json({ success: false, error: "novedades must be an array." });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const nov of novedades) {
        await client.query(`
          INSERT INTO alvernia_novedades (
            id, empleado_id, clase_novedad, sede_novedad, fecha_inicio, fecha_fin, 
            esta_laborando_normalmente, se_le_asigno_carga_academica, documento_soporte_tipo, 
            documento_soporte_no, documento_soporte_fecha, observaciones
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            empleado_id = EXCLUDED.empleado_id,
            clase_novedad = EXCLUDED.clase_novedad,
            sede_novedad = EXCLUDED.sede_novedad,
            fecha_inicio = EXCLUDED.fecha_inicio,
            fecha_fin = EXCLUDED.fecha_fin,
            esta_laborando_normalmente = EXCLUDED.esta_laborando_normalmente,
            se_le_asigno_carga_academica = EXCLUDED.se_le_asigno_carga_academica,
            documento_soporte_tipo = EXCLUDED.documento_soporte_tipo,
            documento_soporte_no = EXCLUDED.documento_soporte_no,
            documento_soporte_fecha = EXCLUDED.documento_soporte_fecha,
            observaciones = EXCLUDED.observaciones,
            updated_at = CURRENT_TIMESTAMP
        `, [
          nov.id, nov.empleadoId, nov.claseNovedad, nov.sedeNovedad, nov.fechaInicio, nov.fechaFin,
          nov.estaLaborandoNormalmente, nov.seLeAsignoCargaAcademica, nov.documentoSoporteTipo,
          nov.documentoSoporteNo, nov.documentoSoporteFecha, nov.observaciones
        ]);
      }
      await client.query("COMMIT");
      res.json({ success: true, count: novedades.length });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error performing bulk import for novedades:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Update a novedad
app.put("/api/novedades/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.json({ success: false, fallback: true });
  
  const id = req.params.id;
  const { empleadoId, claseNovedad, sedeNovedad, fechaInicio, fechaFin, estaLaborandoNormalmente, seLeAsignoCargaAcademica, documentoSoporteTipo, documentoSoporteNo, documentoSoporteFecha, observaciones } = req.body;
  
  try {
    await pool.query(
      `UPDATE alvernia_novedades SET 
        empleado_id = $1, 
        clase_novedad = $2, 
        sede_novedad = $3, 
        fecha_inicio = $4, 
        fecha_fin = $5, 
        esta_laborando_normalmente = $6, 
        se_le_asigno_carga_academica = $7, 
        documento_soporte_tipo = $8, 
        documento_soporte_no = $9, 
        documento_soporte_fecha = $10, 
        observaciones = $11, 
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [empleadoId, claseNovedad, sedeNovedad, fechaInicio, fechaFin, estaLaborandoNormalmente, seLeAsignoCargaAcademica, documentoSoporteTipo, documentoSoporteNo, documentoSoporteFecha, observaciones, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating novedad:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Delete a novedad from CockroachDB
app.delete("/api/novedades/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { id } = req.params;
  try {
    await pool.query("DELETE FROM alvernia_novedades WHERE id = $1", [id]);
    res.json({ success: true, message: "Novedad eliminada." });
  } catch (err: any) {
    console.error("Error deleting novedad from CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Fetch imported custom teachers list from CockroachDB
app.get("/api/employees", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, employees: [] });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_employees ORDER BY nombre ASC");
    const mappedEmps = rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      cedula: r.cedula,
      cargo: r.cargo,
      sedeTrabajo: r.sede_trabajo,
      dificilAcceso: r.dificil_acceso,
      horasAula: r.horas_aula,
      horasLibres: r.horas_libres,
      areaDesempeno: r.area_desempeno,
      tipoNombramiento: r.tipo_nombramiento,
      activo: r.activo
    }));
    res.json({ success: true, employees: mappedEmps });
  } catch (err: any) {
    console.error("Error reading employees from CockroachDB:", err);
    const msg = err.message || "";
    if (
      msg.includes("password authentication failed") ||
      msg.includes("authentication failed") ||
      msg.includes("refused") ||
      msg.includes("failed authentication attempts")
    ) {
      console.warn("Disabling CockroachDB due to auth failure in get employees.");
      isDbBroken = true;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Save or Upsert imported teachers (from Excel) to CockroachDB
app.post("/api/employees/bulk", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { employees } = req.body;
  if (!Array.isArray(employees)) {
    return res.status(400).json({ success: false, error: "employees must be an array." });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const emp of employees) {
        await client.query(`
          INSERT INTO alvernia_employees (
            id, nombre, cedula, cargo, sede_trabajo, dificil_acceso, 
            horas_aula, horas_libres, area_desempeno, tipo_nombramiento, activo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (cedula) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            cargo = EXCLUDED.cargo,
            sede_trabajo = EXCLUDED.sede_trabajo,
            dificil_acceso = EXCLUDED.dificil_acceso,
            horas_aula = EXCLUDED.horas_aula,
            horas_libres = EXCLUDED.horas_libres,
            area_desempeno = EXCLUDED.area_desempeno,
            tipo_nombramiento = EXCLUDED.tipo_nombramiento,
            activo = EXCLUDED.activo
        `, [
          emp.id || `emp__${emp.cedula}`,
          emp.nombre,
          emp.cedula,
          emp.cargo || "Docente de Aula",
          emp.sedeTrabajo || "Sede Principal",
          emp.dificilAcceso || "No",
          Number(emp.horasAula) || 0,
          Number(emp.horasLibres) || 0,
          emp.areaDesempeno || "BÃ¡sica Primaria",
          emp.tipoNombramiento || "Propiedad",
          emp.activo !== false
        ]);
      }
      await client.query("COMMIT");
      res.json({ success: true, count: employees.length });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error performing bulk import to CockroachDB:", err);
    const msg = err.message || "";
    if (
      msg.includes("password authentication failed") ||
      msg.includes("authentication failed") ||
      msg.includes("refused") ||
      msg.includes("failed authentication attempts")
    ) {
      console.warn("Disabling CockroachDB due to auth failure in bulk import.");
      isDbBroken = true;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
    res.status(200).json({ success: false, fallback: true, error: err.message || err });
  }
});

// Delete an employee from CockroachDB (and their related novedades/evaluations if needed)
app.delete("/api/employees/:cedula", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { cedula } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // Delete related novedades using cedula directly
      await client.query("DELETE FROM alvernia_novedades WHERE empleado_id = $1", [cedula]);
      
      // Delete the employee using cedula
      await client.query("DELETE FROM alvernia_employees WHERE cedula = $1", [cedula]);
      
      await client.query("COMMIT");
      res.json({ success: true, message: "Empleado y sus dependencias eliminados." });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error deleting employee from CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// DOCENTES EVALUACION ROUTES
// Handlers reutilizables registrados en rutas con guiones (docentes-evaluacion)
// y camelCase (docentesEvaluacion) para compatibilidad con el frontend.

async function getDocentesEvaluacion(_req: any, res: any) {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, message: "CockroachDB pool is not initialized" });
  }
  try {
    const result = await pool.query("SELECT * FROM alvernia_docentes_evaluacion ORDER BY nombre ASC");
    const docentes = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      cedula: row.cedula,
      cargo: row.cargo,
      sedeTrabajo: row.sede_trabajo,
      dificilAcceso: row.dificil_acceso,
      horasAula: row.horas_aula,
      horasLibres: row.horas_libres,
      areaDesempeno: row.area_desempeno,
      tipoNombramiento: row.tipo_nombramiento,
      activo: row.activo,
      lugarExpedicionCedula: row.lugar_expedicion_cedula,
      correoElectronico: row.correo_electronico,
      numeroCelular: row.numero_celular,
      firmaDocente: row.firma_docente
    }));
    res.json({ success: true, docentesEvaluacion: docentes });
  } catch (error: any) {
    console.error("Error fetching docentes evaluacion:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function bulkUpsertDocentesEvaluacion(req: any, res: any) {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, message: "CockroachDB pool is not initialized" });
  }
  
  // Aceptar ambos nombres de campo: "docentes" y "docentesEvaluacion"
  const docentes = req.body.docentes || req.body.docentesEvaluacion;
  if (!Array.isArray(docentes) || docentes.length === 0) {
    return res.status(400).json({ success: false, error: "No docentes provided" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const doc of docentes) {
      await client.query(`
        INSERT INTO alvernia_docentes_evaluacion (
          id, nombre, cedula, cargo, sede_trabajo, dificil_acceso, 
          horas_aula, horas_libres, area_desempeno, tipo_nombramiento, 
          activo, lugar_expedicion_cedula, correo_electronico, numero_celular, firma_docente
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (cedula) DO UPDATE SET 
          nombre = EXCLUDED.nombre,
          cargo = EXCLUDED.cargo,
          sede_trabajo = EXCLUDED.sede_trabajo,
          dificil_acceso = EXCLUDED.dificil_acceso,
          horas_aula = EXCLUDED.horas_aula,
          horas_libres = EXCLUDED.horas_libres,
          area_desempeno = EXCLUDED.area_desempeno,
          tipo_nombramiento = EXCLUDED.tipo_nombramiento,
          activo = EXCLUDED.activo,
          lugar_expedicion_cedula = EXCLUDED.lugar_expedicion_cedula,
          correo_electronico = EXCLUDED.correo_electronico,
          numero_celular = EXCLUDED.numero_celular,
          firma_docente = EXCLUDED.firma_docente,
          updated_at = CURRENT_TIMESTAMP
      `, [
        doc.id || doc.cedula, doc.nombre, doc.cedula, doc.cargo || 'DOCENTE', 
        doc.sedeTrabajo || 'COL ALVERNIA', doc.dificilAcceso || 'No', doc.horasAula || 0, 
        doc.horasLibres || 0, doc.areaDesempeno || '', doc.tipoNombramiento || '', 
        doc.activo ?? true, doc.lugarExpedicionCedula || '', doc.correoElectronico || '',
        doc.numeroCelular || '', doc.firmaDocente || ''
      ]);
    }
    await client.query('COMMIT');
    res.json({ success: true, count: docentes.length });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error bulk upserting docentes evaluacion:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}

async function deleteDocenteEvaluacion(req: any, res: any) {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, message: "CockroachDB pool is not initialized" });
  }
  // El parámetro puede ser cédula o id con prefijo (emp__<cedula>); normalizar.
  let { cedula } = req.params;
  if (cedula && cedula.startsWith('emp__')) {
    cedula = cedula.substring(5);
  }
  try {
    await pool.query("DELETE FROM alvernia_docentes_evaluacion WHERE cedula = $1", [cedula]);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting docente evaluacion:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Rutas con guiones (originales)
app.get("/api/docentes-evaluacion", getDocentesEvaluacion);
app.post("/api/docentes-evaluacion/bulk", bulkUpsertDocentesEvaluacion);
app.delete("/api/docentes-evaluacion/:cedula", deleteDocenteEvaluacion);

// Rutas camelCase (alias para compatibilidad con el frontend)
app.get("/api/docentesEvaluacion", getDocentesEvaluacion);
app.post("/api/docentesEvaluacion/bulk", bulkUpsertDocentesEvaluacion);
app.delete("/api/docentesEvaluacion/:cedula", deleteDocenteEvaluacion);

// Update an employee in CockroachDB
app.put("/api/employees/:cedula", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "CockroachDB no estÃ¡ conectado." });
  }

  const { cedula } = req.params;
  const { nombre, cargo, sedeTrabajo, dificilAcceso, horasAula, horasLibres, areaDesempeno, tipoNombramiento } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      await client.query(`
        UPDATE alvernia_employees SET
          nombre = $1,
          cargo = $2,
          sede_trabajo = $3,
          dificil_acceso = $4,
          horas_aula = $5,
          horas_libres = $6,
          area_desempeno = $7,
          tipo_nombramiento = $8,
          updated_at = NOW()
        WHERE cedula = $9
      `, [nombre, cargo, sedeTrabajo, dificilAcceso, horasAula, horasLibres, areaDesempeno, tipoNombramiento, cedula]);
      
      await client.query("COMMIT");
      res.json({ success: true, message: "Empleado actualizado correctamente." });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error updating employee in CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// --- ACTAS GENERALES ENDPOINTS ---

app.get("/api/actas", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_actas_generales ORDER BY updated_at DESC");
    const mappedActas = rows.map(r => ({
      id: r.id,
      numero: r.numero,
      anio: r.anio,
      fecha: r.fecha,
      lugar: r.lugar,
      hora: r.hora,
      objetivo: r.objetivo,
      ordenDia: r.orden_dia,
      desarrollo: r.desarrollo,
      cuadroInfo: r.cuadro_info,
      cronograma: r.cronograma
    }));
    res.json({ success: true, actas: mappedActas });
  } catch (err: any) {
    console.error("Error fetching actas:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/actas", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    const acta = req.body;
    if (!acta || !acta.id) {
      return res.status(400).json({ error: "Faltan datos del acta" });
    }

    const query = `
      INSERT INTO alvernia_actas_generales (
        id, numero, anio, fecha, lugar, hora, objetivo, orden_dia, desarrollo, cuadro_info, cronograma, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        numero = EXCLUDED.numero,
        anio = EXCLUDED.anio,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        hora = EXCLUDED.hora,
        objetivo = EXCLUDED.objetivo,
        orden_dia = EXCLUDED.orden_dia,
        desarrollo = EXCLUDED.desarrollo,
        cuadro_info = EXCLUDED.cuadro_info,
        cronograma = EXCLUDED.cronograma,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      acta.id, acta.numero, acta.anio, acta.fecha, acta.lugar, acta.hora,
      acta.objetivo, acta.ordenDia, acta.desarrollo, acta.cuadroInfo, JSON.stringify(acta.cronograma || [])
    ];
    await pool.query(query, values);
    res.json({ success: true, id: acta.id });
  } catch (err: any) {
    console.error("Error saving acta:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/actas/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    await pool.query("DELETE FROM alvernia_actas_generales WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting acta:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ACTAS SEGUIMIENTO ENDPOINTS ---

app.get("/api/actas-seguimiento", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_actas_seguimiento ORDER BY updated_at DESC");
    const mappedActas = rows.map(r => ({
      id: r.id,
      numero: r.numero,
      anio: r.anio,
      fecha: r.fecha,
      lugar: r.lugar,
      hora: r.hora,
      objetivo: r.objetivo,
      ordenDia: r.orden_dia,
      desarrollo: r.desarrollo,
      cuadroInfo: r.cuadro_info,
      docentesObservaciones: r.docentes_observaciones
    }));
    res.json({ success: true, actas: mappedActas });
  } catch (err: any) {
    console.error("Error fetching actas seguimiento:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/actas-seguimiento", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    const acta = req.body;
    if (!acta || !acta.id) {
      return res.status(400).json({ error: "Faltan datos del acta de seguimiento" });
    }

    const query = `
      INSERT INTO alvernia_actas_seguimiento (
        id, numero, anio, fecha, lugar, hora, objetivo, orden_dia, desarrollo, cuadro_info, docentes_observaciones, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        numero = EXCLUDED.numero,
        anio = EXCLUDED.anio,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        hora = EXCLUDED.hora,
        objetivo = EXCLUDED.objetivo,
        orden_dia = EXCLUDED.orden_dia,
        desarrollo = EXCLUDED.desarrollo,
        cuadro_info = EXCLUDED.cuadro_info,
        docentes_observaciones = EXCLUDED.docentes_observaciones,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      acta.id, acta.numero, acta.anio, acta.fecha, acta.lugar, acta.hora,
      acta.objetivo, acta.ordenDia, acta.desarrollo, acta.cuadroInfo, JSON.stringify(acta.docentesObservaciones || [])
    ];
    await pool.query(query, values);
    res.json({ success: true, id: acta.id });
  } catch (err: any) {
    console.error("Error saving acta seguimiento:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/actas-seguimiento/:id", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: "CockroachDB no disponible" });

  try {
    await pool.query("DELETE FROM alvernia_actas_seguimiento WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting acta seguimiento:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch institutional & rector parameters from CockroachDB
app.get("/api/alvernia/config", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({
      success: false,
      fallback: true,
      message: "CockroachDB no estÃ¡ conectado o configurado. Usando almacenamiento local."
    });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM alvernia_config WHERE id = 'default_config'");
    if (rows.length > 0) {
      const row = rows[0];
      res.json({
        success: true,
        config: {
          institutionName: row.institution_name,
          institutionDane: row.institution_dane,
          institutionNit: row.institution_nit,
          educationalLevel: row.educational_level,
          calendario: row.calendario,
          appTitle: row.app_title,
          appName: row.app_name,
          rectorName: row.rector_name,
          rectorDocument: row.rector_document,
          rectorDocumentExpedition: row.rector_document_expedition,
          rectorCargo: row.rector_cargo,
          rectorSignature: row.rector_signature,
          logoBase64: row.logo_base64,
          footerMotto: row.footer_motto,
          footerAddress: row.footer_address,
          footerEmails: row.footer_emails,
          footerWebsite: row.footer_website,
          footerCity: row.footer_city,
          ihsConfig: typeof row.ihs_config === "string" ? JSON.parse(row.ihs_config) : row.ihs_config,
          habilitationDates: typeof row.habilitation_dates === "string" ? JSON.parse(row.habilitation_dates) : row.habilitation_dates
        }
      });
    } else {
      res.json({ success: false, message: "No se encontrÃ³ configuraciÃ³n guardada en CockroachDB." });
    }
  } catch (err: any) {
    console.error("Error reading config from CockroachDB:", err);
    res.json({ success: false, fallback: true, error: err.message || err });
  }
});

// Save institutional & rector parameters (including uploading signature to R2)
app.post("/api/alvernia/config", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "CockroachDB no estÃ¡ conectado o configurado. ParÃ¡metros guardados localmente."
    });
  }

  const {
    appTitle,
    appName,
    institutionName,
    institutionDane,
    institutionNit,
    educationalLevel,
    calendario,
    footerMotto,
    footerAddress,
    footerEmails,
    footerWebsite,
    footerCity,
    rectorName,
    rectorDocument,
    rectorDocumentExpedition,
    rectorCargo,
    rectorSignature,
    logoBase64,
    ihsConfig,
    habilitationDates
  } = req.body;

  try {
    let signatureUrl = rectorSignature;
    if (rectorSignature && rectorSignature.startsWith("data:image/")) {
      const match = rectorSignature.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");
        const extension = mimeType.split("/")[1] || "png";
        const key = `evaluaciones/rector/signature_${Date.now()}.${extension}`;
        
        const s3 = getS3Client();
        const bucketName = process.env.R2_BUCKET_NAME;
        if (s3 && bucketName) {
          try {
            const command = new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: buffer,
              ContentType: mimeType,
            });
            await s3.send(command);
            const publicBaseUrl = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${bucketName}`;
            signatureUrl = `${publicBaseUrl}/${key}`;
            console.log(`Uploaded rector signature to Cloudflare R2: ${signatureUrl}`);
          } catch (s3Err) {
            console.error("Error uploading signature to R2:", s3Err);
          }
        }
      }
    }

    await pool.query(`
      INSERT INTO alvernia_config (
        id, app_title, app_name, institution_name, institution_dane, institution_nit, educational_level, calendario,
        footer_motto, footer_address, footer_emails, footer_website, footer_city,
        rector_name, rector_document, rector_document_expedition, rector_cargo, rector_signature, 
        logo_base64, ihs_config, habilitation_dates, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        app_title = EXCLUDED.app_title,
        app_name = EXCLUDED.app_name,
        institution_name = EXCLUDED.institution_name,
        institution_dane = EXCLUDED.institution_dane,
        institution_nit = EXCLUDED.institution_nit,
        educational_level = EXCLUDED.educational_level,
        calendario = EXCLUDED.calendario,
        footer_motto = EXCLUDED.footer_motto,
        footer_address = EXCLUDED.footer_address,
        footer_emails = EXCLUDED.footer_emails,
        footer_website = EXCLUDED.footer_website,
        footer_city = EXCLUDED.footer_city,
        rector_name = EXCLUDED.rector_name,
        rector_document = EXCLUDED.rector_document,
        rector_document_expedition = EXCLUDED.rector_document_expedition,
        rector_cargo = EXCLUDED.rector_cargo,
        rector_signature = EXCLUDED.rector_signature,
        logo_base64 = EXCLUDED.logo_base64,
        ihs_config = EXCLUDED.ihs_config,
        habilitation_dates = EXCLUDED.habilitation_dates,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'default_config',
      appTitle || null,
      appName || null,
      institutionName || null,
      institutionDane || null,
      institutionNit || null,
      educationalLevel || null,
      calendario || null,
      footerMotto || null,
      footerAddress || null,
      footerEmails || null,
      footerWebsite || null,
      footerCity || null,
      rectorName || null,
      rectorDocument || null,
      rectorDocumentExpedition || null,
      rectorCargo || null,
      signatureUrl || null,
      logoBase64 || null,
      ihsConfig ? JSON.stringify(ihsConfig) : null,
      habilitationDates ? JSON.stringify(habilitationDates) : null
    ]);

    res.json({
      success: true,
      message: "ConfiguraciÃ³n y parÃ¡metros actualizados con Ã©xito en CockroachDB y R2.",
      signatureUrl: signatureUrl
    });
  } catch (err: any) {
    console.error("Error saving config to CockroachDB:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Upload evidence files directly to Cloudflare R2
app.post("/api/upload", async (req, res) => {
  const s3 = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  const { fileName, fileType, fileBase64, cedula, period } = req.body;

  if (!fileBase64 || !fileName) {
    return res.status(400).json({ success: false, error: "fileBase64 and fileName are required." });
  }

  // Generate unique path inside bucket
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `evaluaciones/${cedula || "general"}/periodo_${period || 1}/${timestamp}_${safeFileName}`;

  if (!s3 || !bucketName) {
    console.log(`Cloudflare R2 is not configured. Saving ${fileName} locally in simulated mode.`);
    // Since R2 is not connected, return a simulated URL with the file data inside or a placeholder
    // That enables full preview testing
    const simulatedUrl = `https://cloudflare-r2.simulated-storage.io/${key}`;
    return res.json({
      success: true,
      fallback: true,
      message: "Cargado en modo simulaciÃ³n (R2 no configurado aÃºn).",
      url: simulatedUrl,
      key: key
    });
  }

  try {
    // Decode base64
    const buffer = Buffer.from(fileBase64, "base64");

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: fileType || "application/pdf",
    });

    await s3.send(command);
    console.log(`Successfully uploaded ${fileName} to Cloudflare R2 bucket: ${bucketName}/${key}`);

    // Generate public reading URL
    // R2 usually has a custom public domain configured, or we can use a standard R2 endpoint or APP_URL proxy
    const publicBaseUrl = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${bucketName}`;
    const fileUrl = `${publicBaseUrl}/${key}`;

    res.json({
      success: true,
      url: fileUrl,
      key: key
    });
  } catch (err: any) {
    console.error("Error uploading to Cloudflare R2 S3:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});


// --- CRUD API ENDPOINTS FOR MATRICULAS, CERTIFICADOS, PAMA, CONSTANCIAS ---

const genericCRUD = (route: string, tableName: string) => {
  // GET ALL
  app.get(`/api/${route}`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: "DB not connected" });
    try {
      const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json({ data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST (Insert or Update)
  app.post(`/api/${route}`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: "DB not connected" });
    try {
      const data = req.body;
      const id = data.id;
      let isUpdate = false;
      
      if (id) {
        const check = await pool.query(`SELECT 1 FROM ${tableName} WHERE id = $1`, [id]);
        if ((check.rowCount ?? 0) > 0) {
          isUpdate = true;
        }
      }

      if (!isUpdate) {
        // Ensure we have an id if none was provided but we are inserting (only for non-serial tables)
        const serialTables = ['alvernia_matriculas', 'alvernia_constancias', 'alvernia_consecutivos_oficios', 'alvernia_evaluaciones_1278', 'alvernia_docentes_evaluacion', 'alvernia_novedades', 'alvernia_actas_generales', 'alvernia_actas_seguimiento', 'alvernia_agenda_eventos', 'alvernia_tipos_oficio', 'alvernia_responsables', 'alvernia_admins'];
        
        if (!data.id && !serialTables.includes(tableName)) {
          data.id = crypto.randomUUID();
        } else if (!data.id) {
          delete data.id; // ensure it is not inserted as undefined
        }

        const columns = Object.keys(data).join(", ");
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        const result = await pool.query(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`, values);
        res.json({ data: result.rows });
      } else {
        const updates = Object.keys(data).filter(k => k !== 'id').map((k, i) => `${k} = $${i + 2}`).join(", ");
        const values = [id, ...Object.values(data).filter((_, i) => Object.keys(data)[i] !== 'id')];
        const result = await pool.query(`UPDATE ${tableName} SET ${updates} WHERE id = $1 RETURNING *`, values);
        res.json({ data: result.rows });
      }
    } catch (err: any) {
      console.error(`Error saving to ${tableName}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${route}/:id`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: "DB not connected" });
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
      res.json({ data: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
};

app.post("/api/database/clean", async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(500).json({ error: "DB not connected" });

  try {
    const { targets } = req.body;
    if (!Array.isArray(targets)) {
      return res.status(400).json({ error: "Invalid targets array" });
    }

    const tablesToClear: string[] = [];

    if (targets.includes("matriculas")) tablesToClear.push("alvernia_matriculas");
    if (targets.includes("certificados")) tablesToClear.push("alvernia_certificados");
    if (targets.includes("pama")) tablesToClear.push("alvernia_certificados_pama");
    if (targets.includes("constancias")) tablesToClear.push("alvernia_constancias");
    
    if (targets.includes("evaluacion_docente")) {
      tablesToClear.push("alvernia_evaluaciones_1278");
      tablesToClear.push("alvernia_actas_generales");
      tablesToClear.push("alvernia_actas_seguimiento");
    }

    if (targets.includes("docentes_evaluacion")) {
      tablesToClear.push("alvernia_docentes_evaluacion");
    }

    if (targets.includes("configuracion")) {
      tablesToClear.push("alvernia_config");
    }

    if (targets.includes("permisos")) {
      tablesToClear.push("alvernia_employees");
      tablesToClear.push("alvernia_novedades");
    }

    if (targets.includes("agenda")) {
      tablesToClear.push("alvernia_agenda_eventos");
    }

    if (targets.includes("consecutivos")) {
      tablesToClear.push("alvernia_consecutivos_oficios");
    }

    // Process deletions
    for (const table of tablesToClear) {
      await pool.query(`DELETE FROM ${table}`);
    }

    res.json({ success: true, clearedTables: tablesToClear });
  } catch (err: any) {
    console.error("Error cleaning database:", err);
    res.status(500).json({ error: err.message });
  }
});

genericCRUD('matriculas', 'alvernia_matriculas');
genericCRUD('certificados', 'alvernia_certificados');
genericCRUD('certificados-pama', 'alvernia_certificados_pama');
genericCRUD('constancias', 'alvernia_constancias');
genericCRUD('agenda', 'alvernia_agenda_eventos');
genericCRUD('consecutivos', 'alvernia_consecutivos_oficios');
genericCRUD('tipos-oficio', 'alvernia_tipos_oficio');
genericCRUD('responsables', 'alvernia_responsables');

// --- INTEGRATE VITE FOR DEVELOPMENT / SERVE STATIC FOR PRODUCTION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();

