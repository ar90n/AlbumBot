const s3 = require('./s3').s3;
const s3GetObjectUrl = require('./s3').getObjectUrl;

const BUCKET_NAME = 'bucket-for-album-bot';

function getObjectUrl(Key) {
  return s3GetObjectUrl({ Bucket: BUCKET_NAME, Key });
}

function put(params) {
  const ACL = 'private';
  const ContentType = 'binary';
  const ContentEncoding = 'utf8';
  const content = Object.assign({ Bucket: BUCKET_NAME, ACL, ContentType, ContentEncoding }, params);

  return s3('putObject', content);
}

function get(params) {
  const Key = params.key;
  const IfMatch = params.eTag;
  const content = { Bucket: BUCKET_NAME, Key, IfMatch };

  return s3('getObject', content);
}

module.exports = {
  getObjectUrl,
  put,
  get,
  BUCKET_NAME,
};
