const db = require('./dynamodb').db;

const TABLE_NAME = 'sessionStore';

function get({ sessionId }) {
  return db('query', {
    TableName: TABLE_NAME,
    KeyConditionExpression: '#sessionId = :sessionId',
    ExpressionAttributeValues: { ':sessionId': sessionId },
    ExpressionAttributeNames: { '#sessionId': 'sessionId' },
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

function update(sessionId, item) {
  return get({ sessionId }).then((response) => {
    if (response.Count !== 1) {
      throw new Error(`Invalid sessionId for update:${sessionId}`);
    }

    const expectedItem = response.Items[0];
    const expectedUpdateCount = expectedItem.updateCount;
    const UpdateExpression = Object.keys(item).reduce((prev, curr) => `${prev} , ${curr} = :${curr}`, 'set #updateCount = #updateCount + :num');
    const ExpressionAttributeNames = { '#updateCount': 'updateCount' };
    const ExpressionAttributeValues = Object.keys(item).reduce((prev, curr) => Object.assign({}, prev, { [`:${curr}`]: item[curr] }), { ':num': 1, ':expectedUpdateCount': expectedUpdateCount });
    const ConditionExpression = '#updateCount = :expectedUpdateCount';

    return db('update', {
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression,
      ReturnValues: 'UPDATED_NEW',
    });
  });
}

function clear() {
  return db('scan', {
    TableName: TABLE_NAME,
  }).then(({ Items }) => {
    const deleteResults = Items.map(({ sessionId }) => {
      const Key = { sessionId };
      return db('delete', { TableName: TABLE_NAME, Key });
    });
    return Promise.all(deleteResults);
  });
}

module.exports = {
  get,
  getAll,
  put,
  update,
  clear,
  TABLE_NAME,
};
