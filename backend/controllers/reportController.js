import Report from "../models/Report.js";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createReport = asyncHandler(async (req, res) => {
  const { reportedUser, reportedListing, reason, description } = req.body;
  if (!reportedUser && !reportedListing) throw new ApiError(400, "Choose a user or a listing to report");
  if (reportedUser) {
    if (reportedUser === req.user._id.toString()) throw new ApiError(400, "You cannot report yourself");
    if (!(await User.exists({ _id: reportedUser }))) throw new ApiError(404, "User not found");
  }
  if (reportedListing && !(await Listing.exists({ _id: reportedListing }))) throw new ApiError(404, "Listing not found");
  const report = await Report.create({ reporter: req.user._id, reportedUser: reportedUser || undefined, reportedListing: reportedListing || undefined, reason, description });
  res.status(201).json({ success: true, data: report, message: "Report submitted. Our team will review it." });
});
