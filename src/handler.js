const LINEBot = require('line-messaging');
const cookie = require('cookie');
const botHandlers = require('./lib/botHandlers');
const sessionAuthorizer = require('./lib/sessionAuthorizer');
const imageHandler = require('./lib/imageHandler');
const videoHandler = require('./lib/videoHandler');
const logger = require('./lib/logger');
const api = require('./api/index');
const strings = require('locutus/php/strings');

const corsHeaders = {
  //'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Origin': `https://${process.env.REMOTE_STAGE}.album-bot.ar90n.net`,
  'Access-Control-Allow-Credentials': true,
};

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
  const sessionId = cookieValues.sessionId;

  const httpMethod = event.httpMethod.toLowerCase();
  const bodyParams = {};
  strings.parse_str(event.body, bodyParams);
  const [apiVersion, funcName, talkId, ...pathParams] = event.pathParameters.proxy.split('/');
  sessionAuthorizer.check({ sessionId, talkId }).then(({ hasAuth }) => api.exec(hasAuth, sessionId, httpMethod, apiVersion, funcName, talkId, pathParams, bodyParams))
  .then((response) => {
    response.headers = Object.assign({}, response.headers, corsHeaders);
    logger.log(`Response:${JSON.stringify(response)}`);
    callback(null, response);
  })
  .catch((error) => {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    const headers = corsHeaders;
    const body = error.body || 'Internal Server Error';
    const response = { statusCode, headers, body };
    callback(null, response);
  });
};

module.exports.s3hookResize = (event, context, callback) => {
  logger.log(`Event:${JSON.stringify(event)}`);

  const key = event.Records[0].s3.object.key;
  const eTag = event.Records[0].s3.object.eTag;
  imageHandler.createPreview(key, eTag).then((res) => {
    callback(null);
  })
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
};

module.exports.s3hookCreateImageItem = (event, context, callback) => {
  logger.log(`Event:${JSON.stringify(event)}`);

  const key = event.Records[0].s3.object.key;
  const eTag = event.Records[0].s3.object.eTag;
  imageHandler.createItem(key, eTag).then((res) => {
    callback(null);
  })
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
};

module.exports.s3hookCreateVideoItem = (event, context, callback) => {
  logger.log(`Event:${JSON.stringify(event)}`);

  const key = event.Records[0].s3.object.key;
  videoHandler.createItem(key).then((res) => {
    callback(null);
  })
  .catch((error) => {
    logger.error(error);
    callback(error);
  });
};
