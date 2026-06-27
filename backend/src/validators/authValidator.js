import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

export const registerValidator = [
  body("company_name")
    .notEmpty()
    .withMessage("Company name is required")
    .trim(),
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("phone")
    .optional()
    .trim(),
  body("address")
    .optional()
    .trim()
];
