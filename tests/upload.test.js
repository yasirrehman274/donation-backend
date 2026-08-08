process.env.NODE_ENV = 'test';
process.env.CLOUDINARY_CLOUD_NAME = 'testcloud';
process.env.CLOUDINARY_API_KEY = 'testkey';
process.env.CLOUDINARY_API_SECRET = 'testsecret';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { cloudinary, configured } = require('../src/config/cloudinary');
const uploadImage = require('../src/utils/uploadImage');
const { ApiError } = require('../src/utils');

const makeTempImage = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'donation-upload-'));
  const filePath = path.join(dir, 'proof.png');
  fs.writeFileSync(filePath, Buffer.from('fake-image-bytes'));
  return filePath;
};

test('cloudinary is configured when credentials are present', () => {
  assert.strictEqual(configured, true);
});

test('uploads image to cloudinary and deletes the temp file', async () => {
  let uploadOptions = null;
  cloudinary.uploader.upload = async (_filePath, options) => {
    uploadOptions = options;
    return {
      secure_url: 'https://res.cloudinary.com/testcloud/image/upload/screenshot.png',
      public_id: 'donation-system/screenshots/proof',
    };
  };

  const filePath = makeTempImage();
  const result = await uploadImage({ path: filePath, filename: 'proof.png' }, { baseUrl: 'http://localhost:5000' });

  assert.strictEqual(result.url, 'https://res.cloudinary.com/testcloud/image/upload/screenshot.png');
  assert.strictEqual(result.provider, 'cloudinary');
  assert.strictEqual(result.publicId, 'donation-system/screenshots/proof');
  assert.strictEqual(uploadOptions.folder, 'donation-system/screenshots');
  assert.strictEqual(uploadOptions.resource_type, 'image');
  assert.strictEqual(fs.existsSync(filePath), false, 'temp file should be removed after upload');
});

test('cleans up temp file and throws 500 when cloudinary fails', async () => {
  cloudinary.uploader.upload = async () => {
    throw new Error('cloud down');
  };

  const filePath = makeTempImage();
  await assert.rejects(
    () => uploadImage({ path: filePath, filename: 'proof.png' }),
    (err) => err instanceof ApiError && err.statusCode === 500
  );
  assert.strictEqual(fs.existsSync(filePath), false, 'temp file should be removed on failure');
});

test('rejects when no file is provided', async () => {
  await assert.rejects(
    () => uploadImage(undefined, { baseUrl: 'http://localhost:5000' }),
    (err) => err instanceof ApiError && err.statusCode === 400
  );
});
