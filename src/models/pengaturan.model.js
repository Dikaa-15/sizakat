const { pool } = require('../config/database');

async function getCurrent() {
  const [rows] = await pool.execute(
    `SELECT id, zakat_per_jiwa_kg, zakat_per_jiwa_uang
     FROM pengaturan
     ORDER BY id DESC
     LIMIT 1`
  );

  return rows[0] || null;
}

module.exports = {
  getCurrent
};
