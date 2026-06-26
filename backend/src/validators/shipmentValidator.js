import { body } from "express-validator";

export const shipmentValidator = [
  body("origin")
    .notEmpty()
    .withMessage("Origin details are required"),
  body("destination")
    .notEmpty()
    .withMessage("Destination details are required"),
  body("status")
    .isIn(["Pending", "In Transit", "Delayed", "Delivered"])
    .withMessage("Invalid shipment status"),
  body("cargo_id")
    .notEmpty()
    .withMessage("Cargo ID is required")
];
