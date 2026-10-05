import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort("-createdAt").limit(60);
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: { notifications, unread } });
});

export const unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { unread: await Notification.countDocuments({ user: req.user._id, isRead: false }) } });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw new ApiError(404, "Notification not found");
  res.json({ success: true, data: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});
