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
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);

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

      const updateLoanQuery = `
        UPDATE loans
        SET status = 'RETURNED',
            return_date = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const updatedLoanResult = await client.query(updateLoanQuery, [loanId]);

      const updateBookQuery = `
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE id = $1
        RETURNING *
      `;
      const updatedBookResult = await client.query(updateBookQuery, [loan.book_id]);

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
  }
};