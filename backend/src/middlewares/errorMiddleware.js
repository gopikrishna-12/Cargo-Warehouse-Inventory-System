export function errorHandler(err, req, res, next) {
  console.error("Express Error Handler caught exception:", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  return res.status(status).json({
    error: message,
    status
  });
}
