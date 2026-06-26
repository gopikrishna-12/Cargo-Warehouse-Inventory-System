import { body } from "express-validator";

export const customerValidator = [
  body("company_name")
    .notEmpty()
    .withMessage("Company name is required"),
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
];

export const invoiceValidator = [
  body("amount")
    .isNumeric()
    .withMessage("Billing amount must be a number")
    .custom(val => val > 0)
    .withMessage("Billing amount must be greater than zero"),
  body("due_date")
    .notEmpty()
    .withMessage("Due date is required")
];
