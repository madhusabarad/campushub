
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Xerox = require('../models/Xerox');
const { uploadDirectory } = require('../middleware/xeroxUploadMiddleware');
const { inspectXeroxPdf } = require('../utils/xeroxPdf');
const {
    calculateXeroxPrice,
    PRINT_RATES,
    OHP_SHEET_PRICE,
} = require('../utils/xeroxPricing');

const MAX_COPIES = 100;

function apiError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parsePositiveInteger(value, fieldName) {
    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1) {
        throw apiError(400, `${fieldName} must be a positive integer.`);
    }

    return number;
}

function parseBoolean(value, fieldName) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;

    throw apiError(400, `${fieldName} must be true or false.`);
}

async function removeUploadedFile(filePath) {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Could not remove uploaded Xerox file:', error.message);
        }
    }
}

function getSafeRequest(request) {
    return {
        _id: request._id,
        student: request.student,
        shopkeeper: request.shopkeeper,
        totalPages: request.totalPages,
        printRange: request.printRange,
        startPage: request.startPage,
        endPage: request.endPage,
        colorMode: request.colorMode,
        numberOfCopies: request.numberOfCopies,
        paperSize: request.paperSize,
        printSides: request.printSides,
        includeOHP: request.includeOHP,
        estimatedPrice: request.estimatedPrice,
        status: request.status,
        paymentMethod: request.paymentMethod,
        paymentStatus: request.paymentStatus,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    };
}

// GET /api/xerox/pricing
const getPricing = (req, res) => {
    res.json({
        success: true,
        paperSizes: ['A4'],
        printRates: PRINT_RATES,
        ohpSheetPrice: OHP_SHEET_PRICE,
        ohpSheetsPerCopy: 2,
        maximumCopies: MAX_COPIES,
        maximumUploadSizeMB: 10,
    });
};

// POST /api/xerox
const createXeroxRequest = async (req, res, next) => {
    let uploadedPath;

    try {
        if (!req.file) {
            throw apiError(400, 'Please upload a PDF using the document field.');
        }

        uploadedPath = req.file.path;

        // The uploaded file is parsed on the server; never trust a client page count.
        const { totalPages } = await inspectXeroxPdf(uploadedPath);

        const colorMode = req.body.colorMode;
        const printSides = req.body.printSides;
        const paymentMethod = req.body.paymentMethod;

        const numberOfCopies = parsePositiveInteger(
            req.body.numberOfCopies,
            'numberOfCopies'
        );

        if (numberOfCopies > MAX_COPIES) {
            throw apiError(400, `A maximum of ${MAX_COPIES} copies is allowed.`);
        }

        if (!['black-and-white', 'color'].includes(colorMode)) {
            throw apiError(400, 'Invalid colorMode.');
        }

        if (!['single-sided', 'double-sided'].includes(printSides)) {
            throw apiError(400, 'Invalid printSides.');
        }

        if (!['upi', 'cash'].includes(paymentMethod)) {
            throw apiError(400, 'paymentMethod must be upi or cash.');
        }

        if (req.body.paperSize && req.body.paperSize !== 'A4') {
            throw apiError(400, 'Only A4 paper size is supported.');
        }

        const includeOHP = parseBoolean(
            req.body.includeOHP ?? 'false',
            'includeOHP'
        );

        const printRange = req.body.printRange || 'full';

        if (!['full', 'selected-pages'].includes(printRange)) {
            throw apiError(400, 'printRange must be full or selected-pages.');
        }

        let startPage;
        let endPage;

        if (printRange === 'full') {
            startPage = 1;
            endPage = totalPages;
        } else {
            startPage = parsePositiveInteger(req.body.startPage, 'startPage');
            endPage = parsePositiveInteger(req.body.endPage, 'endPage');

            if (startPage > endPage || endPage > totalPages) {
                throw apiError(
                    400,
                    `Selected pages must be between 1 and ${totalPages}.`
                );
            }

            if (startPage === 1 && endPage === totalPages) {
                throw apiError(
                    400,
                    'Choose full print when selecting every page.'
                );
            }
        }

        const pricing = calculateXeroxPrice({
            totalPages,
            startPage,
            endPage,
            numberOfCopies,
            colorMode,
            printSides,
            includeOHP,
        });

        // Store a relative private path, not an arbitrary URL from the client.
        const relativeDocumentPath = path
            .relative(process.cwd(), uploadedPath)
            .split(path.sep)
            .join('/');

        const request = await Xerox.create({
            student: req.user.id,
            documentUrl: relativeDocumentPath,
            totalPages,
            printRange,
            startPage,
            endPage,
            colorMode,
            numberOfCopies,
            paperSize: 'A4',
            printSides,
            includeOHP,
            estimatedPrice: pricing.estimatedPrice,
            paymentMethod,
        });

        res.status(201).json({
            success: true,
            message: 'Xerox request created successfully.',
            request: getSafeRequest(request),
            pricing,
        });
    } catch (error) {
        // If the request was rejected, don't leave an orphaned PDF behind.
        await removeUploadedFile(uploadedPath);
        next(error);
    }
};

