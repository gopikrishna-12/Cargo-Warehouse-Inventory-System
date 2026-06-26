import { body } from "express-validator";

const ROLES = [
  "Admin",
  "Operations Staff",
  "Warehouse Staff",
  "Documentation Executive",
  "Accounts Staff",
  "Customer",
  "Partner"
];

export const userValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim(),
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("role")
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(", ")}`)
];
