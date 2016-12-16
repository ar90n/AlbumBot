const LINEBot = require('line-messaging');
const objects = require('./objectStore');
const sizeOf = require('image-size');

function fetchText(message) {
  return Promise.resolve({ text: message.getText() });
}

function fetchImage(bot, talkId, message) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then((data) => {
    const body = data;
    const key = `${talkId}/${messageId}.jpg`;
    const acl = 'public-read';
    const contentType = 'image/jpeg';
    const contentEncoding = 'binary';
    return objects.put({ key, body, acl, contentType, contentEncoding }).then((res) => {
      const size = sizeOf(body);
      return Promise.resolve(Object.assign(res, { width: size.width, height: size.height }));
    });
  });
}

function fetchVideo(bot, talkId, message) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then((data) => {
    const body = data;
    const key = `${talkId}/${messageId}.mp4`;
    const acl = 'public-read';
    const contentType = 'video/mp4';
    const contentEncoding = 'binary';
    return objects.put({ key, body, acl, contentType, contentEncoding });
  });
}


function fetch(bot, talkId, message) {
  if (message.isMessageType(LINEBot.Message.TEXT)) {
    return fetchText(message);
  } else if (message.isMessageType(LINEBot.Message.IMAGE)) {
    return fetchImage(bot, talkId, message);
  } else if (message.isMessageType(LINEBot.Message.VIDEO)) {
    return fetchVideo(bot, talkId, message);
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
