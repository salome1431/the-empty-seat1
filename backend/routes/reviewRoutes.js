import { Router } from "express";
import { body } from "express-validator";
import { createReview, getUserReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const r = Router();
r.post("/", protect, [
  body("requestId").isMongoId().withMessage("Invalid booking"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1 to 5"),
  body("comment").optional().isLength({ max: 500 }).withMessage("Comment max 500 characters"),
], validate, createReview);
r.get("/user/:id", getUserReviews);
export default r;
