const itemStorage = require('./itemStorage');
const talkStorage = require('./talkStorage');
const contentAccessor = require('./contentAccessor');
const passGenerator = require('./passGenerator');
const Promise = require('bluebird');

require('dotenv').config();

function onMessage(callback, token, message) {
  const userId = message.getUserId();
  const createdAt = message.getTimestamp();
  const id = message.getMessageId();
  const type = message.getMessageType();

  contentAccessor.fetch(message).then((content) => {
    const item = Object.assign({}, { userId, createdAt, id, type }, content);
    return Promise.resolve(item);
  }).then(item =>
       itemStorage.put(item)
  ).then(() => {
    callback(null);
  }).catch((error) => {
    callback(error);
  });
}

function onFollow(callback, token, message) {
  const userId = message.getUserId();
  const createdAt = message.getTimestamp();

  const talkId = talkStorage.generateId(userId);
  const defaultPassphrase = passGenerator.generate();
  const passHash = passGenerator.hash(defaultPassphrase);
  talkStorage.put({ talkId, userId, createdAt, passHash }).then(() =>
      // replay message
       Promise.resolve({ talkId, passHash })
  ).then((replyMessage) => {
    callback(null, replyMessage);
  }).catch((error) => {
    callback(error);
  });
}

module.exports = {
  onMessage,
  onFollow,
};
