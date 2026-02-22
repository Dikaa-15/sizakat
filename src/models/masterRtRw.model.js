const { pool } = require('../config/database');

async function listAll() {
  const [rows] = await pool.execute(
    `SELECT id, rt, rw, nama_ketua_rt, jumlah_kk, keterangan, is_active, created_at
     FROM master_rt_rw
     ORDER BY rw ASC, rt ASC`
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, rt, rw, nama_ketua_rt, jumlah_kk, keterangan, is_active, created_at
     FROM master_rt_rw
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(payload) {
  const { rt, rw, namaKetuaRt, jumlahKk, keterangan } = payload;

  const [result] = await pool.execute(
    `INSERT INTO master_rt_rw (rt, rw, nama_ketua_rt, jumlah_kk, keterangan, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW())`,
    [rt, rw, namaKetuaRt || null, jumlahKk || null, keterangan || null]
  );

  return findById(result.insertId);
}

async function update(id, payload) {
  const { rt, rw, namaKetuaRt, jumlahKk, keterangan, isActive } = payload;

  await pool.execute(
    `UPDATE master_rt_rw
     SET rt = ?,
         rw = ?,
         nama_ketua_rt = ?,
         jumlah_kk = ?,
         keterangan = ?,
         is_active = ?
     WHERE id = ?`,
    [rt, rw, namaKetuaRt || null, jumlahKk || null, keterangan || null, isActive, id]
  );

  return findById(id);
}

async function softDelete(id) {
  await pool.execute(
    `UPDATE master_rt_rw
     SET is_active = 0
     WHERE id = ?`,
    [id]
  );

  return findById(id);
}

module.exports = {
  listAll,
  findById,
  create,
  update,
  softDelete
};
