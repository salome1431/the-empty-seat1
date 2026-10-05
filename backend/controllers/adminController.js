import User from "../models/User.js";
import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";
import Report from "../models/Report.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import notify from "../utils/notify.js";

export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalListings, activeListings, completedListings, totalRequests, successfulJoins, openReports, suspendedUsers, byCategory, byStatus] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments({ status: { $ne: "removed" } }),
    Listing.countDocuments({ status: { $in: ["active", "requested"] } }),
    Listing.countDocuments({ status: "completed" }),
    JoinRequest.countDocuments(),
    JoinRequest.countDocuments({ status: "completed" }),
    Report.countDocuments({ status: "open" }),
    User.countDocuments({ isSuspended: true }),
    Listing.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    JoinRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  res.json({ success: true, data: { totalUsers, totalListings, activeListings, completedListings, totalRequests, successfulJoins, openReports, suspendedUsers,
    byCategory: byCategory.map((x) => ({ name: x._id, value: x.count })), byStatus: byStatus.map((x) => ({ name: x._id, value: x.count })) } });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = q ? { $or: [{ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }] } : {};
  res.json({ success: true, data: await User.find(filter).sort("-createdAt").limit(200) });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Admins cannot be suspended");
  user.isSuspended = true; user.suspendedReason = req.body.reason || "Violation of platform rules";
  await user.save();
  res.json({ success: true, data: user });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendedReason: "" }, { new: true });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: user });
});

export const getListings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Listing.find().populate("owner", "name email").sort("-createdAt").limit(200) });
});

// "Delete" = soft delete (status removed) so history and reports stay intact
export const removeListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ApiError(404, "Listing not found");
  const open = await JoinRequest.find({ listing: listing._id, status: { $in: ["pending", "accepted"] } });
  for (const r of open) {
    r.status = "cancelled"; await r.save();
    await notify(r.requester, "listing_removed", `"${listing.title}" was removed by an admin.`, listing._id, r._id);
  }
  listing.status = "removed";
  await listing.save();
  await notify(listing.owner, "listing_removed", `Your listing "${listing.title}" was removed by an admin for violating the rules.`, listing._id);
  res.json({ success: true, message: "Listing removed" });
});

export const verifyListing = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["verified", "rejected"].includes(status)) throw new ApiError(400, "Status must be verified or rejected");
  const listing = await Listing.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
  if (!listing) throw new ApiError(404, "Listing not found");
  await notify(listing.owner, "verification", `Your ticket proof for "${listing.title}" was ${status}.`, listing._id);
  res.json({ success: true, data: listing });
});

export const getRequests = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await JoinRequest.find().populate("listing", "title").populate("requester", "name").populate("owner", "name").sort("-createdAt").limit(200) });
});

export const getReports = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Report.find().populate("reporter", "name").populate("reportedUser", "name email isSuspended").populate("reportedListing", "title status").sort("-createdAt").limit(200) });
});

export const updateReport = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!["resolved", "dismissed", "open"].includes(status)) throw new ApiError(400, "Invalid status");
  const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNote: adminNote || "" }, { new: true });
  if (!report) throw new ApiError(404, "Report not found");
  res.json({ success: true, data: report });
});
