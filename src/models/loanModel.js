import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const bookCheck = await client.query(
        'SELECT available_copies FROM books WHERE id = $1',
        [book_id]
      );

      if (bookCheck.rows.length === 0) {
        throw new Error('Buku tidak ditemukan.');
      }

      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }

      await client.query(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
        [book_id]
      );

      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await client.query(loanQuery, [
        book_id,
        member_id,
        due_date
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT
        l.*,
        b.title AS book_title,
        m.full_name AS member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      ORDER BY l.loan_date DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  async returnBook(loanId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const loanResult = await client.query(
        'SELECT * FROM loans WHERE id = $1',
        [loanId]
      );

      if (loanResult.rows.length === 0) {
        throw new Error('Data peminjaman tidak ditemukan.');
      }

      const loan = loanResult.rows[0];

      if (loan.status === 'RETURNED') {
        throw new Error('Buku sudah dikembalikan sebelumnya.');
      }

      const updatedLoanResult = await client.query(
        `
        UPDATE loans
        SET status = 'RETURNED',
            return_date = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [loanId]
      );

      const updatedBookResult = await client.query(
        `
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE id = $1
        RETURNING *
        `,
        [loan.book_id]
      );

      if (updatedBookResult.rows.length === 0) {
        throw new Error('Gagal memperbarui stok buku.');
      }

      await client.query('COMMIT');

      return {
        loan: updatedLoanResult.rows[0],
        book: updatedBookResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getTopBorrowers() {
    const query = `
      WITH member_loan_stats AS (
        SELECT
          m.id AS member_id,
          m.full_name,
          m.email,
          m.member_type,
          COUNT(l.id)::int AS total_loans,
          MAX(l.loan_date) AS last_loan_date
        FROM members m
        JOIN loans l ON l.member_id = m.id
        GROUP BY m.id, m.full_name, m.email, m.member_type
      ),
      member_favorite_books AS (
        SELECT
          data.member_id,
          data.title,
          data.times_borrowed
        FROM (
          SELECT
            l.member_id,
            b.title,
            COUNT(*)::int AS times_borrowed,
            ROW_NUMBER() OVER (
              PARTITION BY l.member_id
              ORDER BY COUNT(*) DESC, b.title ASC
            ) AS row_number
          FROM loans l
          JOIN books b ON b.id = l.book_id
          GROUP BY l.member_id, b.title
        ) data
        WHERE data.row_number = 1
      )
      SELECT
        stats.member_id,
        stats.full_name,
        stats.email,
        stats.member_type,
        stats.total_loans,
        stats.last_loan_date,
        fav.title AS favorite_book_title,
        fav.times_borrowed
      FROM member_loan_stats stats
      LEFT JOIN member_favorite_books fav
        ON stats.member_id = fav.member_id
      ORDER BY stats.total_loans DESC, stats.last_loan_date DESC, stats.full_name ASC
      LIMIT 3
    `;

    const result = await pool.query(query);

    return result.rows.map((row) => ({
      member_id: row.member_id,
      full_name: row.full_name,
      email: row.email,
      member_type: row.member_type,
      total_loans: row.total_loans,
      last_loan_date: row.last_loan_date,
      favorite_book: {
        title: row.favorite_book_title,
        times_borrowed: row.times_borrowed
      }
    }));
  }
};
