import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Listing from "../models/Listing.js";
import JoinRequest from "../models/JoinRequest.js";
import Notification from "../models/Notification.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";

// date helper: n days from today at hour:minute
const day = (n, h = 19, m = 30) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d; };

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Listing, JoinRequest, Notification, Review, Report].map((M) => M.deleteMany({})));

const admin = await User.create({ name: "Admin", email: "admin@emptyseat.com", phone: "9000000000", password: "Admin@123", role: "admin", location: "Chennai" });
const u = await User.create([
  { name: "Alex Kumar", email: "alex@example.com", phone: "9876500001", password: "User@123", location: "Chennai", bio: "Movie buff. Always have a spare seat!" },
  { name: "Priya Sharma", email: "priya@example.com", phone: "9876500002", password: "User@123", location: "Bengaluru", bio: "Concert lover and weekend traveller." },
  { name: "Karthik Raj", email: "karthik@example.com", phone: "9876500003", password: "User@123", location: "Chennai", bio: "CSK fan since 2008." },
  { name: "Divya Nair", email: "divya@example.com", phone: "9876500004", password: "User@123", location: "Coimbatore", bio: "Frequent bus traveller." },
  { name: "Rahul Verma", email: "rahul@example.com", phone: "9876500005", password: "User@123", location: "Hyderabad", bio: "College fest organiser." },
  { name: "Sneha Iyer", email: "sneha@example.com", phone: "9876500006", password: "User@123", location: "Mumbai", bio: "Loves trains and tea." },
]);

// [owner, category, title, venue, location, days, hour, seatType, seat, original, price, description]
const rows = [
  [0, "movie", "Avengers: Secret Wars", "PVR Grand Galada", "Chennai", 14, 19, "Recliner", "C12", 350, 250, "Friend backed out. Great seat in the middle row."],
  [0, "movie", "Kalki Part 2 – Night Show", "Sathyam Cinemas", "Chennai", 6, 21, "Premium", "F8", 300, 220, "Second ticket going spare, come watch with me!"],
  [1, "concert", "Arijit Singh Live", "Palace Grounds", "Bengaluru", 25, 18, "Gold", "G-47", 2500, 1800, "Gold zone, close to stage."],
  [1, "concert", "Ilaiyaraaja Live in Concert", "YMCA Grounds", "Chennai", 18, 18, "VIP", "V-12", 3000, 2400, "Cannot attend due to travel."],
  [2, "sports", "CSK vs MI – IPL", "MA Chidambaram Stadium", "Chennai", 20, 19, "Stand", "E-14", 1500, 1200, "Support the yellow army!"],
  [2, "sports", "India vs Australia T20", "Wankhede Stadium", "Mumbai", 40, 19, "Pavilion", "P-3", 4000, 3500, "Pavilion seat with great view."],
  [3, "bus", "Chennai → Madurai AC Sleeper", "Koyambedu Bus Stand", "Chennai", 5, 22, "Lower Berth", "L7", 850, 700, "Overnight bus, 10pm departure."],
  [3, "bus", "Coimbatore → Bengaluru Volvo", "Gandhipuram Bus Stand", "Coimbatore", 9, 21, "Semi Sleeper", "S12", 900, 750, "Window seat."],
  [4, "college", "TechNova Fest – Day 2 Pass", "Anna University", "Chennai", 12, 9, "Entry Pass", "-", 200, 150, "Includes hackathon finale."],
  [4, "college", "Cultural Night: Aarohan", "NIT Trichy Auditorium", "Trichy", 22, 17, "General", "-", 300, 250, "Dance and music night."],
  [5, "train", "Chennai → Bengaluru Shatabdi", "Chennai Central", "Chennai", 8, 6, "CC Chair Car", "CC-32", 1050, 900, "Morning train, window side."],
  [5, "train", "Mumbai → Pune Deccan Queen", "CSMT", "Mumbai", 10, 7, "AC Chair", "C2-18", 600, 500, "Daily commuter seat."],
  [1, "flight", "Chennai → Delhi (IndiGo 6E-211)", "Chennai Airport", "Chennai", 30, 8, "Economy", "14A", 6500, 5200, "Name-change allowed; pls verify first."],
  [3, "other", "Stand-up Comedy: Zakir Khan", "Phoenix Marketcity", "Chennai", 16, 20, "Premium", "H5", 1800, 1400, "Laugh out loud night."],
  [4, "movie", "Leo – FDFS", "Rohini Silver Screens", "Chennai", 4, 6, "Balcony", "B9", 250, 200, "First day first show!"],
  [2, "sports", "Chennaiyin FC vs Kerala Blasters", "Jawaharlal Nehru Stadium", "Chennai", 13, 19, "East Stand", "E-22", 800, 600, "ISL match, great atmosphere."],
];
const listings = await Listing.create(rows.map(([o, category, title, venue, location, d, h, seatType, seatNumber, originalPrice, price, description], i) => ({
  owner: u[o]._id, category, title, venue, location, eventDate: day(d, h), seatType, seatNumber, originalPrice, price, description,
  totalSeats: category === "college" ? 2 : 1, availableSeats: category === "college" ? 2 : 1,
  meetingPoint: `Main entrance, ${venue}`, verificationStatus: i % 3 === 0 ? "verified" : "none",
})));

