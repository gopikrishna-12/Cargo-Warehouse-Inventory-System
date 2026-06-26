import express from "express";
import { userController } from "../controllers/userController.js";
import { userValidator } from "../validators/userValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles("Admin")); // Only Admin role manages system users

router.get("/", userController.getUsers);
router.post("/", userValidator, userController.createUser);
router.put("/:id", userValidator, userController.updateUser);
router.patch("/:id/status", userController.toggleStatus);
router.delete("/:id", userController.deleteUser);

export default router;
