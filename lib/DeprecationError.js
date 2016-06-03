'use strict';
class DeprecatedError extends Error {
  constructor(message, caller) {
    super(message || 'Deprecated method call');
    this.name = 'DeprecationError';
    var oldLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 3;
    Error.captureStackTrace(this, caller || this.constructor);
    Error.stackTraceLimit = oldLimit;
  }
}

module.exports = DeprecatedError;