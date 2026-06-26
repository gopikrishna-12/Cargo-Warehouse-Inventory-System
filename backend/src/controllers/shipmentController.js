import { shipmentService } from "../services/shipmentService.js";
import { validationResult } from "express-validator";

export const shipmentController = {
  async getShipments(req, res, next) {
    try {
      const { search, status } = req.query;
      const list = await shipmentService.getShipments({
        search,
        status,
        userEmail: req.user.email,
        userRole: req.user.role
      });
      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  },

  async getShipmentById(req, res, next) {
    try {
      const shipment = await shipmentService.getShipmentById(req.params.id);
      return res.status(200).json(shipment);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async createShipment(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const shipment = await shipmentService.createShipment(req.body, req.user.email);
      return res.status(201).json(shipment);
    } catch (error) {
      next(error);
    }
  },

  async updateShipment(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const shipment = await shipmentService.updateShipment(req.params.id, req.body, req.user.email);
      return res.status(200).json(shipment);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async deleteShipment(req, res, next) {
    try {
      await shipmentService.deleteShipment(req.params.id, req.user.email);
      return res.status(200).json({ message: "Shipment record deleted successfully." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
