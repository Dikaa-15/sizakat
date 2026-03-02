const { pool, getDatabaseMode } = require('../config/database');
const distribusiModel = require('../models/distribusi.model');
const { HttpError } = require('../utils/http-error');

const ALLOWED_STATUS = new Set(['tersalurkan', 'batal']);
const ALLOWED_JENIS = new Set(['beras', 'uang']);
const DISTRIBUSI_LOCK_KEY = 'sizakat_distribusi_stock';

async function acquireStockLock(conn) {
  const mode = getDatabaseMode();

  if (mode === 'supabase' || mode === 'postgres') {
    const [rows] = await conn.query(
      "SELECT pg_try_advisory_lock(hashtext(?)) AS locked",
      [DISTRIBUSI_LOCK_KEY]
    );
    return Boolean(rows[0]?.locked);
  }

  const [rows] = await conn.query(
    "SELECT GET_LOCK(?, 5) AS locked",
    [DISTRIBUSI_LOCK_KEY]
  );
  return Number(rows[0]?.locked) === 1;
}

async function releaseStockLock(conn) {
  const mode = getDatabaseMode();

  if (mode === 'supabase' || mode === 'postgres') {
    await conn.query(
      "SELECT pg_advisory_unlock(hashtext(?))",
      [DISTRIBUSI_LOCK_KEY]
    );
    return;
  }

  await conn.query(
    'SELECT RELEASE_LOCK(?)',
    [DISTRIBUSI_LOCK_KEY]
  );
}

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalAmount(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be numeric and > 0`);
  }

  return parsed;
}

function normalizeDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'tanggal_salur is invalid');
  }

  return String(value).slice(0, 10);
}

function determineAmount({ jenisDistribusi, mustahik, requestedBeras, requestedUang }) {
  if (jenisDistribusi === 'beras') {
    const defaultBeras = Number(mustahik.hak_beras_kg || 0);
    const jumlahBerasKg = requestedBeras !== null ? requestedBeras : defaultBeras;

    if (jumlahBerasKg <= 0) {
      throw new HttpError(400, 'jumlah_beras_kg must be > 0');
    }

    return { jumlahBerasKg, jumlahUang: null };
  }

  const defaultUang = Number(mustahik.hak_uang || 0);
  const jumlahUang = requestedUang !== null ? requestedUang : defaultUang;

  if (jumlahUang <= 0) {
    throw new HttpError(400, 'jumlah_uang must be > 0');
  }

  return { jumlahBerasKg: null, jumlahUang };
}

async function list(req, res, next) {
  try {
    const filters = {
      search: parseOptionalString(req.query.search),
      status: parseOptionalString(req.query.status),
      jenisDistribusi: parseOptionalString(req.query.jenis_distribusi)
    };

    if (filters.status && !ALLOWED_STATUS.has(filters.status)) {
      throw new HttpError(400, 'status filter is invalid');
    }

    if (filters.jenisDistribusi && !ALLOWED_JENIS.has(filters.jenisDistribusi)) {
      throw new HttpError(400, 'jenis_distribusi filter is invalid');
    }

    const [data, stock] = await Promise.all([
      distribusiModel.list(filters),
      distribusiModel.getStockSummary()
    ]);

    return res.json({ data, stock });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const conn = await pool.getConnection();
  let transactionStarted = false;
  let lockAcquired = false;

  try {
    const mustahikId = parsePositiveInt(req.body.mustahik_id, 'mustahik_id');
    const jenisDistribusi = parseOptionalString(req.body.jenis_distribusi);

    if (!jenisDistribusi || !ALLOWED_JENIS.has(jenisDistribusi)) {
      throw new HttpError(400, 'jenis_distribusi must be beras or uang');
    }

    const requestedBeras = parseOptionalAmount(req.body.jumlah_beras_kg, 'jumlah_beras_kg');
    const requestedUang = parseOptionalAmount(req.body.jumlah_uang, 'jumlah_uang');

    const locked = await acquireStockLock(conn);
    if (!locked) {
      throw new HttpError(423, 'Sistem sedang memproses distribusi lain, coba lagi');
    }
    lockAcquired = true;

    await conn.beginTransaction();
    transactionStarted = true;

    const mustahik = await distribusiModel.findMustahikById(mustahikId, conn);
    if (!mustahik) {
      throw new HttpError(404, 'Mustahik not found');
    }

    const alreadyDistributed = await distribusiModel.hasActiveDistribution(mustahikId, conn);
    if (alreadyDistributed) {
      throw new HttpError(400, 'Mustahik already has active distribusi');
    }

    const amount = determineAmount({
      jenisDistribusi,
      mustahik,
      requestedBeras,
      requestedUang
    });

    const stock = await distribusiModel.getStockSummary(conn);

    if (jenisDistribusi === 'beras' && stock.stok_beras_kg < amount.jumlahBerasKg) {
      throw new HttpError(400, 'Stok beras tidak cukup untuk distribusi');
    }

    if (jenisDistribusi === 'uang' && stock.stok_uang < amount.jumlahUang) {
      throw new HttpError(400, 'Stok uang tidak cukup untuk distribusi');
    }

    const insertedId = await distribusiModel.create(
      {
        mustahikId,
        jenisDistribusi,
        jumlahBerasKg: amount.jumlahBerasKg,
        jumlahUang: amount.jumlahUang,
        tanggalSalur: normalizeDate(req.body.tanggal_salur),
        catatan: parseOptionalString(req.body.catatan),
        disalurkanOleh: req.user?.sub || null
      },
      conn
    );

    await conn.commit();
    transactionStarted = false;

    const [data, latestStock] = await Promise.all([
      distribusiModel.findById(insertedId),
      distribusiModel.getStockSummary()
    ]);

    return res.status(201).json({
      message: 'Distribusi berhasil disalurkan',
      data,
      stock: latestStock
    });
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    return next(error);
  } finally {
    if (lockAcquired) {
      try {
        await releaseStockLock(conn);
      } catch (_error) {
        // ignore lock release errors
      }
    }
    conn.release();
  }
}

async function cancel(req, res, next) {
  const conn = await pool.getConnection();
  let transactionStarted = false;
  let lockAcquired = false;

  try {
    const id = parsePositiveInt(req.params.id, 'id');

    const locked = await acquireStockLock(conn);
    if (!locked) {
      throw new HttpError(423, 'Sistem sedang memproses distribusi lain, coba lagi');
    }
    lockAcquired = true;

    await conn.beginTransaction();
    transactionStarted = true;

    const existing = await distribusiModel.findById(id, conn);
    if (!existing) {
      throw new HttpError(404, 'Distribusi not found');
    }

    if (existing.status === 'batal') {
      throw new HttpError(400, 'Distribusi already canceled');
    }

    await distribusiModel.cancel(id, conn);

    await conn.commit();
    transactionStarted = false;

    const [data, stock] = await Promise.all([
      distribusiModel.findById(id),
      distribusiModel.getStockSummary()
    ]);

    return res.json({
      message: 'Distribusi dibatalkan',
      data,
      stock
    });
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    return next(error);
  } finally {
    if (lockAcquired) {
      try {
        await releaseStockLock(conn);
      } catch (_error) {
        // ignore lock release errors
      }
    }
    conn.release();
  }
}

module.exports = {
  list,
  create,
  cancel
};
