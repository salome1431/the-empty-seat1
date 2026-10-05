import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: ObjectId, ref: "User", required: true },
    reviewedUser: { type: ObjectId, ref: "User", required: true, index: true },
    listing: { type: ObjectId, ref: "Listing", required: true },
    request: { type: ObjectId, ref: "JoinRequest", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);
reviewSchema.index({ reviewer: 1, request: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
