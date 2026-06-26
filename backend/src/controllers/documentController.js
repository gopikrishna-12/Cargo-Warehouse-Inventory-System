import { documentService } from "../services/documentService.js";
import { validationResult } from "express-validator";

export const documentController = {
  async getDocuments(req, res, next) {
    try {
      const { search } = req.query;
      const list = await documentService.getDocuments({
        search,
        userEmail: req.user.email,
        userRole: req.user.role
      });
      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  },

  async createDocument(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const document = await documentService.createDocument(req.body, req.user.email);
      return res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req, res, next) {
    try {
      await documentService.deleteDocument(req.params.id, req.user.email);
      return res.status(200).json({ message: "Document link deleted successfully." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
