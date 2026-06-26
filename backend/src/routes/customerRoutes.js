import express from "express";
import { customerController } from "../controllers/customerController.js";
import { customerValidator, invoiceValidator } from "../validators/customerValidator.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  requireRoles("Admin", "Operations Staff", "Accounts Staff"),
  customerController.getCustomers
);

router.get(
  "/:id/history",
  requireRoles("Admin", "Operations Staff", "Accounts Staff"),
  customerController.getCustomerHistory
);

router.post(
  "/",
  requireRoles("Admin", "Operations Staff"),
  customerValidator,
  customerController.createCustomer
);

router.put(
  "/:id",
  requireRoles("Admin", "Operations Staff"),
  customerValidator,
  customerController.updateCustomer
);

router.delete(
  "/:id",
  requireRoles("Admin", "Operations Staff"),
  customerController.deleteCustomer
);

router.post(
  "/:id/invoices",
  requireRoles("Admin", "Operations Staff", "Accounts Staff"),
  invoiceValidator,
  customerController.createInvoice
);

export default router;
