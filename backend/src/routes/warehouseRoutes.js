import express from "express";
import { warehouseController } from "../controllers/warehouseController.js";
import { warehouseValidator } from "../validators/warehouseValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", warehouseController.getWarehouses);
router.get("/:id", warehouseController.getWarehouseById);

router.post(
  "/",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff"),
  warehouseValidator,
  warehouseController.createWarehouse
);

router.put(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff"),
  warehouseValidator,
  warehouseController.updateWarehouse
);

router.delete(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff"),
  warehouseController.deleteWarehouse
);

export default router;
