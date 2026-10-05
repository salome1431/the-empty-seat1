import { Router } from "express";
import { body } from "express-validator";
import { getProfile, updateProfile, getPublicProfile, getSaved, toggleSaved } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import validate from "../middleware/validate.js";

const r = Router();
r.get("/profile", protect, getProfile);
r.put("/profile", protect, upload.single("profileImage"), [
  body("name").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("phone").optional().matches(/^[0-9+\-\s]{10,15}$/).withMessage("Enter a valid phone number"),
  body("bio").optional().isLength({ max: 300 }).withMessage("Bio max 300 characters"),
], validate, updateProfile);
r.get("/saved", protect, getSaved);
r.post("/saved/:listingId", protect, toggleSaved);
r.get("/:id", getPublicProfile); // keep last so it doesn't swallow /profile or /saved
export default r;
