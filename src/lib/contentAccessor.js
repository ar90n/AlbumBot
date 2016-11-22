const LINEBot = require('line-messaging');
const objects = require('./objectStore');

function fetchText(message) {
  return Promise.resolve({ text: message.getText() });
}

function fetchBlob(bot, message) {
  const messageId = message.getMessageId();
  return bot.getMessageContent(messageId)
  .then(data => objects.put({ key: messageId, body: data }));
}

function fetch(bot, message) {
  if (message.isMessageType(LINEBot.Message.TEXT)) {
    return fetchText(message);
  } else if (message.isMessageType(LINEBot.Message.IMAGE)) {
    return fetchBlob(bot, message);
  } else if (message.isMessageType(LINEBot.Message.VIDEO)) {
    return fetchBlob(bot, message);
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
