import express from "express";
import { documentController } from "../controllers/documentController.js";
import { documentValidator } from "../validators/documentValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", documentController.getDocuments);

router.post(
  "/",
  requireRoles("Admin", "Operations Staff", "Documentation Executive", "Customer"),
  documentValidator,
  documentController.createDocument
);

router.delete(
  "/:id",
  requireRoles("Admin", "Operations Staff"),
  documentController.deleteDocument
);

export default router;
