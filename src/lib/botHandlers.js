const logger = require('./logger');
const itemStore = require('./itemStore');
const talkStore = require('./talkStore');
const contentAccessor = require('./contentAccessor');
const passGenerator = require('./passGenerator');
const Promise = require('bluebird');
const LINEBot = require('line-messaging');

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
  const talkId = talkStore.generateId(sourceId);
  const pageUrl = createPageUrl(talkId);
  const replyMessage = pageUrl;
  return bot.replyTextMessage(token, replyMessage);
}

function confirmNewPass(bot, token, newPass) {
  const confirm = new LINEBot.ConfirmTemplateBuilder();
  confirm.setMessage(`${newPass}?`);
  confirm.setPositiveAction('OK', 'ok');
  confirm.setNegativeAction('Cancel', 'cannel');
  return bot.replyTextMessage(token, confirm);
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
    }
    return itemStore.put(item);
  })
  .then(() => callback(null))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

function onFollow(callback, token, message) {
  const sourceId = getSourceId(message);
  const createdAt = message.getTimestamp();

  const talkId = talkStore.generateId(sourceId);
  const defaultPassphrase = passGenerator.generate();
  const passHash = passGenerator.hash(defaultPassphrase, talkId);
  talkStore.put({ talkId, sourceId, createdAt, passHash })
  .then(() => {
    const pageUrl = createPageUrl(talkId);
    const initialMessage = `url: ${pageUrl}`;
    return this.replyTextMessage(token, initialMessage);
  })
  .then(() => callback(null, { talkId, passHash }))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

module.exports = {
  onMessage,
  onFollow,
};
