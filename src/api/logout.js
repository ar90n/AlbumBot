const sessionStore = require('../lib/sessionStore');
const logger = require('../lib/logger');
const ErrorResponse = require('../lib/ErrorResponse');

module.exports = (hasAuth, sessionId) => {
  if (!hasAuth) {
    logger.log('Reject api call without authorization');
    throw new ErrorResponse(401, 'Reject api call without authorization');
  }

  return sessionStore.update(sessionId, { expireAt: 0 }).then(() => {
    const response = {
      statusCode: 200,
      headers: {},
      body: JSON.stringify({}),
    };
    return Promise.resolve(response);
  });
};
