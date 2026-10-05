import { Router } from "express";
import { body } from "express-validator";
import * as c from "../controllers/requestController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const r = Router();
r.use(protect);
r.post("/", [body("listingId").isMongoId().withMessage("Invalid listing"), body("message").optional().isLength({ max: 300 }).withMessage("Message max 300 characters")], validate, c.createRequest);
r.get("/my", c.myRequests);
r.get("/received", c.receivedRequests);
r.get("/bookings", c.bookings);
r.put("/:id/accept", c.acceptRequest);
r.put("/:id/reject", c.rejectRequest);
r.put("/:id/cancel", c.cancelRequest);
export default r;
