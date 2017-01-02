const Promise = require('bluebird');
const AWS = require('aws-sdk');

const isOffline = () => !!process.env.IS_OFFLINE;
const BUCKET_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;

const s3OfflineOptions = {
  s3ForcePathStyle: true,
  region: 'localhost',
  endpoint: new AWS.Endpoint('http://localhost:8001'),
};
const client = isOffline() ? new AWS.S3(s3OfflineOptions) : new AWS.S3();

function getObjectUrl({ Bucket, Key }) {
  const bucketName = `${BUCKET_PREFIX}${Bucket}`;
  return `https://s3.amazonaws.com/${bucketName}/${Key}`;
}

function s3(method, content) {
  const Bucket = `${BUCKET_PREFIX}${content.Bucket}`;
  const modContent = Object.assign({}, content, { Bucket });
  return Promise.fromCallback(cb => client[method](modContent, cb));
}

module.exports = {
  getObjectUrl,
  s3,
};
