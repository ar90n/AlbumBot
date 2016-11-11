const db = require('./dynamodb').db;

require('dotenv').config();
const isOffline = () => !!process.env.IS_OFFLINE;

const TABLE_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;
const TABLE_NAME = `${TABLE_PREFIX}items`;

function get(userId, createdAt) {
  return getByRange(userId, createdAt, createdAt);
}

function getByRange(userId, beginCreatedAt, endCreatedAt) {
  let keyConditionExpression = '#userId = :userId';
  if (!!beginCreatedAt && !!endCreatedAt) {
    keyConditionExpression += ' AND #createdAt BETWEEN :beginCreatedAt AND :endCreatedAt';
  }

  return db('query', {
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: {
      ':userId': userId,
      ':beginCreatedAt': beginCreatedAt,
      ':endCreatedAt': endCreatedAt,
    },
    ExpressionAttributeNames: {
      '#userId': 'userId',
      '#createdAt': 'createdAt',
    },
  });
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
       Promise.all(Items.map(({ userId, createdAt }) =>
         db('delete', {
           TableName: TABLE_NAME,
           Key: { userId, createdAt },
         })
      ))
  );
}

module.exports = {
  get,
  getByRange,
  getAll,
  put,
  clear,
  TABLE_NAME,
};
