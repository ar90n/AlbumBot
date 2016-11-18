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

function getReplyPageUrlMessage(pageUrl) {
  return pageUrl;
}

function getOverviewMessage() {
  return 'ご登録ありがとうございます．アルバムBot for Lineはグループに投稿された写真・動画を保存し，アルバムページを作成します．';
}

function getJoinMessage(pageUrl, passphrase) {
  return `ご登録ありがとうございます．アルバムBot for Lineは投稿された写真・動画を保存し，アルバムページを作成します．

アルバムページのURLとパスワードは以下のとおりです．
URL：${pageUrl}
パスワード：${passphrase}

アルバムページのURLを再度表示する場合は「@URL」と，パスワードの更新は「@PASS 新しいパスワード」とメッセージして下さい．`;
}

function createPageUrl(talkId) {
  return `http://album-bot.ar90n.net/album/${talkId}`;
}

function isCommand({ type, text }) {
  return type === 'text' && typeof (text) === 'string' && text[0] === '@';
}

function replyPageUrl(bot, token, sourceId) {
  const talkId = talkStore.generateId(sourceId);
  const pageUrl = createPageUrl(talkId);
  const replyMessage = getReplyPageUrlMessage(pageUrl);
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

function onUserOrRoomMessage(callback, token, message) {
  const sourceType = message.getEvent().source.type;
  const errorMessage = `Unsupported source type: ${sourceType}`;
  logger.error(errorMessage);
  callback(errorMessage);
}

function onGroupMessage(callback, token, message) {
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

function onMessage(callback, token, message) {
  const handler = message.isGroupEvent() ? onGroupMessage : onUserOrRoomMessage;
  handler.bind(this)(callback, token, message);
}

function onInvitedToUserOrRoom(callback, token, message) {
  const initialMessage = getOverviewMessage();
  this.replyTextMessage(token, initialMessage)
  .then(() => callback(null))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

function onInvitedToGroup(callback, token, message) {
  const sourceId = getSourceId(message);
  const createdAt = message.getTimestamp();

  const talkId = talkStore.generateId(sourceId);
  const defaultPassphrase = passGenerator.generate();
  const passHash = passGenerator.hash(defaultPassphrase, talkId);
  talkStore.put({ talkId, sourceId, createdAt, passHash })
  .then(() => {
    const pageUrl = createPageUrl(talkId);
    const initialMessage = getJoinMessage(pageUrl, defaultPassphrase);
    return this.replyTextMessage(token, initialMessage);
  })
  .then(() => callback(null, { talkId, passHash }))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

function onInvited(callback, token, message) {
  const handler = message.isGroupEvent() ? onInvitedToGroup : onInvitedToUserOrRoom;
  handler.bind(this)(callback, token, message);
}

module.exports = {
  onMessage,
  onInvited,
};
