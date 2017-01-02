const sessionStore = require('./sessionStore');
const passGenerator = require('./passGenerator');
const logger = require('./logger');

function updateExpireAt({ sessionId, maxAge, expireAt }) {
  const newExpireAt = expireAt + maxAge;
  return sessionStore.update(sessionId, { expireAt: newExpireAt });
}

function create(talkId, autoLogin) {
  const maxAge = autoLogin ? (1000 * 3600 * 24 * 30) : (1000 * 1800);
  const expireAt = Date.now() + maxAge;
  const sessionId = passGenerator.generateToken();
  const hasAuth = true;
  const updateCount = 0;
  const session = { sessionId, talkId, maxAge, expireAt, hasAuth, updateCount };

  return sessionStore.put(session).then(() => Promise.resolve(session));
}

function check({ sessionId, talkId }) {
  if (!sessionId) {
    return Promise.resolve({ hasAuth: false });
  }

  return sessionStore.get({ sessionId }).then((response) => {
    if (response.Count !== 1) {
      return Promise.resolve({ hasAuth: false });
    }

    const session = response.Items[0];
    const expireAt = session.expireAt;
    if (expireAt < Date.now()) {
      logger.error(`Session is expired: ${expireAt}`);
      return Promise.resolve({ hasAuth: false });
    }

    if (session.talkId !== talkId) {
      logger.error(`Session is not created for ${talkId}`);
      return Promise.resolve({ hasAuth: false });
    }

    return updateExpireAt(session).then(() => {
      const hasAuth = session.hasAuth;
      return Promise.resolve({ hasAuth });
    });
  });
}

module.exports = {
  create,
  check,
};
