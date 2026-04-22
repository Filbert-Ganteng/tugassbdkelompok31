import { pool } from '../config/db.js';

export const BookModel = {
  async getAll(title) {
    let query = `
      SELECT 
        b.*,
        a.name AS author_name,
        c.name AS category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
    `;
    const values = [];

    if (title && title.trim() !== '') {
      query += ' WHERE b.title ILIKE $1';
      values.push(`%${title}%`);
    }

    query += ' ORDER BY b.title ASC';

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getById(id) {
    const query = `
      SELECT 
        b.*,
        a.name AS author_name,
        c.name AS category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async create(data) {
    const { isbn, title, author_id, category_id, total_copies } = data;

    const query = `
      INSERT INTO books (isbn, title, author_id, category_id, total_copies, available_copies)
      VALUES ($1, $2, $3, $4, $5, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      isbn,
      title,
      author_id,
      category_id,
      total_copies
    ]);

    return result.rows[0];
  },

  async update(id, data) {
    const { isbn, title, author_id, category_id, total_copies } = data;

    const oldBookResult = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    const oldBook = oldBookResult.rows[0];

    if (!oldBook) return null;

    const borrowedCount = oldBook.total_copies - oldBook.available_copies;

    if (total_copies < borrowedCount) {
      throw new Error(
        `total_copies tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam (${borrowedCount}).`
      );
    }

    const newAvailableCopies = total_copies - borrowedCount;

    const query = `
      UPDATE books
      SET isbn = $1,
          title = $2,
          author_id = $3,
          category_id = $4,
          total_copies = $5,
          available_copies = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(query, [
      isbn,
      title,
      author_id,
      category_id,
      total_copies,
      newAvailableCopies,
      id
    ]);

    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};