const LINEBot = require('line-messaging');
const botHandlers = require('./lib/botHandlers');

require('dotenv').config();

module.exports.webhook = (event, context, callback) => {
  const bot = LINEBot.create({
    channelID: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelToken: process.env.CHANNEL_ACCESS_TOKEN,
  });
  bot.on(LINEBot.Events.MESSAGE, botHandlers.onMessage.bind(this, callback));
  bot.on(LINEBot.Events.FOLLOW, botHandlers.onFollow.bind(this, callback));

  const body = event.body;
  const signature = event.headers['X-Line-Signature'];
  bot.handleEventRequest(body, signature);
};
