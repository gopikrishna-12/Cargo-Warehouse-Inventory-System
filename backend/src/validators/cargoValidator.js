import { body } from "express-validator";

export const cargoValidator = [
  body("description")
    .notEmpty()
    .withMessage("Description is required"),
  body("status")
    .isIn(["Pending", "Inspected", "Stored", "Ready for Dispatch", "Dispatched", "Delivered"])
    .withMessage("Invalid storage status"),
  body("customer_id")
    .notEmpty()
    .withMessage("Customer ID owner is required")
];
