const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('./env');

const { MulterError } = multer;

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeOk = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype || '');
  if (ALLOWED_EXTENSIONS.includes(ext) || mimeOk) return cb(null, true);
  const err = new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
  err.message = 'Only image files are allowed (jpg, jpeg, png, gif, webp).';
  cb(err);
};

module.exports = multer({
  storage,
  limits: { fileSize: env.uploadLimitMb * 1024 * 1024 },
  fileFilter,
});
