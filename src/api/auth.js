const talkStore = require('../lib/talkStore');
const passGenerator = require('../lib/passGenerator');
const sessionAuthorizer = require('../lib/sessionAuthorizer');
const logger = require('../lib/logger');
const cookie = require('cookie');

module.exports = (hasAuth, dummy0, dummy1, bodyParams) => {
  const talkId = bodyParams.talkId;
  const passPhrase = bodyParams.passPhrase;
  const autoLogin = bodyParams.autoLogin;
  const passHash = passGenerator.hash(passPhrase, talkId);
  return talkStore.get(talkId).then((response) => {
    if (response.Count !== 1) {
      logger.error(`Invalid talkId to authorize: ${talkId}`);
      throw new Error('Failed to authorize');
    }

    const talk = response.Items[0];
    const storedPassHash = talk.passHash;
    if (passHash !== storedPassHash) {
      logger.error(`Invalid passHash to authorize: ${passHash}`);
      throw new Error('Failed to authorize');
    }

    return sessionAuthorizer.create(autoLogin);
  })
  .then(({ sessionId, expireAt }) => {
    const maxAge = expireAt;
    const cookieValueStr = cookie.serialize('sessionId', sessionId, { maxAge });
    const response = {
      statusCode: 200,
      headers: { 'Set-Cookie': cookieValueStr },
      body: JSON.stringify({}),
    };
    return Promise.resolve(response);
  });
};
