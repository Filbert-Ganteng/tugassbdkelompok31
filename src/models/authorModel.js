import { pool } from '../config/db.js';

export const AuthorModel = {
  async getAll(name) {
    let query = 'SELECT * FROM authors';
    const values = [];

    if (name && name.trim() !== '') {
      query += ' WHERE name ILIKE $1';
      values.push(`%${name}%`);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create(name, nationality) {
    const query = `
      INSERT INTO authors (name, nationality)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [name, nationality]);
    return result.rows[0];
  },

  async update(id, name, nationality) {
    const query = `
      UPDATE authors
      SET name = $1, nationality = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [name, nationality, id]);
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM authors WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};