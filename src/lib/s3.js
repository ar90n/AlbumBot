const Promise = require('bluebird');
const AWS = require('aws-sdk');

const isOffline = () => !!process.env.IS_OFFLINE;


const s3OfflineOptions = {
  s3ForcePathStyle: true,
  region: 'localhost',
  endpoint: new AWS.Endpoint('http://localhost:8001'),
};
const client = isOffline() ? new AWS.S3(s3OfflineOptions) : new AWS.S3();

function getObjectUrl({ Bucket, Key }) {
  return `https://${Bucket}/${Key}`;
}

function s3(method, params) {
  return Promise.fromCallback(cb => client[method](params, cb));
}

module.exports = {
  getObjectUrl,
  s3,
};
