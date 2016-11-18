const LINEBot = require('line-messaging');
const botHandlers = require('./lib/botHandlers');
const logger = require('./lib/logger');

module.exports.webhook = (event, context, callback) => {
  logger.log(`Event:${JSON.stringify(event)}`);

  const bot = LINEBot.create({
    channelID: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelToken: process.env.CHANNEL_ACCESS_TOKEN,
  });
  bot.on(LINEBot.Events.MESSAGE, botHandlers.onMessage.bind(bot, callback));
  bot.on(LINEBot.Events.FOLLOW, botHandlers.onInvited.bind(bot, callback));
  bot.on(LINEBot.Events.JOIN, botHandlers.onInvited.bind(bot, callback));

  const body = event.body;
  const signature = event.headers['X-Line-Signature'];
  bot.handleEventRequest(body, signature);
};
