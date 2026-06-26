import express from "express";
import { chatController } from "../controllers/chatController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", chatController.sendMessage);

export default router;
