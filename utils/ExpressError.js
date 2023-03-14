class ExpressError extends Error {
  constructor(message, statusCode, redirectPath) {
    super();
    this.message = message;
    this.statusCode = statusCode;
    this.redirectPath = redirectPath;
  }
}

module.exports = ExpressError;
