const Promise = require('bluebird');
const objects = require('./objectStore');
const items = require('./itemStore');
const im = require('imagemagick');
const sizeOf = require('image-size');

const PREVIEW_IMAGE_SIZE = 800;

function resize(params) {
  return Promise.fromCallback(cb => im.resize(params, cb));
}

function createPreview(key, eTag) {
  const [,, sourceId, id] = key.split('/');

  return objects.get({ key, eTag }).then((data) => {
    const size = sizeOf(data.Body);
    const ContentType = data.ContentType;
    const baseAxis = (size.width < size.height) ? 'height' : 'width';
    const resizeParams = { srcData: data.Body, [baseAxis]: PREVIEW_IMAGE_SIZE };

    return resize(resizeParams).then((resizeImage) => {
      const result = { data: resizeImage, ContentType };
      return result;
    });
  })
  .then(({ data, ContentType }) => {
    const Body = new Buffer(data, 'binary');
    const previewKey = `photo/preview/${sourceId}/${id}`;
    const ContentEncoding = 'binary';
    const content = {
      Key: previewKey,
      Body,
      ContentType,
      ContentEncoding,
    };

    return objects.put(content);
  });
}

function createItem(previewKey, eTag) {
  const [,, sourceId, idWithExt] = previewKey.split('/');
  const id = idWithExt.split('.')[0];
  const originalKey = `photo/original/${sourceId}/${idWithExt}`;

  return objects.get({ key: previewKey, eTag }).then((data) => {
    const size = sizeOf(data.Body);
    const createdAt = Date.now();
    const originalUrl = objects.getObjectUrl(originalKey);
    const previewUrl = objects.getObjectUrl(previewKey);
    const item = {
      sourceId,
      createdAt,
      id,
      type: 'image',
      originalUrl,
      previewUrl,
      previewWidth: size.width,
      previewHeight: size.height,
    };

    return items.put(item);
  });
}

module.exports = {
  createPreview,
  createItem,
};
