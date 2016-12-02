const statusCodeName = Symbol('StatusCodeName');
const bodyName = Symbol('BodyName');
class ErrorResponse extends Error {
  constructor(statusCode, body) {
    super(body);
    this[statusCodeName] = statusCode;
    this[bodyName] = body;
  }

  toString() {
    return `ErrorResponse: ${this[statusCodeName]} ${this[bodyName]}`;
  }

  get body() {
    return this[bodyName];
  }

  get statusCode() {
    return this[statusCodeName];
  }
}

module.exports = ErrorResponse;
