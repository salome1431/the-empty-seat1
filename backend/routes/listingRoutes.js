import { Router } from "express";
import { body } from "express-validator";
import * as c from "../controllers/listingController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import validate from "../middleware/validate.js";
import { CATEGORIES } from "../config/constants.js";

const files = upload.fields([{ name: "eventImage", maxCount: 1 }, { name: "ticketProof", maxCount: 1 }]);
const rules = [
  body("category").isIn(CATEGORIES).withMessage("Choose a valid category"),
  body("title").trim().isLength({ min: 3, max: 120 }).withMessage("Title must be 3-120 characters"),
  body("eventDate").isISO8601().withMessage("Enter a valid date and time").bail().custom((v) => new Date(v) > new Date()).withMessage("Event date must be in the future"),
  body("venue").trim().notEmpty().withMessage("Venue is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("price").isFloat({ min: 0 }).withMessage("Enter a valid price"),
  body("originalPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Enter a valid original price"),
  body("totalSeats").optional({ checkFalsy: true }).isInt({ min: 1, max: 10 }).withMessage("Seats must be between 1 and 10"),
  body("description").optional().isLength({ max: 1000 }).withMessage("Description max 1000 characters"),
];

const r = Router();
r.get("/", c.getListings);
r.get("/mine", protect, c.getMyListings); // before /:id
r.post("/", protect, files, rules, validate, c.createListing);
r.get("/:id", c.getListing);
r.put("/:id", protect, files, rules, validate, c.updateListing);
r.delete("/:id", protect, c.deleteListing);
r.put("/:id/status", protect, c.setStatus);
r.get("/:id/proof", protect, c.getProof);
export default r;