// Pending request on listing 0 (-> listing becomes "requested")
const r1 = await JoinRequest.create({ listing: listings[0]._id, requester: u[1]._id, owner: u[0]._id, message: "Hi! I'd love to join, I'm a big Marvel fan." });
const r1b = await JoinRequest.create({ listing: listings[0]._id, requester: u[2]._id, owner: u[0]._id, message: "Is this seat still free?" });
await Listing.updateOne({ _id: listings[0]._id }, { status: "requested" });
await Notification.create([
  { user: u[0]._id, type: "new_request", message: "Priya Sharma requested to join \"Avengers: Secret Wars\".", relatedListing: listings[0]._id, relatedRequest: r1._id },
  { user: u[0]._id, type: "new_request", message: "Karthik Raj requested to join \"Avengers: Secret Wars\".", relatedListing: listings[0]._id, relatedRequest: r1b._id },
]);

// Accepted request -> listing 4 reserved
const r2 = await JoinRequest.create({ listing: listings[4]._id, requester: u[0]._id, owner: u[2]._id, status: "accepted", message: "Count me in!", respondedAt: new Date() });
await Listing.updateOne({ _id: listings[4]._id }, { availableSeats: 0, status: "reserved" });
await Notification.create([
  { user: u[0]._id, type: "request_accepted", message: "Your request for \"CSK vs MI – IPL\" was accepted!", relatedListing: listings[4]._id, relatedRequest: r2._id },
  { user: u[2]._id, type: "listing_reserved", message: "All seats for \"CSK vs MI – IPL\" are now reserved.", relatedListing: listings[4]._id },
]);

// Rejected request
const r3 = await JoinRequest.create({ listing: listings[2]._id, requester: u[3]._id, owner: u[1]._id, status: "rejected", respondedAt: new Date() });
await Notification.create({ user: u[3]._id, type: "request_rejected", message: "Your request for \"Arijit Singh Live\" was rejected.", relatedListing: listings[2]._id, relatedRequest: r3._id });

// A completed past trip with reviews on both sides
const past = await Listing.create({ owner: u[3]._id, category: "bus", title: "Coimbatore → Chennai Sleeper", venue: "Gandhipuram", location: "Coimbatore", eventDate: day(-6, 22), seatType: "Sleeper", seatNumber: "U4", originalPrice: 800, price: 650, totalSeats: 1, availableSeats: 0, status: "completed", description: "Completed trip (demo)." });
const r4 = await JoinRequest.create({ listing: past._id, requester: u[5]._id, owner: u[3]._id, status: "completed", respondedAt: day(-8) });
await Review.create([
  { reviewer: u[5]._id, reviewedUser: u[3]._id, listing: past._id, request: r4._id, rating: 5, comment: "Smooth trip, very friendly and punctual!" },
  { reviewer: u[3]._id, reviewedUser: u[5]._id, listing: past._id, request: r4._id, rating: 4, comment: "Good co-traveller. Easy to coordinate with." },
]);
await User.updateOne({ _id: u[3]._id }, { ratingAverage: 5, ratingCount: 1 });
await User.updateOne({ _id: u[5]._id }, { ratingAverage: 4, ratingCount: 1 });
await Notification.create({ user: u[3]._id, type: "new_review", message: "Sneha Iyer gave you 5★ for \"Coimbatore → Chennai Sleeper\".", relatedListing: past._id, isRead: true });

// A report for the admin to handle
await Report.create({ reporter: u[2]._id, reportedListing: listings[12]._id, reportedUser: u[1]._id, reason: "incorrect_info", description: "Flight ticket details look doubtful, please verify." });

console.log("Seed complete!\nAdmin : admin@emptyseat.com / Admin@123\nUsers : alex@example.com, priya@example.com, karthik@example.com, divya@example.com, rahul@example.com, sneha@example.com  (password User@123)");
await mongoose.disconnect();
