import { Router } from "express";
import { body } from "express-validator";
import { register, login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const r = Router();
r.post("/register", [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("phone").matches(/^[0-9+\-\s]{10,15}$/).withMessage("Enter a valid phone number"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
], validate, register);
r.post("/login", [body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(), body("password").notEmpty().withMessage("Password is required")], validate, login);
r.get("/me", protect, me);
export default r;
