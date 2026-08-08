const fs = require('fs');
const path = require('path');
const { cloudinary, configured } = require('../config/cloudinary');
const { ApiError } = require('./index');

const cleanupLocalFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (_err) {
    // Ignore: the file may already be gone.
  }
};

/**
 * Upload an image (a Multer file) to Cloudinary and remove the temporary local
 * file afterwards. Only the returned secure_url is ever stored.
 *
 * If Cloudinary is not configured (credentials missing in .env), the file is
 * kept and served from /uploads so development/test environments keep working
 * without a Cloudinary account.
 */
const uploadImage = async (file, { baseUrl = '' } = {}) => {
  if (!file || !file.path) throw new ApiError(400, 'No file uploaded');

  if (!configured) {
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      publicId: null,
      provider: 'local',
    };
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'donation-system/screenshots',
      public_id: path.basename(file.filename, path.extname(file.filename)),
      resource_type: 'image',
    });
    cleanupLocalFile(file.path);
    return {
      url: result.secure_url,
      filename: file.filename,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  } catch (error) {
    cleanupLocalFile(file.path);
    throw new ApiError(500, 'Image upload to Cloudinary failed. Please try again.');
  }
};

module.exports = uploadImage;
