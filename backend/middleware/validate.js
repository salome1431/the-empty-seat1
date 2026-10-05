import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

export default (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  next(new ApiError(400, errors.array()[0].msg));
};
