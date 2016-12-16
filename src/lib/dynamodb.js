const Promise = require('bluebird');
const AWS = require('aws-sdk');

const isOffline = () => !!process.env.IS_OFFLINE;

const dynamodbOfflineOptions = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
};

const client = isOffline() ? new AWS.DynamoDB.DocumentClient(dynamodbOfflineOptions) :
                             new AWS.DynamoDB.DocumentClient();

function db(method, params) {
  return Promise.fromCallback(cb => client[method](params, cb));
}

module.exports = {
  db,
};
