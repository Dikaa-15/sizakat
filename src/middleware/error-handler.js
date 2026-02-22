function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
