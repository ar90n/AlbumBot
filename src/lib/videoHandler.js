const objects = require('./objectStore');
const items = require('./itemStore');

function createItem(key) {
  const [, sourceId, idWithExt] = key.split('/');
  const id = idWithExt.split('.')[0];
  const createdAt = Date.now();
  const originalUrl = objects.getObjectUrl(key);
  const item = {
    sourceId,
    createdAt,
    id,
    type: 'video',
    originalUrl,
  };

  return items.put(item);
}

module.exports = {
  createItem,
};
