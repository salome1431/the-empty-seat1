import User from "../models/User.js";
import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const counts = async (id) => ({
  listingsCount: await Listing.countDocuments({ owner: id, status: { $ne: "removed" } }),
  successfulJoins: await JoinRequest.countDocuments({ status: "completed", $or: [{ requester: id }, { owner: id }] }),
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { ...req.user.toObject(), ...(await counts(req.user._id)) } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, location } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (bio !== undefined) req.user.bio = bio;
  if (location !== undefined) req.user.location = location;
  if (req.file) req.user.profileImage = `/uploads/public/${req.file.filename}`;
  await req.user.save();
  res.json({ success: true, data: req.user });
});

// Public profile: no email / phone
export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("name profileImage bio location ratingAverage ratingCount createdAt isSuspended");
  if (!user || user.isSuspended) throw new ApiError(404, "User not found");
  const listings = await Listing.find({ owner: user._id, status: { $in: ["active", "requested"] } }).sort("-createdAt").limit(6);
  const reviews = await Review.find({ reviewedUser: user._id }).populate("reviewer", "name profileImage").sort("-createdAt").limit(10);
  res.json({ success: true, data: { user, ...(await counts(user._id)), listings, reviews } });
});

export const getSaved = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: "savedListings", populate: { path: "owner", select: "name profileImage ratingAverage" } });
  res.json({ success: true, data: user.savedListings.filter((l) => l.status !== "removed") });
});

export const toggleSaved = asyncHandler(async (req, res) => {
  const id = req.params.listingId;
  if (!(await Listing.exists({ _id: id }))) throw new ApiError(404, "Listing not found");
  const has = req.user.savedListings.some((x) => x.equals(id));
  req.user.savedListings = has ? req.user.savedListings.filter((x) => !x.equals(id)) : [...req.user.savedListings, id];
  await req.user.save();
  res.json({ success: true, data: { saved: !has, savedListings: req.user.savedListings } });
});
