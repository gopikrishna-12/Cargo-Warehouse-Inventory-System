import { body } from "express-validator";

export const warehouseValidator = [
  body("address")
    .notEmpty()
    .withMessage("Warehouse address is required")
];
