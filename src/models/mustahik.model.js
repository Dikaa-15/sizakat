const { pool } = require('../config/database');

function buildListQuery(filters) {
  const clauses = [];
  const values = [];

  if (filters.rtRwId) {
    clauses.push('m.rt_rw_id = ?');
    values.push(filters.rtRwId);
  }

  if (filters.kategori) {
    clauses.push('m.kategori = ?');
    values.push(filters.kategori);
  }

  if (filters.search) {
    clauses.push('m.nama LIKE ?');
    values.push(`%${filters.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    query: `SELECT m.id, m.nama, m.kategori, m.rt_rw_id, m.alamat_detail, m.no_hp,
                   m.jumlah_jiwa, m.hak_beras_kg, m.hak_uang, m.created_by,
                   m.created_at, m.updated_at, r.rt, r.rw
            FROM mustahik m
            LEFT JOIN master_rt_rw r ON r.id = m.rt_rw_id
            ${where}
            ORDER BY m.created_at DESC`,
    values
  };
}

async function list(filters) {
  const { query, values } = buildListQuery(filters);
  const [rows] = await pool.execute(query, values);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT m.id, m.nama, m.kategori, m.rt_rw_id, m.alamat_detail, m.no_hp,
            m.jumlah_jiwa, m.hak_beras_kg, m.hak_uang, m.created_by,
            m.created_at, m.updated_at, r.rt, r.rw
     FROM mustahik m
     LEFT JOIN master_rt_rw r ON r.id = m.rt_rw_id
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(payload) {
  const {
    nama,
    kategori,
    rtRwId,
    alamatDetail,
    noHp,
    jumlahJiwa,
    hakBerasKg,
    hakUang,
    createdBy
  } = payload;

  const [result] = await pool.execute(
    `INSERT INTO mustahik
      (nama, kategori, rt_rw_id, alamat_detail, no_hp, jumlah_jiwa,
       hak_beras_kg, hak_uang, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      nama,
      kategori,
      rtRwId,
      alamatDetail || null,
      noHp || null,
      jumlahJiwa,
      hakBerasKg,
      hakUang,
      createdBy || null
    ]
  );

  return findById(result.insertId);
}

async function update(id, payload) {
  const {
    nama,
    kategori,
    rtRwId,
    alamatDetail,
    noHp,
    jumlahJiwa,
    hakBerasKg,
    hakUang
  } = payload;

  await pool.execute(
    `UPDATE mustahik
     SET nama = ?,
         kategori = ?,
         rt_rw_id = ?,
         alamat_detail = ?,
         no_hp = ?,
         jumlah_jiwa = ?,
         hak_beras_kg = ?,
         hak_uang = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [
      nama,
      kategori,
      rtRwId,
      alamatDetail || null,
      noHp || null,
      jumlahJiwa,
      hakBerasKg,
      hakUang,
      id
    ]
  );

  return findById(id);
}

async function remove(id) {
  await pool.execute('DELETE FROM mustahik WHERE id = ?', [id]);
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove
};
