import mongoose from "mongoose";
import { CATEGORIES, LISTING_STATUS } from "../config/constants.js";

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    eventDate: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    seatType: { type: String, default: "Standard", trim: true },
    seatNumber: { type: String, default: "", trim: true },
    totalSeats: { type: Number, default: 1, min: 1, max: 10 },
    availableSeats: { type: Number, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    seatLocation: { type: String, default: "" },
    meetingPoint: { type: String, default: "" },
    notes: { type: String, default: "", maxlength: 500 },
    contactPreference: { type: String, enum: ["in-app", "phone", "email"], default: "in-app" },
    eventImage: { type: String, default: "" },
    ticketProof: { type: String, default: "", select: false }, // private file name
    verificationStatus: { type: String, enum: ["none", "pending", "verified", "rejected"], default: "none" },
    status: { type: String, enum: LISTING_STATUS, default: "active" },
  },
  { timestamps: true }
);
listingSchema.index({ status: 1, eventDate: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ price: 1 });

export default mongoose.model("Listing", listingSchema);
