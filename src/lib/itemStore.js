const db = require('./dynamodb').db;
require('dotenv').config();

const isOffline = () => !!process.env.IS_OFFLINE;

const TABLE_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;
const TABLE_NAME = `${TABLE_PREFIX}itemStore`;

function getByRange(sourceId, beginCreatedAt, endCreatedAt) {
  let keyConditionExpression = '#sourceId = :sourceId';
  if (!!beginCreatedAt && !!endCreatedAt) {
    keyConditionExpression += ' AND #createdAt BETWEEN :beginCreatedAt AND :endCreatedAt';
  }

  return db('query', {
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: {
      ':sourceId': sourceId,
      ':beginCreatedAt': beginCreatedAt,
      ':endCreatedAt': endCreatedAt,
    },
    ExpressionAttributeNames: {
      '#sourceId': 'sourceId',
      '#createdAt': 'createdAt',
    },
  });
}

function get(sourceId, createdAt) {
  return getByRange(sourceId, createdAt, createdAt);
}

function getAll() {
  return db('scan', {
    TableName: TABLE_NAME,
  });
}

function put(item) {
  return db('put', {
    TableName: TABLE_NAME,
    Item: item,
  });
}

function clear() {
  return db('scan', {
    TableName: TABLE_NAME,
  }).then(({ Items }) =>
       Promise.all(Items.map(({ sourceId, createdAt }) =>
         db('delete', {
           TableName: TABLE_NAME,
           Key: { sourceId, createdAt },
         })
      ))
  );
}

module.exports = {
  getByRange,
  get,
  getAll,
  put,
  clear,
  TABLE_NAME,
};
