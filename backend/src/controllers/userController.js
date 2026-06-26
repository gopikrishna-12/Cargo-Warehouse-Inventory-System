import { userService } from "../services/userService.js";
import { validationResult } from "express-validator";

export const userController = {
  async getUsers(req, res, next) {
    try {
      const list = await userService.getUsers();
      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await userService.createUser(req.body, req.user.email);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async updateUser(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user.email);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async toggleStatus(req, res, next) {
    try {
      const user = await userService.toggleUserStatus(req.params.id, req.user.email);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.email);
      return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
};
