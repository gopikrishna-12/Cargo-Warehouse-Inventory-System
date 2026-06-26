import express from "express";
import { themeController } from "../controllers/themeController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/theme", themeController.getTheme);
router.post("/theme", themeController.setTheme);

router.get("/notifications", themeController.getNotifications);
router.put("/notifications/read", themeController.markNotificationsRead);

export default router;
