import mongoose from "mongoose";
import { REQUEST_STATUS } from "../config/constants.js";

const { ObjectId } = mongoose.Schema.Types;
const joinRequestSchema = new mongoose.Schema(
  {
    listing: { type: ObjectId, ref: "Listing", required: true },
    requester: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true, index: true }, // denormalized for fast "received" queries
    seats: { type: Number, default: 1, min: 1 },
    message: { type: String, default: "", maxlength: 300 },
    status: { type: String, enum: REQUEST_STATUS, default: "pending" },
    respondedAt: Date,
  },
  { timestamps: true }
);
// A user can have only ONE request per listing
joinRequestSchema.index({ listing: 1, requester: 1 }, { unique: true });

export default mongoose.model("JoinRequest", joinRequestSchema);
