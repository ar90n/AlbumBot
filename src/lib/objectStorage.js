const Promise = require('bluebird');
const s3 = require('./s3').s3;
const getObjectUrl = require('./s3').getObjectUrl;

require('dotenv').config();
const isOffline = () => !!process.env.IS_OFFLINE;

const BUCKET_PREFIX = isOffline() ? 'dev' : process.env.REMOTE_STAGE;
const BUCKET_NAME = `${BUCKET_PREFIX}-bucket-for-album-bot`;

function put({ key, body }) {
  const content = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
  };

  return s3('putObject', content).then((response) => {
    const url = getObjectUrl(content);
    return Promise.resolve({
      objectUrl: url,
    });
  });
}

module.exports = {
  put,
  BUCKET_NAME,
};
