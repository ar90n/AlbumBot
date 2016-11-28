const itemStore = require('../lib/itemStore');
const talkStore = require('../lib/talkStore');

function parseParameters(params) {
  const paramConfigs = {
    from: { fieldName: 'beginCreatedAt', valueType: 'int' },
    to: { fieldName: 'endCreatedAt', valueType: 'int' },
    limit: { fieldName: 'limit', valueType: 'int' },
  };

  const paramQuery = {};
  let paramIndex = 0;
  const validParamNames = Object.keys(paramConfigs);
  while (paramIndex < params.length) {
    const paramName = params[paramIndex];
    paramIndex += 1;
    if (validParamNames.includes(paramName)) {
      const fieldName = paramConfigs[paramName].fieldName;
      const paramValue = params[paramIndex];
      paramIndex += 1;
      paramQuery[fieldName] = parseInt(paramValue, 10);
    }
  }

  return paramQuery;
}

module.exports = function (hasAuth, talkId, funcParams, bodyParams) {
  if (!hasAuth) {
    throw new Error('Reject api call without authorization');
  }

  return talkStore.get(talkId).then((response) => {
    if (response.Count !== 1) {
      throw new Error(`Invalid talkId to get contents: ${talkId}`);
    }

    const sourceId = response.Items[0].sourceId;
    const paramQuery = parseParameters(funcParams);
    const query = Object.assign({ sourceId }, paramQuery);
    return itemStore.getByRange(query);
  })
  .then(response => response.Items.map((item) => {
    switch (item.type) {
      case 'image':
        return { createdAt: item.createdAt, type: item.type, objectUrl: item.objectUrl };
      case 'text':
                  // return { createdAt: item.createdAt, type: item.type, text: item.text };
        return null;
      default:
        return null;
    }
  })
  .filter(item => item !== null))
  .then((items) => {
    const response = {
      statusCode: 200,
      headers: {},
      body: JSON.stringify(items),
    };
    return Promise.resolve(response);
  });
};
