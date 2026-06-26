import express from "express";
import { reportController } from "../controllers/reportController.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/stats", reportController.getStats);
router.get(
  "/export",
  requireRoles("Admin", "Operations Staff", "Accounts Staff"),
  reportController.getExportData
);

export default router;
