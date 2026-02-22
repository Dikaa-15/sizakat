const { pool } = require('../config/database');

async function findByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT id, username, password, nama, role
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, username, nama, role, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  findByUsername,
  findById
};
