import { customerService } from "../services/customerService.js";
import { validationResult } from "express-validator";

export const customerController = {
  async getCustomers(req, res, next) {
    try {
      const { search } = req.query;
      const list = await customerService.getCustomers({ search });
      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  },

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async createCustomer(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customer = await customerService.createCustomer(req.body, req.user.email);
      return res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body, req.user.email);
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async deleteCustomer(req, res, next) {
    try {
      await customerService.deleteCustomer(req.params.id, req.user.email);
      return res.status(200).json({ message: "Customer client removed from database." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async getCustomerHistory(req, res, next) {
    try {
      const history = await customerService.getCustomerHistory(req.params.id);
      return res.status(200).json(history);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async createInvoice(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const invoice = await customerService.createInvoice(req.params.id, req.body, req.user.email);
      return res.status(201).json(invoice);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
