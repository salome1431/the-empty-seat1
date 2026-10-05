import multer from "multer";
import path from "path";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const storage = multer.diskStorage({
  // ticket proofs go to a PRIVATE folder that is never served statically
  destination: (req, file, cb) =>
    cb(null, path.resolve(file.fieldname === "ticketProof" ? "uploads/proofs" : "uploads/public")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${EXT[file.mimetype]}`),
});

export default multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new ApiError(400, "Only JPG, PNG or WEBP images up to 3MB are allowed")),
});
