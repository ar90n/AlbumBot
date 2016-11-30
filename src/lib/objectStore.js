const Promise = require('bluebird');
const s3 = require('./s3').s3;
const getObjectUrl = require('./s3').getObjectUrl;

const isOffline = () => !!process.env.IS_OFFLINE;

const BUCKET_PREFIX = isOffline() ? 'dev' : process.env.REMOTE_STAGE;
const BUCKET_NAME = `${BUCKET_PREFIX}-bucket-for-album-bot`;

function put( params ) {
  const Key = params.key;
  const Body = params.body;
  const ACL = params.acl || 'private';
  const content = { Bucket: BUCKET_NAME, Key, Body, ACL };

  return s3('putObject', content).then(() => {
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
