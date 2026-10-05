import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import notify from "../utils/notify.js";
import syncListingStatus from "../utils/listingStatus.js";

const LISTING_FIELDS = "title category eventDate venue location price status seatNumber eventImage availableSeats";

// Phone/email of the other person are only visible once the request is accepted
const mask = (r) => {
  const o = r.toObject();
  if (!["accepted", "completed"].includes(o.status)) {
    [o.owner, o.requester].forEach((u) => { if (u && u.name) { delete u.phone; delete u.email; } });
  }
  return o;
};

export const createRequest = asyncHandler(async (req, res) => {
  const { listingId, message } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing || listing.status === "removed") throw new ApiError(404, "Listing not found");
  if (listing.owner.equals(req.user._id)) throw new ApiError(400, "You cannot request your own listing");
  if (!["active", "requested"].includes(listing.status) || listing.availableSeats < 1) throw new ApiError(400, "This seat is no longer available.");
  if (listing.eventDate <= new Date()) throw new ApiError(400, "This event has already started");

  let request = await JoinRequest.findOne({ listing: listing._id, requester: req.user._id });
  if (request) {
    // Only a cancelled request may be re-sent
    if (request.status !== "cancelled")
      throw new ApiError(400, request.status === "rejected" ? "Your earlier request was rejected by the owner" : "You have already requested this seat");
    request.status = "pending"; request.message = message || ""; request.respondedAt = undefined;
    await request.save();
  } else {
    request = await JoinRequest.create({ listing: listing._id, requester: req.user._id, owner: listing.owner, message });
  }
  if (listing.status === "active") { listing.status = "requested"; await listing.save(); }
  await notify(listing.owner, "new_request", `${req.user.name} requested to join "${listing.title}".`, listing._id, request._id);
  res.status(201).json({ success: true, data: request });
});

export const myRequests = asyncHandler(async (req, res) => {
  const list = await JoinRequest.find({ requester: req.user._id }).sort("-createdAt")
    .populate("listing", LISTING_FIELDS).populate("owner", "name profileImage phone email");
  res.json({ success: true, data: list.map(mask) });
});

export const receivedRequests = asyncHandler(async (req, res) => {
  const list = await JoinRequest.find({ owner: req.user._id }).sort("-createdAt")
    .populate("listing", LISTING_FIELDS).populate("requester", "name profileImage phone email ratingAverage ratingCount");
  res.json({ success: true, data: list.map(mask) });
});

export const bookings = asyncHandler(async (req, res) => {
  const list = await JoinRequest.find({ status: { $in: ["accepted", "completed"] }, $or: [{ requester: req.user._id }, { owner: req.user._id }] })
    .sort("-updatedAt").populate("listing", LISTING_FIELDS)
    .populate("owner", "name profileImage phone email").populate("requester", "name profileImage phone email");
  const reviewed = await Review.find({ reviewer: req.user._id, request: { $in: list.map((r) => r._id) } }).select("request");
  const done = new Set(reviewed.map((r) => r.request.toString()));
  res.json({ success: true, data: list.map((r) => ({ ...r.toObject(), hasReviewed: done.has(r._id.toString()) })) });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  // 1) Atomically flip the request pending -> accepted (stops double-accept of the same request)
  const request = await JoinRequest.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: "pending" },
    { status: "accepted", respondedAt: new Date() }, { new: true }
  );
  if (!request) {
    const exists = await JoinRequest.findById(req.params.id);
    if (!exists) throw new ApiError(404, "Request not found");
    if (!exists.owner.equals(req.user._id)) throw new ApiError(403, "Only the listing owner can accept requests");
    throw new ApiError(400, "This request has already been handled");
  }
  // 2) Atomically take the seat ONLY if enough seats are left (prevents over-booking)
  const listing = await Listing.findOneAndUpdate(
    { _id: request.listing, availableSeats: { $gte: request.seats }, status: { $in: ["active", "requested"] } },
    { $inc: { availableSeats: -request.seats } }, { new: true }
  );
  if (!listing) {
    request.status = "pending"; request.respondedAt = undefined; await request.save(); // undo
    throw new ApiError(409, "This seat is no longer available.");
  }
  await notify(request.requester, "request_accepted", `Your request for "${listing.title}" was accepted!`, listing._id, request._id);

  // 3) All seats gone -> reserve listing and auto-reject the rest
  if (listing.availableSeats === 0) {
    const others = await JoinRequest.find({ listing: listing._id, status: "pending" });
    for (const o of others) {
      o.status = "rejected"; o.respondedAt = new Date(); await o.save();
      await notify(o.requester, "request_rejected", `"${listing.title}" has been reserved by another user.`, listing._id, o._id);
    }
    await notify(listing.owner, "listing_reserved", `All seats for "${listing.title}" are now reserved.`, listing._id);
  }
  await syncListingStatus(listing._id);
  res.json({ success: true, data: request });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await JoinRequest.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: "pending" },
    { status: "rejected", respondedAt: new Date() }, { new: true }
  ).populate("listing", "title");
  if (!request) {
    const exists = await JoinRequest.findById(req.params.id);
    if (!exists) throw new ApiError(404, "Request not found");
    if (!exists.owner.equals(req.user._id)) throw new ApiError(403, "Only the listing owner can reject requests");
    throw new ApiError(400, "This request has already been handled");
  }
  await notify(request.requester, "request_rejected", `Your request for "${request.listing.title}" was rejected.`, request.listing._id, request._id);
  await syncListingStatus(request.listing._id);
  res.json({ success: true, data: request });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await JoinRequest.findById(req.params.id).populate("listing", "title status");
  if (!request) throw new ApiError(404, "Request not found");
  if (!request.requester.equals(req.user._id)) throw new ApiError(403, "You can only cancel your own requests");
  if (!["pending", "accepted"].includes(request.status)) throw new ApiError(400, "This request can no longer be cancelled");
  if (request.listing.status === "completed") throw new ApiError(400, "Listing already completed");
  const wasAccepted = request.status === "accepted";
  request.status = "cancelled"; request.respondedAt = new Date();
  await request.save();
  if (wasAccepted) await Listing.updateOne({ _id: request.listing._id }, { $inc: { availableSeats: request.seats } }); // give the seat back
  await syncListingStatus(request.listing._id);
  await notify(request.owner, "request_cancelled", `${req.user.name} cancelled their request for "${request.listing.title}".`, request.listing._id, request._id);
  res.json({ success: true, data: request });
});
