import { body } from "express-validator";

export const documentValidator = [
  body("file_url")
    .notEmpty()
    .withMessage("File URL link is required")
    .isURL()
    .withMessage("Must be a valid URL address"),
  body("cargo_id")
    .notEmpty()
    .withMessage("Cargo ID is required")
];
