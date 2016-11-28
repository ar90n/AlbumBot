const LINEBot = require('line-messaging');
const cookie = require('cookie');
const botHandlers = require('./lib/botHandlers');
const sessionAuthorizer = require('./lib/sessionAuthorizer');
const logger = require('./lib/logger');
const api = require('./api/index');

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
};

module.exports.api = (event, context, callback) => {
  logger.log(`Event:${JSON.stringify(event)}`);

  const cookieValueStr = event.headers.Cookie || '';
  const cookieValues = cookie.parse(cookieValueStr);
  sessionAuthorizer.check(cookieValues).then(({ hasAuth }) => {
    const httpMethod = event.httpMethod.toLowerCase();
    const bodyParams = event.body;
    const [apiVersion, funcName, talkId, ...pathParams] = event.pathParameters.proxy.split('/');
    return api.exec(hasAuth, httpMethod, apiVersion, funcName, talkId, pathParams, bodyParams)
    .then((response) => {
      callback(null, response);
    });
  })
  .catch((error) => {
    logger.error(error);
    const response = {
      statusCode: 503,
      headers: {},
      body: error.toString(),
    };
    callback(null, response);
  });
};
