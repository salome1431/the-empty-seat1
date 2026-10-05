import Notification from "../models/Notification.js";

// Create an in-app notification. Never lets a notification failure break the main action.
export default async function notify(user, type, message, relatedListing, relatedRequest) {
  try {
    await Notification.create({ user, type, message, relatedListing, relatedRequest });
  } catch (e) {
    console.error("notify failed:", e.message);
  }
}
