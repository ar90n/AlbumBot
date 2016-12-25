const db = require('./dynamodb').db;

const TABLE_NAME = 'itemStore';

function getByRange({ sourceId, limit, beginCreatedAt, endCreatedAt }) {
  if (limit === 0) {
    return { Items: [], Count: 0 };
  }

  let KeyConditionExpression = '#sourceId = :sourceId';
  let ExpressionAttributeValues = { ':sourceId': sourceId };
  let ExpressionAttributeNames = { '#sourceId': 'sourceId' };
  if (!!beginCreatedAt && !!endCreatedAt) {
    KeyConditionExpression += ' AND #createdAt BETWEEN :beginCreatedAt AND :endCreatedAt';
    ExpressionAttributeValues = Object.assign(ExpressionAttributeValues, { ':beginCreatedAt': beginCreatedAt, ':endCreatedAt': endCreatedAt });
    ExpressionAttributeNames = Object.assign(ExpressionAttributeNames, { '#createdAt': 'createdAt' });
  } else if (beginCreatedAt) {
    KeyConditionExpression += ' AND #createdAt >= :beginCreatedAt';
    ExpressionAttributeValues = Object.assign(ExpressionAttributeValues, { ':beginCreatedAt': beginCreatedAt });
    ExpressionAttributeNames = Object.assign(ExpressionAttributeNames, { '#createdAt': 'createdAt' });
  }
  const ScanIndexForward = false;
  const Limit = limit || 65536;

  return db('query', {
    TableName: TABLE_NAME,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
    Limit,
    ScanIndexForward,
  });
}

function get({ sourceId, limit, createdAt }) {
  return getByRange({ sourceId, limit, beginCreatedAt: createdAt, endCreatedAt: createdAt });
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
  }).then(({ Items }) => {
    const deleteResults = Items.map(({ sourceId, createdAt }) => {
      const Key = { sourceId, createdAt };
      return db('delete', { TableName: TABLE_NAME, Key });
    });
    return Promise.all(deleteResults);
  });
}

module.exports = {
  getByRange,
  get,
  getAll,
  put,
  clear,
  TABLE_NAME,
};
