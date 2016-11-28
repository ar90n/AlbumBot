const logger = require('./logger');
const itemStore = require('./itemStore');
const talkStore = require('./talkStore');
const contentAccessor = require('./contentAccessor');
const passGenerator = require('./passGenerator');
const Promise = require('bluebird');
const LINEBot = require('line-messaging');

function getSourceId(message) {
  if (message.isUserEvent()) {
    return message.getUserId();
  } else if (message.isGroupEvent()) {
    return message.getGroupId();
  }

  return message.getRoomId();
}

function getReplyPageUrlMessage(pageUrl) {
  return pageUrl;
}

function getOverviewMessage() {
  return 'ご登録ありがとうございます．アルバムBot for Lineはグループに投稿された写真・動画を保存し，アルバムページを作成します．';
}

function getJoinMessage(pageUrl, passphrase) {
  return `ご登録ありがとうございます．アルバムBot for Lineは投稿された写真・動画を保存し，アルバムページを作成します．

アルバムページのURLと合言葉は以下のとおりです．
URL：${pageUrl}
合言葉：${passphrase}

アルバムページのURLを再度表示する場合は「@URL」と，合言葉の変更は「@PASS 新しいパスワード」とメッセージして下さい．`;
}

function createPageUrl(talkId) {
  return `http://album-bot.ar90n.net/album/${talkId}`;
}

function isCommand({ type, text }) {
  return type === 'text' && typeof (text) === 'string' && text[0] === '@';
}

function replyPageUrl(bot, token, talkId) {
  const pageUrl = createPageUrl(talkId);
  const replyMessage = getReplyPageUrlMessage(pageUrl);
  return bot.replyTextMessage(token, replyMessage);
}

function confirmNewPass(bot, token, talkId, newPass) {
  const passHash = passGenerator.hash(newPass, talkId);
  const updateToken = passGenerator.generateToken();
  return talkStore.update(talkId, { updateToken }).then(() => {
    const type = 'updatePass';
    const confirm = new LINEBot.ConfirmTemplateBuilder();
    const positiveData = { type, passHash, updateToken };
    const negativeData = { type, updateToken };
    confirm.setMessage(`合言葉を「${newPass}」に変更しますか?`)
           .setPositiveAction('はい', JSON.stringify(positiveData), LINEBot.Action.POSTBACK)
           .setNegativeAction('いいえ', JSON.stringify(negativeData), LINEBot.Action.POSTBACK);
    const confirmMessage = new LINEBot.TemplateMessageBuilder('test confirm', confirm);
    return bot.replyMessage(token, confirmMessage).then(() => Promise.resolve(positiveData));
  });
}

function evalCommand(bot, token, { sourceId, text }) {
  const reg = /^@(\w+)\s*([^\s]*)/;
  const matches = reg.exec(text);
  const talkId = talkStore.generateId(sourceId);

  switch (matches[1].toLowerCase()) {
    case 'url':
      return replyPageUrl(bot, token, talkId);
    case 'pass':
      return confirmNewPass(bot, token, talkId, matches[2]);
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
  .then(response => callback(null, response))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

function onMessage(callback, token, message) {
  const handler = message.isGroupEvent() ? onGroupMessage : onUserOrRoomMessage;
  handler.bind(this)(callback, token, message);
}

function onInvitedToUserOrRoom(callback, token) {
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
  const defaultPassphrase = passGenerator.generatePass();
  const passHash = passGenerator.hash(defaultPassphrase, talkId);
  const updateToken = passGenerator.generateToken();
  talkStore.put({ talkId, sourceId, createdAt, passHash, updateToken })
  .then(() => {
    const pageUrl = createPageUrl(talkId);
    const initialMessage = getJoinMessage(pageUrl, defaultPassphrase);
    return this.replyTextMessage(token, initialMessage);
  })
  .then(() => callback(null, { talkId, passHash, updateToken }))
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

function onInvited(callback, token, message) {
  const handler = message.isGroupEvent() ? onInvitedToGroup : onInvitedToUserOrRoom;
  handler.bind(this)(callback, token, message);
}

function onPostback(callback, token, message) {
  const sourceId = getSourceId(message);
  const talkId = talkStore.generateId(sourceId);
  const postbackData = JSON.parse(message.getPostbackData());

  talkStore.get(talkId).then((response) => {
    if (response.Count !== 1) {
      throw new Error(`Invalid talkId to update passHash: ${talkId}`);
    }

    const talk = response.Items[0];
    if (talk.updateToken !== postbackData.updateToken) {
      const rejectMessage = '無効な操作です';
      return this.replyTextMessage(token, rejectMessage).then(() => {
        throw new Error(`Invalid updateToken to update passHash: ${postbackData.updateToken}`);
      });
    }

    const passHash = postbackData.passHash;
    const updateToken = passGenerator.generateToken();
    const updateValues = passHash ? { passHash, updateToken } : { updateToken };
    const completeMessage = passHash ? '合言葉を変更しました' : 'キャンセルしました';
    return talkStore.update(talkId, updateValues)
    .then(() => this.replyTextMessage(token, completeMessage))
    .then(() => callback(null, updateValues));
  })
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
}

module.exports = {
  onMessage,
  onInvited,
  onPostback,
};
