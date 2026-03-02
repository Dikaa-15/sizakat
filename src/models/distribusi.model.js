const { pool, getDatabaseMode } = require('../config/database');

function resolveExecutor(conn) {
  return conn || pool;
}

function buildListQuery(filters) {
  const clauses = [];
  const values = [];

  if (filters.status) {
    clauses.push('d.status = ?');
    values.push(filters.status);
  }

  if (filters.jenisDistribusi) {
    clauses.push('d.jenis_distribusi = ?');
    values.push(filters.jenisDistribusi);
  }

  if (filters.search) {
    clauses.push('m.nama LIKE ?');
    values.push(`%${filters.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    query: `SELECT d.id, d.mustahik_id, d.jenis_distribusi, d.jumlah_beras_kg, d.jumlah_uang,
                   d.tanggal_salur, d.status, d.catatan, d.disalurkan_oleh, d.created_at,
                   m.nama AS mustahik_nama, m.kategori AS mustahik_kategori,
                   u.nama AS disalurkan_oleh_nama
            FROM distribusi d
            INNER JOIN mustahik m ON m.id = d.mustahik_id
            LEFT JOIN users u ON u.id = d.disalurkan_oleh
            ${where}
            ORDER BY d.created_at DESC`,
    values
  };
}

async function list(filters, conn = null) {
  const executor = resolveExecutor(conn);
  const { query, values } = buildListQuery(filters);
  const [rows] = await executor.execute(query, values);
  return rows;
}

async function findById(id, conn = null) {
  const executor = resolveExecutor(conn);
  const [rows] = await executor.execute(
    `SELECT d.id, d.mustahik_id, d.jenis_distribusi, d.jumlah_beras_kg, d.jumlah_uang,
            d.tanggal_salur, d.status, d.catatan, d.disalurkan_oleh, d.created_at,
            m.nama AS mustahik_nama, m.kategori AS mustahik_kategori,
            u.nama AS disalurkan_oleh_nama
     FROM distribusi d
     INNER JOIN mustahik m ON m.id = d.mustahik_id
     LEFT JOIN users u ON u.id = d.disalurkan_oleh
     WHERE d.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findMustahikById(id, conn = null) {
  const executor = resolveExecutor(conn);
  const [rows] = await executor.execute(
    `SELECT id, nama, kategori, jumlah_jiwa, hak_beras_kg, hak_uang
     FROM mustahik
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function hasActiveDistribution(mustahikId, conn = null) {
  const executor = resolveExecutor(conn);
  const [rows] = await executor.execute(
    `SELECT id
     FROM distribusi
     WHERE mustahik_id = ? AND status = 'tersalurkan'
     LIMIT 1`,
    [mustahikId]
  );

  return rows.length > 0;
}

async function create(payload, conn = null) {
  const executor = resolveExecutor(conn);
  const {
    mustahikId,
    jenisDistribusi,
    jumlahBerasKg,
    jumlahUang,
    tanggalSalur,
    catatan,
    disalurkanOleh
  } = payload;

  const values = [
    mustahikId,
    jenisDistribusi,
    jumlahBerasKg,
    jumlahUang,
    tanggalSalur,
    catatan || null,
    disalurkanOleh || null
  ];
  const mode = getDatabaseMode();

  if (mode === 'supabase' || mode === 'postgres') {
    const [result] = await executor.execute(
      `INSERT INTO distribusi
        (mustahik_id, jenis_distribusi, jumlah_beras_kg, jumlah_uang,
         tanggal_salur, status, catatan, disalurkan_oleh, created_at)
       VALUES (?, ?, ?, ?, ?, 'tersalurkan', ?, ?, NOW())
       RETURNING id`,
      values
    );
    return result.insertId;
  }

  const [result] = await executor.execute(
    `INSERT INTO distribusi
      (mustahik_id, jenis_distribusi, jumlah_beras_kg, jumlah_uang,
       tanggal_salur, status, catatan, disalurkan_oleh, created_at)
     VALUES (?, ?, ?, ?, ?, 'tersalurkan', ?, ?, NOW())`,
    values
  );

  return result.insertId;
}

async function cancel(id, conn = null) {
  const executor = resolveExecutor(conn);

  await executor.execute(
    `UPDATE distribusi
     SET status = 'batal'
     WHERE id = ?`,
    [id]
  );
}

async function getStockSummary(conn = null) {
  const executor = resolveExecutor(conn);

  const [[penerimaan]] = await executor.query(
    `SELECT
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_masuk,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang_masuk
     FROM muzakki`
  );

  const [[distribusi]] = await executor.query(
    `SELECT
      COALESCE(SUM(jumlah_beras_kg), 0) AS total_beras_keluar,
      COALESCE(SUM(jumlah_uang), 0) AS total_uang_keluar
     FROM distribusi
     WHERE status = 'tersalurkan'`
  );

  const totalBerasMasuk = Number(penerimaan.total_beras_masuk || 0);
  const totalUangMasuk = Number(penerimaan.total_uang_masuk || 0);
  const totalBerasKeluar = Number(distribusi.total_beras_keluar || 0);
  const totalUangKeluar = Number(distribusi.total_uang_keluar || 0);

  return {
    total_beras_masuk: totalBerasMasuk,
    total_uang_masuk: totalUangMasuk,
    total_beras_keluar: totalBerasKeluar,
    total_uang_keluar: totalUangKeluar,
    stok_beras_kg: Number((totalBerasMasuk - totalBerasKeluar).toFixed(2)),
    stok_uang: Number((totalUangMasuk - totalUangKeluar).toFixed(2))
  };
}

async function listMustahikDistributionStatus(conn = null) {
  const executor = resolveExecutor(conn);

  const [rows] = await executor.query(
    `SELECT m.id, m.nama, m.kategori, m.hak_beras_kg, m.hak_uang,
            r.rt, r.rw,
            EXISTS (
              SELECT 1
              FROM distribusi d
              WHERE d.mustahik_id = m.id AND d.status = 'tersalurkan'
            ) AS already_distributed
     FROM mustahik m
     LEFT JOIN master_rt_rw r ON r.id = m.rt_rw_id
     ORDER BY m.nama ASC`
  );

  return rows;
}

module.exports = {
  list,
  findById,
  findMustahikById,
  hasActiveDistribution,
  create,
  cancel,
  getStockSummary,
  listMustahikDistributionStatus
};
