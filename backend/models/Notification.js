import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    relatedListing: { type: ObjectId, ref: "Listing" },
    relatedRequest: { type: ObjectId, ref: "JoinRequest" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model("Notification", notificationSchema);