// GET /api/xerox/my-requests
const getMyXeroxRequests = async (req, res, next) => {
    try {
        const requests = await Xerox.find({ student: req.user.id })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(getSafeRequest),
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/xerox/shop/requests
const getShopkeeperRequests = async (req, res, next) => {
    try {
        const requests = await Xerox.find({
            $or: [
                { shopkeeper: null, status: 'pending' },
                { shopkeeper: req.user.id },
            ],
        })
            .sort({ createdAt: 1 })
            .limit(100);

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(getSafeRequest),
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/xerox/:id/status

const updateXeroxStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            throw apiError(400, 'Invalid Xerox request ID.');
        }

        const allowedStatuses = {
            pending: ['accepted', 'rejected'],
            accepted: ['printing'],
            printing: ['ready-for-pickup'],
            'ready-for-pickup': ['completed'],
        };

        if (
            typeof status !== 'string' ||
            !Object.values(allowedStatuses).some((statuses) =>
                statuses.includes(status)
            )
        ) {
            throw apiError(400, 'Invalid requested status transition.');
        }

        // Find the current request to validate the intended transition.
        const currentRequest = await Xerox.findById(id);

        if (!currentRequest) {
            throw apiError(404, 'Xerox request not found.');
        }

        if (
            currentRequest.shopkeeper &&
            currentRequest.shopkeeper.toString() !== req.user.id
        ) {
            throw apiError(403, 'This request belongs to another shopkeeper.');
        }

        const permittedNextStatuses =
            allowedStatuses[currentRequest.status] || [];

        if (!permittedNextStatuses.includes(status)) {
            throw apiError(
                400,
                `Cannot change request status from ${currentRequest.status} to ${status}.`
            );
        }

        // Use a conditional atomic update so concurrent requests cannot
        // overwrite a status that has already changed.
        const filter = {
            _id: id,
            status: currentRequest.status,
        };

        if (currentRequest.status === 'pending') {
            // Only one shopkeeper can claim an unassigned pending request.
            filter.shopkeeper = null;
        } else {
            // Only the shopkeeper assigned to this request may update it.
            filter.shopkeeper = req.user.id;
        }

        const updatedRequest = await Xerox.findOneAndUpdate(
            filter,
            {
                $set: {
                    status,
                    ...(currentRequest.status === 'pending'
                        ? { shopkeeper: req.user.id }
                        : {}),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedRequest) {
            throw apiError(
                409,
                'This request has already been claimed or updated. Refresh and try again.'
            );
        }

        return res.json({
            success: true,
            message: `Xerox request ${status}.`,
            request: getSafeRequest(updatedRequest),
        });
    } catch (error) {
        next(error);
    }
};


// GET /api/xerox/:id/document
const downloadXeroxDocument = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw apiError(400, 'Invalid Xerox request ID.');
        }

        const request = await Xerox.findById(id);

        if (!request) {
            throw apiError(404, 'Xerox request not found.');
        }

        const isStudentOwner = request.student.toString() === req.user.id;
        const isAssignedShopkeeper =
            req.user.role === 'shopkeeper' &&
            request.shopkeeper &&
            request.shopkeeper.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isStudentOwner && !isAssignedShopkeeper && !isAdmin) {
            throw apiError(403, 'You are not allowed to access this document.');
        }

        // Resolve only paths inside the private Xerox upload directory.
        const filename = path.basename(request.documentUrl);
        const filePath = path.resolve(uploadDirectory, filename);
        const resolvedDirectory = path.resolve(uploadDirectory);

        if (!filePath.startsWith(`${resolvedDirectory}${path.sep}`)) {
            throw apiError(400, 'Invalid stored document path.');
        }

        await fs.access(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="xerox-${request._id}.pdf"`
        );

        res.sendFile(filePath, (error) => {
            if (error && !res.headersSent) {
                next(error);
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return next(apiError(404, 'The uploaded document is no longer available.'));
        }

        next(error);
    }
};


// PATCH /api/xerox/:id/payment
const markXeroxPaymentPaid = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw apiError(400, 'Invalid Xerox request ID.');
        }

        const currentRequest = await Xerox.findById(id);

        if (!currentRequest) {
            throw apiError(404, 'Xerox request not found.');
        }

        if (
            !currentRequest.shopkeeper ||
            currentRequest.shopkeeper.toString() !== req.user.id
        ) {
            throw apiError(
                403,
                'Only the assigned shopkeeper can confirm this payment.'
            );
        }

        if (currentRequest.status !== 'completed') {
            throw apiError(
                400,
                'Payment can only be confirmed after the Xerox request is completed.'
            );
        }

        if (currentRequest.paymentStatus !== 'pending') {
            throw apiError(
                409,
                `Payment is already ${currentRequest.paymentStatus}.`
            );
        }

        const updatedRequest = await Xerox.findOneAndUpdate(
            {
                _id: id,
                shopkeeper: req.user.id,
                status: 'completed',
                paymentStatus: 'pending',
            },
            {
                $set: { paymentStatus: 'paid' },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedRequest) {
            throw apiError(
                409,
                'Payment status has already changed. Refresh and try again.'
            );
        }

        return res.json({
            success: true,
            message: 'Xerox payment marked as paid.',
            request: getSafeRequest(updatedRequest),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPricing,
    createXeroxRequest,
    getMyXeroxRequests,
    getShopkeeperRequests,
    updateXeroxStatus,
    markXeroxPaymentPaid,
    downloadXeroxDocument,
};
