require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool, getDatabaseMode } = require('../config/database');

function getDbConfigSummary() {
  const mode = getDatabaseMode();
  if (mode === 'supabase' || mode === 'postgres') {
    return {
      mode,
      host: process.env.SUPABASE_DB_HOST || '(from DATABASE_URL)',
      port: Number(process.env.SUPABASE_DB_PORT || 5432),
      user: process.env.SUPABASE_DB_USER || '(from DATABASE_URL)',
      database: process.env.SUPABASE_DB_NAME || '(from DATABASE_URL)'
    };
  }

  return {
    mode,
    host: process.env.DB_HOST || '(unset)',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || '(unset)',
    database: process.env.DB_NAME || '(unset)'
  };
}

function getDatabaseLabel(mode) {
  return mode === 'supabase' || mode === 'postgres' ? 'Supabase/Postgres' : 'MySQL';
}

async function assertDbConnection() {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    const db = getDbConfigSummary();
    const label = getDatabaseLabel(db.mode);
    const enhancedError = new Error(
      `Database connection failed (${error.code || 'UNKNOWN'}). ` +
        `Check ${label} service and env DB config: host=${db.host}, port=${db.port}, user=${db.user}, database=${db.database}.`
    );
    enhancedError.cause = error;
    throw enhancedError;
  }
}

async function run() {
  await assertDbConnection();

  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
  const mode = getDatabaseMode();

  if (mode === 'supabase' || mode === 'postgres') {
    await pool.execute(
      `INSERT INTO users (username, password, nama, role)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (username) DO UPDATE
         SET password = EXCLUDED.password,
             nama = EXCLUDED.nama,
             role = EXCLUDED.role`,
      ['admin', passwordHash, 'Administrator SiZakat', 'admin']
    );
  } else {
    await pool.execute(
      `INSERT INTO users (username, password, nama, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password = VALUES(password),
         nama = VALUES(nama),
         role = VALUES(role)`,
      ['admin', passwordHash, 'Administrator SiZakat', 'admin']
    );
  }

  const [rows] = await pool.execute('SELECT id FROM pengaturan LIMIT 1');

  if (rows.length === 0) {
    await pool.execute(
      `INSERT INTO pengaturan
      (tahun_hijriah, nama_masjid, alamat_masjid, harga_beras_per_kg, zakat_per_jiwa_kg, zakat_per_jiwa_uang, ketua_dkm, sekretaris, bendahara)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['1447H', 'Masjid Contoh', 'Alamat Masjid', 16000, 3.5, 50000, null, null, null]
    );
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed. Default admin -> username: admin, password: from SEED_ADMIN_PASSWORD (fallback: admin123)');
}

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch (_error) {
      // ignore pool close errors
    }
  });
