import { reportService } from "../services/reportService.js";

export const reportController = {
  async getStats(req, res, next) {
    try {
      const stats = await reportService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getExportData(req, res, next) {
    try {
      const { table } = req.query;
      const data = await reportService.getReportData(table);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
};
