import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const send = (res, user, status = 200) => {
  const data = user.toObject();
  delete data.password; // never send the hash
  res.status(status).json({ success: true, data: { user: data, token: generateToken(user._id) } });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({ name, email, phone, password });
  send(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, "Invalid email or password");
  if (user.isSuspended) throw new ApiError(403, `Your account is suspended. ${user.suspendedReason || ""}`.trim());
  send(res, user);
});

export const me = (req, res) => res.json({ success: true, data: req.user });
