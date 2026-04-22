import { ReportModel } from '../models/reportModel.js';

export const ReportController = {
  async getStats(req, res) {
    try {
      const stats = await ReportModel.getLibraryStats();
      res.json({
        message: 'Statistik perpustakaan berhasil diambil.',
        data: stats
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};