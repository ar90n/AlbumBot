const db = require('./dynamodb').db;
const passGenerator = require('./passGenerator');

const TABLE_NAME = 'talkStore';
const SALT_ID = '@LBUM_B0T';

function generateId(sourceId) {
  return sourceId;
}

function get( { talkId }) {
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
  return get({talkId}).then((response) => {
    if (response.Count !== 1) {
      throw new Error(`Invalid talkId for update:${talkId}`);
    }

    const expectedItem = response.Items[0];
    const expectedUpdateCount = expectedItem.updateCount;
    const UpdateExpression = Object.keys(item).reduce((prev, curr) => `${prev} , ${curr} = :${curr}`, 'set #updateCount = #updateCount + :num');
    const ExpressionAttributeNames = { '#updateCount': 'updateCount' };
    const ExpressionAttributeValues = Object.keys(item).reduce((prev, curr) => Object.assign({}, prev, { [`:${curr}`]: item[curr] }), { ':num': 1, ':expectedUpdateCount': expectedUpdateCount });
    const ConditionExpression = '#updateCount = :expectedUpdateCount';

    return db('update', {
      TableName: TABLE_NAME,
      Key: { talkId },
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
