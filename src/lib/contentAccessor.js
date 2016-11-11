const LINEBot = require('line-messaging');
const objects = require('./objectStorage');

require('dotenv').config();
const isOffline = () => !!process.env.IS_OFFLINE;

function fetchText(message) {
  return Promise.resolve({ text: message.getText() });
}

function fetchBlob(message) {
  const messageId = message.getMessageId();
  if (!isOffline()) {
    return bot.getMessageContent(messageId).then((data) => {
      const param = { key: messageId, body: data };
      return objects.put(param);
    });
  } else {
    const param = { key: messageId, body: 'data' };
    return objects.put(param);
  }
}

function fetchLocation(message) {
  return Promise.resolve({
    title: message.getTitle(),
    address: message.getAddress(),
    latitude: message.getLatitude(),
    longitude: message.getLongiture(),
  });
}

function fetch(message) {
  if (message.isMessageType(LINEBot.Message.TEXT)) {
    return fetchText(message);
  } else if (message.isMessageType(LINEBot.Message.IMAGE)) {
    return fetchBlob(message);
  } else if (message.isMessageType(LINEBot.Message.VIDEO)) {
    return fetchBlob(message);
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
