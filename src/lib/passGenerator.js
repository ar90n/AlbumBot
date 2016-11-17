const crypto = require('crypto');

const isTest = () => !!process.env.IS_TEST;

function generate() {
  if (isTest()) {
    return 'default pass';
  }

  return 'abcd';
}

function getSalt(id) {
  return `:${id}@#JE(CJA#8`;
}

function hash(passphrase, id) {
  const salt = getSalt(id);
  const data = passphrase + salt;
  return crypto.createHash('sha256').update(data).digest('base64');
}

module.exports = {
  generate,
  hash,
};
