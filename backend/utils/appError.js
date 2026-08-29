class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.status = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
