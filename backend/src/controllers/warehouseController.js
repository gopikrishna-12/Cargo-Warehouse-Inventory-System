import { warehouseService } from "../services/warehouseService.js";
import { validationResult } from "express-validator";

export const warehouseController = {
  async getWarehouses(req, res, next) {
    try {
      const list = await warehouseService.getWarehouses();
      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  },

  async getWarehouseById(req, res, next) {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.params.id);
      return res.status(200).json(warehouse);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async createWarehouse(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const warehouse = await warehouseService.createWarehouse(req.body, req.user.email);
      return res.status(201).json(warehouse);
    } catch (error) {
      next(error);
    }
  },

  async updateWarehouse(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body, req.user.email);
      return res.status(200).json(warehouse);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async deleteWarehouse(req, res, next) {
    try {
      await warehouseService.deleteWarehouse(req.params.id, req.user.email);
      return res.status(200).json({ message: "Warehouse zone deleted from database." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
