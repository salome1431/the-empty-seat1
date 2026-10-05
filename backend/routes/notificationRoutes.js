import { Router } from "express";
import * as c from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/", c.getNotifications);
r.get("/count", c.unreadCount);
r.put("/read-all", c.markAllRead);
r.put("/:id/read", c.markRead);
export default r;
