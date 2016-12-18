const talkStore = require('../lib/talkStore');
const passGenerator = require('../lib/passGenerator');
const sessionAuthorizer = require('../lib/sessionAuthorizer');
const logger = require('../lib/logger');
const cookie = require('cookie');
const ErrorResponse = require('../lib/ErrorResponse');

module.exports = (hasAuth, dummy0, talkId, dummy1, bodyParams) => {
  const passPhrase = bodyParams.passPhrase;
  const autoLogin = bodyParams.autoLogin;
  const passHash = passGenerator.hash(passPhrase, talkId);

  return talkStore.get(talkId).then((response) => {
    if (response.Count !== 1) {
      logger.error(`Invalid talkId to authorize: ${talkId}`);
      throw new ErrorResponse(401, 'Failed to authorize');
    }

    const talk = response.Items[0];
    const storedPassHash = talk.passHash;
    if (passHash !== storedPassHash) {
      logger.error(`Invalid passHash to authorize: ${passHash}`);
      throw new ErrorResponse(401, 'Failed to authorize');
    }

    return sessionAuthorizer.create(talkId, autoLogin);
  })
  .then(({ sessionId, maxAge }) => {
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
