require('dotenv').config();

const { pool, getDatabaseMode, getDbConfig } = require('../config/database');

function getSafeConfig() {
  const config = getDbConfig();
  return {
    ...config,
    password: config.password ? '***' : config.password,
    connectionString: config.connectionString ? '***' : undefined
  };
}

(async () => {
  const mode = getDatabaseMode();
  const safeConfig = getSafeConfig();

  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    // eslint-disable-next-line no-console
    console.log('[db-check] OK', { mode, ping: rows[0], config: safeConfig });
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db-check] FAILED', {
      mode,
      code: error.code,
      message: error.message,
      config: safeConfig
    });
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (_error) {
      // ignore pool close errors
    }
  }
})();
