const crypto = require('crypto');
require('dotenv').config();

const isTest = () => !!process.env.IS_TEST;

function generate() {
  return 'abcd';
}

const hashSalt = 'aaa';
function hash(passphrase) {
  return crypto.createHmac('sha256', hashSalt).update(passphrase).digest('base64');
}

module.exports = {
  generate,
  hash,
};
