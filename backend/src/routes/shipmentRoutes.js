import express from "express";
import { shipmentController } from "../controllers/shipmentController.js";
import { shipmentValidator } from "../validators/shipmentValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", shipmentController.getShipments);
router.get("/:id", shipmentController.getShipmentById);

router.post(
  "/",
  requireRoles("Admin", "Operations Staff", "Partner"),
  shipmentValidator,
  shipmentController.createShipment
);

router.put(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Partner"),
  shipmentValidator,
  shipmentController.updateShipment
);

router.delete(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Partner"),
  shipmentController.deleteShipment
);

export default router;
