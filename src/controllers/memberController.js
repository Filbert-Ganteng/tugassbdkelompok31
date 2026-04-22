import { MemberModel } from '../models/memberModel.js';

export const MemberController = {
  async getAllMembers(req, res) {
    try {
      const members = await MemberModel.getAll();
      res.json(members);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getMemberById(req, res) {
    try {
      const { id } = req.params;
      const member = await MemberModel.getById(id);

      if (!member) {
        return res.status(404).json({ error: 'Member tidak ditemukan.' });
      }

      res.json(member);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async registerMember(req, res) {
    try {
      const newMember = await MemberModel.create(req.body);
      res.status(201).json({
        message: 'Anggota berhasil didaftarkan!',
        data: newMember
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateMember(req, res) {
    try {
      const { id } = req.params;
      const updatedMember = await MemberModel.update(id, req.body);

      if (!updatedMember) {
        return res.status(404).json({ error: 'Member tidak ditemukan.' });
      }

      res.json({
        message: 'Data member berhasil diperbarui.',
        data: updatedMember
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteMember(req, res) {
    try {
      const { id } = req.params;
      const deletedMember = await MemberModel.delete(id);

      if (!deletedMember) {
        return res.status(404).json({ error: 'Member tidak ditemukan.' });
      }

      res.json({
        message: 'Member berhasil dihapus.',
        data: deletedMember
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};