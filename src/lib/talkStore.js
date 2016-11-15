const db = require('./dynamodb').db;

const isOffline = () => !!process.env.IS_OFFLINE;

const TABLE_PREFIX = isOffline() ? '' : process.env.REMOTE_STAGE;
const TABLE_NAME = `${TABLE_PREFIX}talkStore`;

function generateId(sourceId) {
  return 'aaaaa';
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

function clear() {
  return db('scan', {
    TableName: TABLE_NAME,
  }).then(({ Items }) =>
       Promise.all(Items.map(({ talkId }) =>
         db('delete', {
           TableName: TABLE_NAME,
           Key: { talkId },
         })
      ))
  );
}

module.exports = {
  generateId,
  get,
  getAll,
  put,
  clear,
  TABLE_NAME,
};
