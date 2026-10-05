import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";

// Recalculate listing status from seats left and pending requests
export default async function syncListingStatus(listingId) {
  const l = await Listing.findById(listingId);
  if (!l || !["active", "requested", "reserved"].includes(l.status)) return;
  if (l.availableSeats <= 0) l.status = "reserved";
  else {
    const pending = await JoinRequest.countDocuments({ listing: l._id, status: "pending" });
    l.status = pending > 0 ? "requested" : "active";
  }
  await l.save();
}
