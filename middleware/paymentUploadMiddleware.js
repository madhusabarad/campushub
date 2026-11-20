const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDirectory = path.join(process.cwd(), 'uploads', 'payments');

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, callback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('Only JPG and PNG images are allowed.');
    error.status = 400;
    return callback(error);
  }

  callback(null, true);
};

const uploadPaymentProof = (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1,
    },
  }).single('screenshot');

  upload(req, res, async (error) => {
    if (!error) {
      return next();
    }

    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkErr) {
        // Ignore errors if file already deleted
      }
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Screenshot exceeds the maximum upload size of 2 MB.',
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.code === 'LIMIT_FILE_COUNT'
            ? 'Upload only one screenshot.'
            : error.message || 'File upload rejected.',
      });
    }

    return res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Only JPG and PNG images are allowed.',
    });
  });
};

module.exports = {
  uploadPaymentProof,
  uploadDirectory,
  fileFilter,
};

