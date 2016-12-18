const albums = require('./albums.js');
const login = require('./login.js');
const logout = require('./logout.js');

const funcs = {
  v1: {
    get: {
      albums,
    },
    post: {
      login,
      logout,
    },
  },
};

function exec(hasAuth, sessionId, httpMethod, apiVersion, funcName, talkId, funcParams, bodyParams) {
  return funcs[apiVersion][httpMethod][funcName](hasAuth, sessionId, talkId, funcParams, bodyParams);
}

module.exports = {
  exec,
};
