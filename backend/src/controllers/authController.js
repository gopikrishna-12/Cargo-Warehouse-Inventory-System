import { authService } from "../services/authService.js";
import { validationResult } from "express-validator";

export const authController = {
  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  },

  async register(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async logout(req, res, next) {
    try {
      if (req.user) {
        await authService.logout(req.user.email);
      }
      return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      return res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
};
