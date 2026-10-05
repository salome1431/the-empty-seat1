import Review from "../models/Review.js";
import JoinRequest from "../models/JoinRequest.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import notify from "../utils/notify.js";

export const createReview = asyncHandler(async (req, res) => {
  const { requestId, rating, comment } = req.body;
  const request = await JoinRequest.findById(requestId).populate("listing", "title");
  if (!request) throw new ApiError(404, "Booking not found");
  if (request.status !== "completed") throw new ApiError(400, "You can review only after the trip/event is completed");
  const isRequester = request.requester.equals(req.user._id);
  const isOwner = request.owner.equals(req.user._id);
  if (!isRequester && !isOwner) throw new ApiError(403, "You were not part of this booking");
  if (await Review.exists({ reviewer: req.user._id, request: request._id })) throw new ApiError(400, "You have already reviewed this booking");

  const reviewedUser = isRequester ? request.owner : request.requester;
  const review = await Review.create({ reviewer: req.user._id, reviewedUser, listing: request.listing._id, request: request._id, rating, comment });

  // Recalculate the average rating of the reviewed user
  const [stats] = await Review.aggregate([{ $match: { reviewedUser } }, { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  await User.updateOne({ _id: reviewedUser }, { ratingAverage: Math.round(stats.avg * 10) / 10, ratingCount: stats.count });
  await notify(reviewedUser, "new_review", `${req.user.name} gave you ${rating}★ for "${request.listing.title}".`, request.listing._id, request._id);
  res.status(201).json({ success: true, data: review });
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUser: req.params.id }).populate("reviewer", "name profileImage").populate("listing", "title").sort("-createdAt");
  res.json({ success: true, data: reviews });
});
