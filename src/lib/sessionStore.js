const db = require('./dynamodb').db;

const isOffline = () => !!process.env.IS_OFFLINE;

const TABLE_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;
const TABLE_NAME = `${TABLE_PREFIX}sessionStore`;

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
    Key: { sessionId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'UPDATED_NEW',
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
