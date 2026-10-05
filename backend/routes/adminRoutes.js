import { Router } from "express";
import * as c from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const r = Router();
r.use(protect, adminOnly); // every admin route needs login + admin role
r.get("/stats", c.getStats);
r.get("/users", c.getUsers);
r.put("/users/:id/suspend", c.suspendUser);
r.put("/users/:id/unsuspend", c.unsuspendUser);
r.get("/listings", c.getListings);
r.delete("/listings/:id", c.removeListing);
r.put("/listings/:id/verify", c.verifyListing);
r.get("/requests", c.getRequests);
r.get("/reports", c.getReports);
r.put("/reports/:id", c.updateReport);
export default r;
