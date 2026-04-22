import { AuthorModel } from '../models/authorModel.js';

export const AuthorController = {
  async getAuthors(req, res) {
    try {
      const { name } = req.query;
      const authors = await AuthorModel.getAll(name);
      res.json(authors);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAuthorById(req, res) {
    try {
      const { id } = req.params;
      const author = await AuthorModel.getById(id);

      if (!author) {
        return res.status(404).json({ error: 'Author tidak ditemukan.' });
      }

      res.json(author);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async addAuthor(req, res) {
    try {
      const { name, nationality } = req.body;
      const author = await AuthorModel.create(name, nationality);
      res.status(201).json(author);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateAuthor(req, res) {
    try {
      const { id } = req.params;
      const { name, nationality } = req.body;

      const author = await AuthorModel.update(id, name, nationality);

      if (!author) {
        return res.status(404).json({ error: 'Author tidak ditemukan.' });
      }

      res.json({
        message: 'Author berhasil diperbarui.',
        data: author
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteAuthor(req, res) {
    try {
      const { id } = req.params;
      const deletedAuthor = await AuthorModel.delete(id);

      if (!deletedAuthor) {
        return res.status(404).json({ error: 'Author tidak ditemukan.' });
      }

      res.json({
        message: 'Author berhasil dihapus.',
        data: deletedAuthor
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};