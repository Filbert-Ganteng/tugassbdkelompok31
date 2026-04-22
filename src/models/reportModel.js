import { pool } from '../config/db.js';

export const ReportModel = {
  async getLibraryStats() {
    const totalBooksQuery = 'SELECT COUNT(*)::int AS total_books FROM books';
    const totalAuthorsQuery = 'SELECT COUNT(*)::int AS total_authors FROM authors';
    const totalCategoriesQuery = 'SELECT COUNT(*)::int AS total_categories FROM categories';
    const activeLoansQuery = `
      SELECT COUNT(*)::int AS total_borrowed_loans
      FROM loans
      WHERE status = 'BORROWED'
    `;

    const [booksResult, authorsResult, categoriesResult, loansResult] = await Promise.all([
      pool.query(totalBooksQuery),
      pool.query(totalAuthorsQuery),
      pool.query(totalCategoriesQuery),
      pool.query(activeLoansQuery)
    ]);

    return {
      total_books: booksResult.rows[0].total_books,
      total_authors: authorsResult.rows[0].total_authors,
      total_categories: categoriesResult.rows[0].total_categories,
      total_borrowed_loans: loansResult.rows[0].total_borrowed_loans
    };
  }
};