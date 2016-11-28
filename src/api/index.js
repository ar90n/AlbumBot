const albums = require('./albums.js');
const auth = require('./auth.js');

const funcs = {
  v1: {
    get: {
      albums,
    },
    post: {
      auth,
    },
  },
};

function exec(hasAuth, httpMethod, apiVersion, funcName, talkId, funcParams, bodyParams) {
  return funcs[apiVersion][httpMethod][funcName](hasAuth, talkId, funcParams, bodyParams);
}

module.exports = {
  exec,
};
