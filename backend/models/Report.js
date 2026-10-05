import mongoose from "mongoose";
import { REPORT_REASONS } from "../config/constants.js";
const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: "User", required: true },
    reportedUser: { type: ObjectId, ref: "User" },
    reportedListing: { type: ObjectId, ref: "Listing" },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);
export default mongoose.model("Report", reportSchema);
