const Promise = require('bluebird');
const AWS = require('aws-sdk');

const isOffline = () => !!process.env.IS_OFFLINE;
const TABLE_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;

const dynamodbOfflineOptions = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
};

const client = isOffline() ? new AWS.DynamoDB.DocumentClient(dynamodbOfflineOptions) :
                             new AWS.DynamoDB.DocumentClient();

function db(method, params) {
  const TableName = `${TABLE_PREFIX}${params.TableName}`;
  const modParams = Object.assign({}, params, { TableName });
  return Promise.fromCallback(cb => client[method](modParams, cb));
}

module.exports = {
  db,
};
