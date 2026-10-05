import path from "path";
import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import notify from "../utils/notify.js";
import syncListingStatus from "../utils/listingStatus.js";

const OWNER_FIELDS = "name profileImage ratingAverage ratingCount location bio createdAt";
const TEXT_FIELDS = ["category", "title", "description", "venue", "location", "seatType", "seatNumber", "seatLocation", "meetingPoint", "notes", "contactPreference"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Loads a listing and makes sure the logged-in user owns it
const getOwned = async (req) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.status === "removed") throw new ApiError(404, "Listing not found");
  if (!listing.owner.equals(req.user._id)) throw new ApiError(403, "Only the owner can do this");
  return listing;
};

export const createListing = asyncHandler(async (req, res) => {
  const b = req.body;
  const files = req.files || {};
  const total = Number(b.totalSeats) || 1;
  const data = { owner: req.user._id, eventDate: new Date(b.eventDate), totalSeats: total, availableSeats: total, price: Number(b.price), originalPrice: Number(b.originalPrice) || 0 };
  TEXT_FIELDS.forEach((f) => { if (b[f]) data[f] = b[f]; });
  if (files.eventImage) data.eventImage = `/uploads/public/${files.eventImage[0].filename}`;
  if (files.ticketProof) { data.ticketProof = files.ticketProof[0].filename; data.verificationStatus = "pending"; }
  const listing = await Listing.create(data);
  res.status(201).json({ success: true, data: listing });
});

export const getListings = asyncHandler(async (req, res) => {
  const { q, category, location, date, minPrice, maxPrice, seatType, available, sort = "newest" } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 9, 50);

  const filter = { eventDate: { $gte: new Date() }, status: { $in: available === "true" ? ["active", "requested"] : ["active", "requested", "reserved"] } };
  if (category) filter.category = category;
  if (location) filter.location = new RegExp(escapeRegex(location), "i");
  if (seatType) filter.seatType = new RegExp(escapeRegex(seatType), "i");
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { location: rx }, { venue: rx }, { category: rx }];
  }
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    filter.eventDate = { $gte: start > new Date() ? start : new Date(), $lt: end };
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  const sorts = { newest: { createdAt: -1 }, priceAsc: { price: 1 }, priceDesc: { price: -1 }, date: { eventDate: 1 } };
  const [listings, total] = await Promise.all([
    Listing.find(filter).populate("owner", OWNER_FIELDS).sort(sorts[sort] || sorts.newest).skip((page - 1) * limit).limit(limit),
    Listing.countDocuments(filter),
  ]);
  res.json({ success: true, data: { listings, total, page, pages: Math.ceil(total / limit) } });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id, status: { $ne: "removed" } }).sort("-createdAt");
  res.json({ success: true, data: listings });
});

export const getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner", OWNER_FIELDS);
  if (!listing || listing.status === "removed") throw new ApiError(404, "Listing not found");
  res.json({ success: true, data: listing });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await getOwned(req);
  if (!["active", "requested", "unavailable"].includes(listing.status)) throw new ApiError(400, "This listing can no longer be edited");
  TEXT_FIELDS.forEach((f) => { if (req.body[f] !== undefined) listing[f] = req.body[f]; });
  if (req.body.eventDate) listing.eventDate = new Date(req.body.eventDate);
  if (req.body.price !== undefined) listing.price = Number(req.body.price);
  if (req.body.originalPrice !== undefined) listing.originalPrice = Number(req.body.originalPrice) || 0;
  const files = req.files || {};
  if (files.eventImage) listing.eventImage = `/uploads/public/${files.eventImage[0].filename}`;
  if (files.ticketProof) { listing.ticketProof = files.ticketProof[0].filename; listing.verificationStatus = "pending"; }
  await listing.save();
  res.json({ success: true, data: listing });
});

export const deleteListing = asyncHandler(async (req, res) => {
  const listing = await getOwned(req);
  if (await JoinRequest.exists({ listing: listing._id, status: { $in: ["accepted", "completed"] } }))
    throw new ApiError(400, "This listing has accepted bookings. Cancel it instead of deleting.");
  const pending = await JoinRequest.find({ listing: listing._id, status: "pending" });
  for (const r of pending) await notify(r.requester, "listing_cancelled", `"${listing.title}" was removed by the owner.`);
  await JoinRequest.deleteMany({ listing: listing._id });
  await listing.deleteOne();
  res.json({ success: true, message: "Listing deleted" });
});

export const setStatus = asyncHandler(async (req, res) => {
  const listing = await getOwned(req);
  const { status } = req.body;
  const open = ["active", "requested", "unavailable"];
  const reqs = (s) => JoinRequest.find({ listing: listing._id, status: { $in: s } });

  if (status === "unavailable") {
    if (!["active", "requested"].includes(listing.status)) throw new ApiError(400, "Only open listings can be marked unavailable");
    listing.status = "unavailable";
    await listing.save();
  } else if (status === "active") {
    if (listing.status !== "unavailable") throw new ApiError(400, "Only unavailable listings can be re-opened");
    listing.status = "active";
    await listing.save();
    await syncListingStatus(listing._id);
  } else if (status === "cancelled") {
    if (["completed", "cancelled"].includes(listing.status)) throw new ApiError(400, "Listing is already closed");
    for (const r of await reqs(["pending", "accepted"])) {
      r.status = "cancelled"; r.respondedAt = new Date(); await r.save();
      await notify(r.requester, "listing_cancelled", `"${listing.title}" was cancelled by the owner.`, listing._id, r._id);
    }
    listing.status = "cancelled";
    await listing.save();
  } else if (status === "completed") {
    const accepted = await reqs(["accepted"]);
    if (!accepted.length) throw new ApiError(400, "No accepted bookings to complete");
    for (const r of accepted) {
      r.status = "completed"; await r.save();
      await notify(r.requester, "listing_completed", `"${listing.title}" is complete. Leave a review!`, listing._id, r._id);
    }
    for (const r of await reqs(["pending"])) { r.status = "rejected"; r.respondedAt = new Date(); await r.save(); }
    listing.status = "completed";
    await listing.save();
  } else throw new ApiError(400, "Invalid status");

  res.json({ success: true, data: listing });
});

// Ticket proof is private: only the owner and admins can view it
export const getProof = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).select("+ticketProof owner");
  if (!listing || !listing.ticketProof) throw new ApiError(404, "No proof uploaded");
  if (!listing.owner.equals(req.user._id) && req.user.role !== "admin") throw new ApiError(403, "Not allowed");
  res.sendFile(path.resolve("uploads/proofs", path.basename(listing.ticketProof)));
});
