const LINEBot = require('line-messaging');
const botHandlers = require('./lib/botHandlers');
const logger = require('./lib/logger');
const api = require('./api');

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
  bot.on(LINEBot.Events.POSTBACK, botHandlers.onPostback.bind(bot, callback));

  const body = event.body;
  const signature = event.headers['X-Line-Signature'];
  bot.handleEventRequest(body, signature);
}

module.exports.api = (event, context, callback) => {
  const [apiVersion, funcName, ...funcParams] = event.pathParameters.proxy.split('/');
  api.exec( apiVersion, funcName, funcParams )
     .then( ( result ) => {
        const response = {
          statusCode: 200,
          headers: {},
          body: 'ok'
        };
        console.log(response.body);
        callback(null, response);
     })
     .catch( ( error ) => {
        const response = {
          statusCode: 503,
          headers: {},
          body: 'error'
        };
        console.log(response.body);
        callback(null, response);
     });
}
