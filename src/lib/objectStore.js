const Promise = require('bluebird');
const s3 = require('./s3').s3;
const getObjectUrl = require('./s3').getObjectUrl;

const BUCKET_NAME = 'bucket-for-album-bot';

function put(params) {
  const Key = params.key;
  const Body = params.body;
  const ACL = params.acl || 'private';
  const ContentType = params.contentType || 'binary';
  const ContentEncoding = params.contentEncoding || 'utf8';
  const content = { Bucket: BUCKET_NAME, Key, Body, ACL, ContentType, ContentEncoding };

  return s3('putObject', content).then(() => {
    const url = getObjectUrl(content);
    return Promise.resolve({ objectUrl: url });
  });
}

module.exports = {
  put,
  BUCKET_NAME,
};
