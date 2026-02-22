const { pool } = require('../config/database');

function buildListQuery(filters) {
  const clauses = [];
  const values = [];

  if (filters.rtRwId) {
    clauses.push('m.rt_rw_id = ?');
    values.push(filters.rtRwId);
  }

  if (filters.jenisZakat) {
    clauses.push('m.jenis_zakat = ?');
    values.push(filters.jenisZakat);
  }

  if (filters.dateFrom) {
    clauses.push('m.tanggal_bayar >= ?');
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    clauses.push('m.tanggal_bayar <= ?');
    values.push(filters.dateTo);
  }

  if (filters.search) {
    clauses.push('m.nama LIKE ?');
    values.push(`%${filters.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    query: `SELECT m.id, m.nama, m.rt_rw_id, m.alamat_detail, m.no_hp, m.jumlah_jiwa,
                   m.jenis_zakat, m.jumlah_beras_kg, m.jumlah_uang, m.sedekah_beras_kg,
                   m.sedekah_uang, m.tanggal_bayar,
                   m.keterangan, m.created_by, m.created_at, m.updated_at,
                   r.rt, r.rw
            FROM muzakki m
            INNER JOIN master_rt_rw r ON r.id = m.rt_rw_id
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
    `SELECT m.id, m.nama, m.rt_rw_id, m.alamat_detail, m.no_hp, m.jumlah_jiwa,
            m.jenis_zakat, m.jumlah_beras_kg, m.jumlah_uang, m.sedekah_beras_kg,
            m.sedekah_uang, m.tanggal_bayar,
            m.keterangan, m.created_by, m.created_at, m.updated_at,
            r.rt, r.rw
     FROM muzakki m
     INNER JOIN master_rt_rw r ON r.id = m.rt_rw_id
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(payload) {
  const {
    nama,
    rtRwId,
    alamatDetail,
    noHp,
    jumlahJiwa,
    jenisZakat,
    jumlahBerasKg,
    jumlahUang,
    sedekahBerasKg,
    sedekahUang,
    tanggalBayar,
    keterangan,
    createdBy
  } = payload;

  const [result] = await pool.execute(
    `INSERT INTO muzakki
      (nama, rt_rw_id, alamat_detail, no_hp, jumlah_jiwa, jenis_zakat,
       jumlah_beras_kg, jumlah_uang, sedekah_beras_kg, sedekah_uang,
       tanggal_bayar, keterangan, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      nama,
      rtRwId,
      alamatDetail || null,
      noHp || null,
      jumlahJiwa,
      jenisZakat,
      jumlahBerasKg,
      jumlahUang,
      sedekahBerasKg || 0,
      sedekahUang || 0,
      tanggalBayar,
      keterangan || null,
      createdBy || null
    ]
  );

  return findById(result.insertId);
}

async function update(id, payload) {
  const {
    nama,
    rtRwId,
    alamatDetail,
    noHp,
    jumlahJiwa,
    jenisZakat,
    jumlahBerasKg,
    jumlahUang,
    sedekahBerasKg,
    sedekahUang,
    tanggalBayar,
    keterangan
  } = payload;

  await pool.execute(
    `UPDATE muzakki
     SET nama = ?,
         rt_rw_id = ?,
         alamat_detail = ?,
         no_hp = ?,
         jumlah_jiwa = ?,
         jenis_zakat = ?,
         jumlah_beras_kg = ?,
         jumlah_uang = ?,
         sedekah_beras_kg = ?,
         sedekah_uang = ?,
         tanggal_bayar = ?,
         keterangan = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [
      nama,
      rtRwId,
      alamatDetail || null,
      noHp || null,
      jumlahJiwa,
      jenisZakat,
      jumlahBerasKg,
      jumlahUang,
      sedekahBerasKg || 0,
      sedekahUang || 0,
      tanggalBayar,
      keterangan || null,
      id
    ]
  );

  return findById(id);
}

async function remove(id) {
  await pool.execute('DELETE FROM muzakki WHERE id = ?', [id]);
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove
};
