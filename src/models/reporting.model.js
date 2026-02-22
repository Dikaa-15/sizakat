const { pool } = require('../config/database');

async function getPenerimaanSummary(conn = null) {
  const executor = conn || pool;
  const [[row]] = await executor.query(
    `SELECT
      COUNT(*) AS total_muzakki,
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_kg,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang
     FROM muzakki`
  );

  return {
    total_muzakki: Number(row.total_muzakki || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  };
}

async function getDistribusiSummary(conn = null) {
  const executor = conn || pool;
  const [[row]] = await executor.query(
    `SELECT
      COUNT(*) AS total_transaksi,
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_kg,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang
     FROM distribusi
     WHERE status = 'tersalurkan'`
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

async function getDistribusiPerKategori(conn = null) {
  const executor = conn || pool;
  const [rows] = await executor.query(
    `SELECT m.kategori,
            COUNT(d.id) AS total_transaksi,
            COALESCE(SUM(d.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(d.jumlah_uang), 0) AS total_uang
     FROM distribusi d
     INNER JOIN mustahik m ON m.id = d.mustahik_id
     WHERE d.status = 'tersalurkan'
     GROUP BY m.kategori
     ORDER BY m.kategori ASC`
  );

  return rows.map((row) => ({
    kategori: row.kategori,
    total_transaksi: Number(row.total_transaksi || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  }));
}

async function getPenerimaanPerRtRw(conn = null) {
  const executor = conn || pool;
  const [rows] = await executor.query(
    `SELECT r.id AS rt_rw_id, r.rt, r.rw,
            COUNT(m.id) AS total_muzakki,
            COALESCE(SUM(m.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(m.jumlah_uang), 0) AS total_uang
     FROM master_rt_rw r
     LEFT JOIN muzakki m ON m.rt_rw_id = r.id
     GROUP BY r.id, r.rt, r.rw
     ORDER BY r.rw ASC, r.rt ASC`
  );

  return rows.map((row) => ({
    rt_rw_id: Number(row.rt_rw_id),
    rt: row.rt,
    rw: row.rw,
    total_muzakki: Number(row.total_muzakki || 0),
    total_beras_kg: Number(row.total_beras_kg || 0),
    total_uang: Number(row.total_uang || 0)
  }));
}

async function getDistribusiPerRtRw(conn = null) {
  const executor = conn || pool;
  const [rows] = await executor.query(
    `SELECT r.id AS rt_rw_id, r.rt, r.rw,
            COUNT(d.id) AS total_distribusi,
            COALESCE(SUM(d.jumlah_beras_kg), 0) AS total_beras_kg,
            COALESCE(SUM(d.jumlah_uang), 0) AS total_uang
     FROM master_rt_rw r
     LEFT JOIN mustahik m ON m.rt_rw_id = r.id
     LEFT JOIN distribusi d ON d.mustahik_id = m.id AND d.status = 'tersalurkan'
     GROUP BY r.id, r.rt, r.rw
     ORDER BY r.rw ASC, r.rt ASC`
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

async function getSisaZakat(conn = null) {
  const [penerimaan, distribusi] = await Promise.all([
    getPenerimaanSummary(conn),
    getDistribusiSummary(conn)
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
