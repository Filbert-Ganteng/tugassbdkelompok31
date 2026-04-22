import { pool } from '../config/db.js';

export const CategoryModel = {
  async getAll(name) {
    let query = 'SELECT * FROM categories';
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
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create(name) {
    const query = `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING *
    `;
    const result = await pool.query(query, [name]);
    return result.rows[0];
  },

  async update(id, name) {
    const query = `
      UPDATE categories
      SET name = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};