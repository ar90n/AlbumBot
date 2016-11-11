const crypto = require('crypto');
require('dotenv').config();

const isTest = () => !!process.env.IS_TEST;

function generate() {
  return 'abcd';
}

function hash(passphrase) {
  const salt = 'aaa';
  return crypto.createHmac('sha256', salt).update(passphrase).digest('base64');
}

module.exports = {
  generate,
  hash,
};
