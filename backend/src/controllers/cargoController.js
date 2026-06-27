import { cargoService } from "../services/cargoService.js";
import { validationResult } from "express-validator";

export const cargoController = {
  async getCargoList(req, res, next) {
    try {
      const { search, status } = req.query;
      const list = await cargoService.getCargoList({
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

  async getCargoById(req, res, next) {
    try {
      const cargo = await cargoService.getCargoById(req.params.id);
      return res.status(200).json(cargo);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async createCargo(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cargo = await cargoService.createCargo(req.body, req.user.email);
      return res.status(201).json(cargo);
    } catch (error) {
      next(error);
    }
  },

  async updateCargo(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cargo = await cargoService.updateCargo(req.params.id, req.body, req.user.email);
      return res.status(200).json(cargo);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async deleteCargo(req, res, next) {
    try {
      await cargoService.deleteCargo(req.params.id, req.user.email);
      return res.status(200).json({ message: "Cargo record deleted successfully." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
