const sessionStore = require('../lib/sessionStore');
const logger = require('../lib/logger');
const cookie = require('cookie');
const ErrorResponse = require('../lib/ErrorResponse');

module.exports = (hasAuth, sessionId) => {
  if (!hasAuth) {
    logger.log('Reject api call without authorization');
    throw new ErrorResponse(401, 'Reject api call without authorization');
  }

  return sessionStore.update(sessionId, { expireAt: 0 }).then(() => {
    const maxAge = 0;
    const path = '/';
    const secure = true;
    const httpOnly = true;
    const cookieValueStr = cookie.serialize('sessionId', sessionId, { maxAge, path, secure, httpOnly });
    const response = {
      statusCode: 200,
      headers: { 'Set-Cookie': cookieValueStr },
      body: JSON.stringify({}),
    };
    return Promise.resolve(response);
  });
};
