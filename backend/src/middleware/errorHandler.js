function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate action detected.", detail: err.keyValue });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed.", detail: err.errors });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid identifier: ${err.value}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error." });
}

module.exports = { notFound, errorHandler };
