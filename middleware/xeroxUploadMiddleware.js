
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDirectory = path.join(
    process.cwd(),
    'private_uploads',
    'xerox'
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        callback(null, `${crypto.randomUUID()}.pdf`);
    },
});

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension !== '.pdf' || file.mimetype !== 'application/pdf') {
        const error = new Error('Only PDF documents are allowed.');
        error.status = 400;
        return callback(error);
    }

    callback(null, true);
};

async function removePartialUpload(req) {
    // Multer may attach a file object even when an upload fails.
    if (req.file?.path) {
        try {
            await fs.promises.unlink(req.file.path);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Xerox upload cleanup failed:', error.message);
            }
        }
    }

    // For failed disk-storage uploads, Multer normally removes the
    // partially written file itself. This function cleans up any file
    // path Multer has exposed on the request.
}

const uploadXeroxDocument = (req, res, next) => {
    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 1,
        },
    }).single('document');

    upload(req, res, async (error) => {
        if (!error) {
            return next();
        }

        await removePartialUpload(req);

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    message: 'PDF exceeds the maximum upload size of 10 MB.',
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    error.code === 'LIMIT_FILE_COUNT'
                        ? 'Upload only one PDF document.'
                        : 'The PDF upload was rejected.',
            });
        }

        return res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Unable to upload the PDF.',
        });
    });
};

module.exports = {
    uploadXeroxDocument,
    uploadDirectory,
};
