const LINEBot = require('line-messaging');
const objects = require('./objectStore');

function fetchText(message) {
  return Promise.resolve({ text: message.getText() });
}

function fetchImage(bot, talkId, message) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then((data) => {
    const Body = data;
    const Key = `photo/original/${talkId}/${messageId}.jpg`;
    const ContentType = 'image/jpeg';
    const ContentEncoding = 'binary';
    return objects.put({ Key, Body, ContentType, ContentEncoding });
  });
}

function fetchVideo(bot, talkId, message) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then((data) => {
    const Body = data;
    const Key = `video/${talkId}/${messageId}.mp4`;
    const ContentType = 'video/mp4';
    const ContentEncoding = 'binary';
    return objects.put({ Key, Body, ContentType, ContentEncoding });
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
