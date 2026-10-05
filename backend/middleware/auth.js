import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) throw new ApiError(401, "Please log in to continue");
  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Session expired. Please log in again");
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User no longer exists");
  if (user.isSuspended) throw new ApiError(403, "Your account has been suspended");
  req.user = user;
  next();
});

export const adminOnly = (req, res, next) =>
  req.user && req.user.role === "admin" ? next() : next(new ApiError(403, "Admin access required"));
