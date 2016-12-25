const db = require('./dynamodb').db;

const TABLE_NAME = 'talkStore';

function generateId(sourceId) {
  return sourceId;
}

function get(talkId) {
  return db('query', {
    TableName: TABLE_NAME,
    KeyConditionExpression: '#talkId = :talkId',
    ExpressionAttributeValues: {
      ':talkId': talkId,
    },
    ExpressionAttributeNames: {
      '#talkId': 'talkId',
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

function update(talkId, item) {
  const updateExpression = Object.keys(item).reduce((prev, curr, index) => {
    const prefix = (index === 0) ? 'set' : ',';
    return `${prev} ${prefix} ${curr} = :${curr}`;
  }, '');
  const expressionAttributeValues = Object.keys(item).reduce((prev, curr) => {
    const key = `:${curr}`;
    return Object.assign(prev, { [key]: item[curr] });
  }, {});

  return db('update', {
    TableName: TABLE_NAME,
    Key: { talkId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'UPDATED_NEW',
  });
}

function clear() {
  return db('scan', {
    TableName: TABLE_NAME,
  }).then(({ Items }) => {
    const deleteResults = Items.map(({ talkId }) => {
      const Key = { talkId };
      return db('delete', { TableName: TABLE_NAME, Key });
    });
    return Promise.all(deleteResults);
  });
}

module.exports = {
  generateId,
  get,
  getAll,
  put,
  update,
  clear,
  TABLE_NAME,
};
