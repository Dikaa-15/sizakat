const mysql = require('mysql2/promise');

let mysqlPool;
let postgresAdapter;
let activePool;

function getDatabaseMode() {
  const explicit = String(process.env.DB_MODE || '').trim().toLowerCase();
  if (explicit === 'mysql' || explicit === 'supabase' || explicit === 'postgres') {
    return explicit;
  }

  const hasPostgresEnv = Boolean(
    process.env.SUPABASE_DB_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_HOST
  );
  return hasPostgresEnv ? 'supabase' : 'mysql';
}

function getMysqlConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sizakat',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    timezone: 'Z'
  };
}

function getPostgresConfig() {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    '';

  if (connectionString) {
    return {
      connectionString,
      max: Number(process.env.DB_CONNECTION_LIMIT || 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
      ssl: process.env.DB_SSL_DISABLE === 'true' ? false : { rejectUnauthorized: false }
    };
  }

  const host = process.env.SUPABASE_DB_HOST || '';
  const port = Number(process.env.SUPABASE_DB_PORT || 5432);
  const user = process.env.SUPABASE_DB_USER || '';
  const password = process.env.SUPABASE_DB_PASSWORD || '';
  const database = process.env.SUPABASE_DB_NAME || '';

  if (!host || !user || !password || !database) {
    throw new Error(
      'Supabase/Postgres mode requires DATABASE_URL/SUPABASE_DB_URL or full SUPABASE_DB_* credentials.'
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    max: Number(process.env.DB_CONNECTION_LIMIT || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    ssl: process.env.DB_SSL_DISABLE === 'true' ? false : { rejectUnauthorized: false }
  };
}

function normalizeSqlForPostgres(sql) {
  let next = String(sql || '');
  next = next.replace(/`/g, '"');
  next = next.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  next = next.replace(/\bIFNULL\s*\(/gi, 'COALESCE(');
  return next;
}

function convertPlaceholders(sql, values) {
  let idx = 0;
  const converted = String(sql || '').replace(/\?/g, () => {
    idx += 1;
    return `$${idx}`;
  });
  return { sql: converted, values: values || [] };
}

function isRowQuery(command) {
  return command === 'SELECT' || command === 'WITH' || command === 'SHOW';
}

function toMysqlLikeResponse(result) {
  const command = String(result?.command || '').toUpperCase();
  if (isRowQuery(command)) {
    return [result.rows || [], result.fields || []];
  }

  const maybeId =
    result?.rows?.[0]?.id ??
    result?.rows?.[0]?.insert_id ??
    result?.rows?.[0]?.insertid ??
    null;

  return [
    {
      affectedRows: Number(result?.rowCount || 0),
      rowCount: Number(result?.rowCount || 0),
      insertId: maybeId,
      command
    },
    result.fields || []
  ];
}

function createPostgresAdapter(rawPool) {
  return {
    async execute(sql, values) {
      const normalized = normalizeSqlForPostgres(sql);
      const converted = convertPlaceholders(normalized, values);
      const result = await rawPool.query(converted.sql, converted.values);
      return toMysqlLikeResponse(result);
    },
    async query(sql, values) {
      return this.execute(sql, values);
    },
    async getConnection() {
      const client = await rawPool.connect();
      return {
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        async execute(sql, values) {
          const normalized = normalizeSqlForPostgres(sql);
          const converted = convertPlaceholders(normalized, values);
          const result = await client.query(converted.sql, converted.values);
          return toMysqlLikeResponse(result);
        },
        async query(sql, values) {
          return this.execute(sql, values);
        },
        release() {
          client.release();
        }
      };
    },
    async end() {
      await rawPool.end();
    }
  };
}

function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool(getMysqlConfig());
  }
  return mysqlPool;
}

function getPostgresPool() {
  if (!postgresAdapter) {
    let Pool;
    try {
      ({ Pool } = require('pg'));
    } catch (_error) {
      throw new Error("Missing dependency 'pg'. Install with: npm install pg");
    }
    const rawPool = new Pool(getPostgresConfig());
    postgresAdapter = createPostgresAdapter(rawPool);
  }
  return postgresAdapter;
}

function getPool() {
  if (!activePool) {
    const mode = getDatabaseMode();
    activePool = mode === 'supabase' || mode === 'postgres' ? getPostgresPool() : getMysqlPool();
  }
  return activePool;
}

function getDbConfig() {
  const mode = getDatabaseMode();
  return mode === 'supabase' || mode === 'postgres' ? getPostgresConfig() : getMysqlConfig();
}

const pool = {
  execute(...args) {
    return getPool().execute(...args);
  },
  query(...args) {
    return getPool().query(...args);
  },
  getConnection(...args) {
    return getPool().getConnection(...args);
  },
  end(...args) {
    return getPool().end(...args);
  }
};

module.exports = { pool, getPool, getDatabaseMode, getDbConfig };
