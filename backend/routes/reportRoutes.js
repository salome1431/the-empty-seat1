import { Router } from "express";
import { body } from "express-validator";
import { createReport } from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { REPORT_REASONS } from "../config/constants.js";

const r = Router();
r.post("/", protect, [
  body("reason").isIn(REPORT_REASONS).withMessage("Choose a valid reason"),
  body("reportedUser").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid user"),
  body("reportedListing").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid listing"),
  body("description").optional().isLength({ max: 500 }).withMessage("Description max 500 characters"),
], validate, createReport);
export default r;
