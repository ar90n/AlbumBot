const itemStore = require('../lib/itemStore');
const talkStore = require('../lib/talkStore');
const ErrorResponse = require('../lib/ErrorResponse');
const logger = require('../lib/logger');

function parseParameters(params) {
  const paramConfigs = {
    from: { fieldName: 'beginCreatedAt', valueType: 'int' },
    to: { fieldName: 'endCreatedAt', valueType: 'int' },
    limit: { fieldName: 'limit', valueType: 'int' },
    lastEvaluatedCreatedAt: { fieldName: 'lastEvaluatedCreatedAt', valueType: 'int' },
  };

  const paramQuery = {};
  let paramIndex = 0;
  const validParamNames = Object.keys(paramConfigs);
  while (paramIndex < params.length) {
    const paramName = params[paramIndex];
    paramIndex += 1;
    if (validParamNames.indexOf(paramName) > -1) {
      const fieldName = paramConfigs[paramName].fieldName;
      const paramValue = params[paramIndex];
      paramIndex += 1;
      paramQuery[fieldName] = parseInt(paramValue, 10);
    }
  }

  return paramQuery;
}

module.exports = (hasAuth, dummy0, talkId, funcParams) => {
  if (!hasAuth) {
    logger.log('Reject api call without authorization');
    throw new ErrorResponse(401, 'Reject api call without authorization');
  }

  return talkStore.get({talkId}).then((response) => {
    if (response.Count !== 1) {
      logger.error(`Invalid talkId to get contents: ${talkId}`);
      throw new ErrorResponse(400, 'Invalid talkId to get contents');
    }

    const sourceId = response.Items[0].sourceId;
    const paramQuery = parseParameters(funcParams);
    const query = Object.assign({ sourceId }, paramQuery);
    return itemStore.getByRange(query);
  })
  .then((response) => {
    const items = response.Items.map((item) => {
      switch (item.type) {
        case 'image':
          return {
            createdAt: item.createdAt,
            type: item.type,
            previewUrl: item.previewUrl,
            previewWidth: item.previewWidth,
            previewHeight: item.previewHeight,
            originalUrl: item.originalUrl,
          };
        case 'text':
                  // return { createdAt: item.createdAt, type: item.type, text: item.text };
          return null;
        default:
          return null;
      }
    }).filter(item => item !== null);

    const result = { items };
    if (response.LastEvaluatedKey) {
      result.lastEvaluatedCreatedAt = response.LastEvaluatedKey.createdAt;
    }
    return result;
  })
  .then((items) => {
    const response = {
      statusCode: 200,
      headers: {},
      body: JSON.stringify(items),
    };
    return Promise.resolve(response);
  });
};
