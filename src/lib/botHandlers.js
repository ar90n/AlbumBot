const itemStorage = require('./itemStorage');
const talkStorage = require('./talkStorage');
const contentAccessor = require('./contentAccessor');
const passGenerator = require('./passGenerator');
const Promise = require('bluebird');
const LINEBot = require('line-messaging');
require('dotenv').config();

function getSourceId(message) {
  return message.isUserEvent() ? message.getUserId() :
         message.isGroupEvent() ? message.getGroupId() :
         message.getRoomId();
}

function createPageUrl(talkId) {
  return `http://example.com/${talkId}`;
}

function isCommand({ type, text }) {
  return type === 'text' && typeof (text) === 'string' && text[0] === '@';
}

function replyPageUrl(bot, token, sourceId) {
  const talkId = talkStorage.generateId(sourceId);
  const pageUrl = createPageUrl(talkId);
  const replyMessage = pageUrl;
  return bot.replyText(token, replyMessage);
}

function confirmNewPass(bot, token, newPass) {
  const confirm = new LINEBot.ConfirmTemplateBuilder();
  confirm.setMessage(`${newPass}?`);
  confirm.setPositiveAction('OK', 'ok');
  confirm.setNegativeAction('Cancel', 'cannel');
  return bot.replyText(token, confirm);
}

function evalCommand(bot, token, { sourceId, text }) {
  const reg = /^@(\w+)\s*(\w*)/;
  const matches = reg.exec(text);

  switch (matches[1].toLowerCase()) {
    case 'url':
      return replyPageUrl(bot, token, sourceId);
    case 'pass':
      return confirmNewPass(bot, token, matches[1]);
    default:
      return Promise.resolve({});
  }
}

function onMessage(callback, token, message) {
  const sourceId = getSourceId(message);
  const createdAt = message.getTimestamp();
  const id = message.getMessageId();
  const type = message.getMessageType();

  contentAccessor.fetch(this, message)
  .then((content) => {
    const item = Object.assign({}, { sourceId, createdAt, id, type }, content);
    if (isCommand(item)) {
      return evalCommand(this, token, item);
    } else {
      return itemStorage.put(item);
    }
  })
  .then(() => callback(null))
  .catch((error) => {
    console.error(error);
    callback(error);
  });
}

function onFollow(callback, token, message) {
  const sourceId = getSourceId(message);
  const createdAt = message.getTimestamp();

  const talkId = talkStorage.generateId(sourceId);
  const defaultPassphrase = passGenerator.generate();
  const passHash = passGenerator.hash(defaultPassphrase);
  talkStorage.put({ talkId, sourceId, createdAt, passHash })
  .then(() => {
    const pageUrl = createPageUrl(talkId);
    const initialMessage = `url: ${pageUrl}`;
    return this.replyText(token, initialMessage);
  })
  .then(() => callback(null, { talkId, passHash }))
  .catch((error) => {
    console.error(error);
    callback(error);
  });
}

module.exports = {
  onMessage,
  onFollow,
};
