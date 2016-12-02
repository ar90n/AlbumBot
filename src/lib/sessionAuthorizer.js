const sessionStore = require('./sessionStore');
const passGenerator = require('./passGenerator');
const logger = require('./logger');

function updateExpireAt({ sessionId, timeout, expireAt }) {
  const newExpireAt = expireAt + timeout;
  return sessionStore.update(sessionId, { expireAt: newExpireAt });
}

function create(autoLogin) {
  const timeout = autoLogin ? (1000 * 3600 * 24 * 30) : (1000 * 1800);
  const expireAt = Date.now() + timeout;
  const sessionId = passGenerator.generateToken();
  const hasAuth = true;
  const session = { sessionId, timeout, expireAt, hasAuth };

  return sessionStore.put(session).then(() => Promise.resolve(session));
}

function check({ sessionId }) {
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
