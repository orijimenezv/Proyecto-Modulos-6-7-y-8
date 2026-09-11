const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');
const { loadConfig } = require('../config/env');
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: loadConfig().storage.maxBytes, files: 1, fields: 0, parts: 2, fieldNameSize: 32 },
  fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const valid = (extension === '.png' && file.mimetype === 'image/png') || (['.jpg', '.jpeg'].includes(extension) && file.mimetype === 'image/jpeg');
    cb(valid ? null : new AppError('Solo se permiten imágenes JPG o PNG', 400), valid);
  },
});
