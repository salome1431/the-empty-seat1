export const notFound = (req, res) => res.status(404).json({ success: false, message: "Route not found" });

export default (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message;
  if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || "Value"} already exists`;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 3MB)" : err.message;
  }
  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Something went wrong. Please try again.";
  }
  res.status(status).json({ success: false, message });
};
