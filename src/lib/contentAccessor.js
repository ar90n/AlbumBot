const LINEBot = require('line-messaging');
const objects = require('./objectStore');

function fetchText(message) {
  return Promise.resolve({ text: message.getText() });
}

function fetchBlob(bot, talkId, message, suffix) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then((data) => {
    const body = data;
    const key = `${talkId}/${messageId}.${suffix}`;
    const acl = 'public-read';
    const contentType = 'image/jpeg';
    const contentEncoding = 'binary';
    return objects.put({ key, body, acl, contentType, contentEncoding });
  });
}

function fetch(bot, talkId, message) {
  if (message.isMessageType(LINEBot.Message.TEXT)) {
    return fetchText(message);
  } else if (message.isMessageType(LINEBot.Message.IMAGE)) {
    return fetchBlob(bot, talkId, message, 'jpg');
  } else if (message.isMessageType(LINEBot.Message.VIDEO)) {
    return fetchBlob(bot, talkId, message, 'mp4');
  }

  return new Promise((resolve, reject) => {
    const messageType = message.getMessageType();
    const errorMessage = `Unsupported message type: ${messageType}`;
    reject(errorMessage);
  });
}

module.exports = {
  fetch,
};
