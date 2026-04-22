import { CategoryModel } from '../models/categoryModel.js';

export const CategoryController = {
  async getCategories(req, res) {
    try {
      const { name } = req.query;
      const categories = await CategoryModel.getAll(name);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.getById(id);

      if (!category) {
        return res.status(404).json({ error: 'Category tidak ditemukan.' });
      }

      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async addCategory(req, res) {
    try {
      const category = await CategoryModel.create(req.body.name);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const category = await CategoryModel.update(id, name);

      if (!category) {
        return res.status(404).json({ error: 'Category tidak ditemukan.' });
      }

      res.json({
        message: 'Category berhasil diperbarui.',
        data: category
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const deletedCategory = await CategoryModel.delete(id);

      if (!deletedCategory) {
        return res.status(404).json({ error: 'Category tidak ditemukan.' });
      }

      res.json({
        message: 'Category berhasil dihapus.',
        data: deletedCategory
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};