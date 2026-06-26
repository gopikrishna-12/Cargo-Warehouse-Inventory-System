import express from "express";
import { authController } from "../controllers/authController.js";
import { loginValidator } from "../validators/authValidator.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginValidator, authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
