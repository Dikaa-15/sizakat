const { pool } = require('../config/database');

function buildDateClause({ dateFrom, dateTo, column, prefix = 'WHERE' }) {
  const clauses = [];
  const values = [];

  if (dateFrom) {
    clauses.push(`${column} >= ?`);
    values.push(dateFrom);
  }

  if (dateTo) {
    clauses.push(`${column} <= ?`);
    values.push(dateTo);
  }

  if (!clauses.length) {
    return { sql: '', values };
  }

  return { sql: `${prefix} ${clauses.join(' AND ')}`, values };
}

async function getPenerimaanSummary(filters = {}, conn = null) {
  const executor = conn || pool;
  const dateClause = buildDateClause({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    column: 'tanggal_bayar'
  });

  const [[row]] = await executor.query(
    `SELECT
      COUNT(*) AS total_muzakki,
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_kg,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang,
      COALESCE(SUM(sedekah_beras_kg), 0) AS total_sedekah_beras_kg,
      COALESCE(SUM(sedekah_uang), 0) AS total_sedekah_uang
     FROM muzakki
     ${dateClause.sql}`,
    dateClause.values
  );

  return {
    total_muzakki: Number(row.total_muzakki || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0),
    total_sedekah_beras_kg: Number(row.total_sedekah_beras_kg || 0),
    total_sedekah_uang: Number(row.total_sedekah_uang || 0)
  };
}

async function getDistribusiSummary(filters = {}, conn = null) {
  const executor = conn || pool;
  const dateClause = buildDateClause({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    column: 'tanggal_salur',
    prefix: 'AND'
  });

  const [[row]] = await executor.query(
    `SELECT
      COUNT(*) AS total_transaksi,
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_kg,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang
     FROM distribusi
     WHERE status = 'tersalurkan'
     ${dateClause.sql}`,
    dateClause.values
  );

  return {
    total_transaksi: Number(row.total_transaksi || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  };
}

async function getMustahikKategoriCounts(conn = null) {
  const executor = conn || pool;
  const [rows] = await executor.query(
    `SELECT kategori, COUNT(*) AS total
     FROM mustahik
     GROUP BY kategori
     ORDER BY kategori ASC`
  );

  return rows.map((row) => ({
    kategori: row.kategori,
    total: Number(row.total || 0)
  }));
}

async function getDistribusiPerKategori(filters = {}, conn = null) {
  const executor = conn || pool;
  const dateClause = buildDateClause({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    column: 'd.tanggal_salur',
    prefix: 'AND'
  });

  const [rows] = await executor.query(
    `SELECT m.kategori,
            COUNT(d.id) AS total_transaksi,
            COALESCE(SUM(d.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(d.jumlah_uang), 0) AS total_uang
     FROM distribusi d
     INNER JOIN mustahik m ON m.id = d.mustahik_id
     WHERE d.status = 'tersalurkan'
     ${dateClause.sql}
     GROUP BY m.kategori
     ORDER BY m.kategori ASC`,
    dateClause.values
  );

  return rows.map((row) => ({
    kategori: row.kategori,
    total_transaksi: Number(row.total_transaksi || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  }));
}

async function getPenerimaanPerRtRw(filters = {}, conn = null) {
  const executor = conn || pool;
  const joinDateClause = buildDateClause({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    column: 'm.tanggal_bayar',
    prefix: 'AND'
  });

  const [rows] = await executor.query(
    `SELECT r.id AS rt_rw_id, r.rt, r.rw,
            COUNT(m.id) AS total_muzakki,
            COALESCE(SUM(m.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(m.jumlah_uang), 0) AS total_uang,
            COALESCE(SUM(m.sedekah_beras_kg), 0) AS total_sedekah_beras_kg,
            COALESCE(SUM(m.sedekah_uang), 0) AS total_sedekah_uang
     FROM master_rt_rw r
     LEFT JOIN muzakki m ON m.rt_rw_id = r.id ${joinDateClause.sql}
     GROUP BY r.id, r.rt, r.rw
     ORDER BY r.rw ASC, r.rt ASC`,
    joinDateClause.values
  );

  return rows.map((row) => ({
    rt_rw_id: Number(row.rt_rw_id),
    rt: row.rt,
    rw: row.rw,
    total_muzakki: Number(row.total_muzakki || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0),
    total_sedekah_beras_kg: Number(row.total_sedekah_beras_kg || 0),
    total_sedekah_uang: Number(row.total_sedekah_uang || 0)
  }));
}

async function getDistribusiPerRtRw(filters = {}, conn = null) {
  const executor = conn || pool;
  const joinDateClause = buildDateClause({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    column: 'd.tanggal_salur',
    prefix: 'AND'
  });

  const [rows] = await executor.query(
    `SELECT r.id AS rt_rw_id, r.rt, r.rw,
            COUNT(d.id) AS total_distribusi,
            COALESCE(SUM(d.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(d.jumlah_uang), 0) AS total_uang
     FROM master_rt_rw r
     LEFT JOIN mustahik m ON m.rt_rw_id = r.id
     LEFT JOIN distribusi d ON d.mustahik_id = m.id AND d.status = 'tersalurkan' ${joinDateClause.sql}
     GROUP BY r.id, r.rt, r.rw
     ORDER BY r.rw ASC, r.rt ASC`,
    joinDateClause.values
  );

  return rows.map((row) => ({
    rt_rw_id: Number(row.rt_rw_id),
    rt: row.rt,
    rw: row.rw,
    total_distribusi: Number(row.total_distribusi || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  }));
}

async function getSisaZakat(filters = {}, conn = null) {
  const [penerimaan, distribusi] = await Promise.all([
    getPenerimaanSummary(filters, conn),
    getDistribusiSummary(filters, conn)
  ]);

  return {
    sisa_beras_kg: Number((penerimaan.total_beras_kg - distribusi.total_beras_kg).toFixed(2)),
    sisa_uang: Number((penerimaan.total_uang - distribusi.total_uang).toFixed(2))
  };
}

module.exports = {
  getPenerimaanSummary,
  getDistribusiSummary,
  getMustahikKategoriCounts,
  getDistribusiPerKategori,
  getPenerimaanPerRtRw,
  getDistribusiPerRtRw,
  getSisaZakat
};
