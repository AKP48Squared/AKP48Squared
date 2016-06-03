'use strict';
class DeprecatedError extends Error {
  constructor(message) {
    super(message || 'Deprecated method call');
    this.name = 'DeprecationError';
    var oldLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 3;
    Error.captureStackTrace(this, this.constructor);
    Error.stackTraceLimit = oldLimit;
  }
}

module.exports = DeprecatedError;