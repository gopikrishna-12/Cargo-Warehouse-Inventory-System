import express from "express";
import { cargoController } from "../controllers/cargoController.js";
import { cargoValidator } from "../validators/cargoValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", cargoController.getCargoList);
router.get("/:id", cargoController.getCargoById);

router.post(
  "/",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff", "Customer"),
  cargoValidator,
  cargoController.createCargo
);

router.put(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff", "Customer"),
  cargoValidator,
  cargoController.updateCargo
);

router.delete(
  "/:id",
  requireRoles("Admin", "Operations Staff", "Warehouse Staff", "Customer"),
  cargoController.deleteCargo
);

export default router;
