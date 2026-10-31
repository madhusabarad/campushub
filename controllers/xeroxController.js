const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const Xerox = require('../models/Xerox');
const User = require('../models/User');

const { uploadDirectory } = require('../middleware/xeroxUploadMiddleware');
const { inspectXeroxPdf } = require('../utils/xeroxPdf');

const {
    calculateXeroxPrice,
    PRINT_RATES,
    OHP_SHEET_PRICE,
} = require('../utils/xeroxPricing');

const MAX_COPIES = 100;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const XEROX_STATUSES = [
    'pending',
    'accepted',
    'rejected',
    'printing',
    'ready-for-pickup',
    'completed',
    'cancelled',
];

const PAYMENT_STATUSES = [
    'pending',
    'paid',
    'failed',
    'refunded',
];

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

function getPagination(query) {
    const page = query.page === undefined ? 1 : Number(query.page);
    const limit =
        query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

    if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > MAX_LIMIT
    ) {
        throw apiError(
            400,
            `page must be positive and limit must be between 1 and ${MAX_LIMIT}.`
        );
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
        throw apiError(400, 'Requested page is too large.');
    }

    return { page, limit, skip };
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDateFilter(query) {
    const filter = {};

    if (query.from !== undefined) {
        if (
            typeof query.from !== 'string' ||
            !query.from.trim()
        ) {
            throw apiError(400, 'from must be a valid date.');
        }

        const fromValue = query.from.trim();
        const from = new Date(fromValue);

        if (Number.isNaN(from.getTime())) {
            throw apiError(400, 'from must be a valid date.');
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(fromValue)) {
            const [year, month, day] = fromValue.split('-').map(Number);

            if (
                from.getUTCFullYear() !== year ||
                from.getUTCMonth() !== month - 1 ||
                from.getUTCDate() !== day
            ) {
                throw apiError(400, 'from must be a valid date.');
            }

            from.setUTCHours(0, 0, 0, 0);
        }

        filter.$gte = from;
    }

    if (query.to !== undefined) {
        if (
            typeof query.to !== 'string' ||
            !query.to.trim()
        ) {
            throw apiError(400, 'to must be a valid date.');
        }

        const toValue = query.to.trim();
        const to = new Date(toValue);

        if (Number.isNaN(to.getTime())) {
            throw apiError(400, 'to must be a valid date.');
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(toValue)) {
            const [year, month, day] = toValue.split('-').map(Number);

            if (
                to.getUTCFullYear() !== year ||
                to.getUTCMonth() !== month - 1 ||
                to.getUTCDate() !== day
            ) {
                throw apiError(400, 'to must be a valid date.');
            }

            to.setUTCHours(23, 59, 59, 999);
        }

        filter.$lte = to;
    }

    if (
        filter.$gte &&
        filter.$lte &&
        filter.$gte > filter.$lte
    ) {
        throw apiError(400, 'from cannot be later than to.');
    }

    return filter;
}

function validateFilter(value, allowedValues, fieldName) {
    if (value === undefined) return;

    if (
        typeof value !== 'string' ||
        !allowedValues.includes(value)
    ) {
        throw apiError(400, `Invalid ${fieldName}.`);
    }
}

async function removeUploadedFile(filePath) {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(
                'Could not remove uploaded Xerox file:',
                error.message
            );
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

function getPaginationMetadata(page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
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
            throw apiError(
                400,
                'Please upload a PDF using the document field.'
            );
        }

        uploadedPath = req.file.path;

        const { totalPages } = await inspectXeroxPdf(uploadedPath);

        const colorMode = req.body.colorMode;
        const printSides = req.body.printSides;
        const paymentMethod = req.body.paymentMethod;

        const numberOfCopies = parsePositiveInteger(
            req.body.numberOfCopies,
            'numberOfCopies'
        );

        if (numberOfCopies > MAX_COPIES) {
            throw apiError(
                400,
                `A maximum of ${MAX_COPIES} copies is allowed.`
            );
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
            throw apiError(
                400,
                'printRange must be full or selected-pages.'
            );
        }

        let startPage;
        let endPage;

        if (printRange === 'full') {
            startPage = 1;
            endPage = totalPages;
        } else {
            startPage = parsePositiveInteger(
                req.body.startPage,
                'startPage'
            );

            endPage = parsePositiveInteger(
                req.body.endPage,
                'endPage'
            );

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
        await removeUploadedFile(uploadedPath);
        next(error);
    }
};

// GET /api/xerox/my-requests

const getMyXeroxRequests = async (req, res, next) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const filter = {
            student: req.user.id,
        };

        validateFilter(
            req.query.status,
            XEROX_STATUSES,
            'status'
        );

        validateFilter(
            req.query.paymentStatus,
            PAYMENT_STATUSES,
            'paymentStatus'
        );

        if (req.query.status !== undefined) {
            filter.status = req.query.status;
        }

        if (req.query.paymentStatus !== undefined) {
            filter.paymentStatus = req.query.paymentStatus;
        }

        const dateFilter = getDateFilter(req.query);

        if (Object.keys(dateFilter).length > 0) {
            filter.createdAt = dateFilter;
        }

        const [requests, total] = await Promise.all([
            Xerox.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Xerox.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(getSafeRequest),
            pagination: getPaginationMetadata(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/xerox/shop/requests

const getShopkeeperRequests = async (req, res, next) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const conditions = [
            {
                $or: [
                    {
                        shopkeeper: null,
                        status: 'pending',
                    },
                    {
                        shopkeeper: req.user.id,
                    },
                ],
            },
        ];

        validateFilter(
            req.query.status,
            XEROX_STATUSES,
            'status'
        );

        validateFilter(
            req.query.paymentStatus,
            PAYMENT_STATUSES,
            'paymentStatus'
        );

        if (req.query.status !== undefined) {
            conditions.push({
                status: req.query.status,
            });
        }

        if (req.query.paymentStatus !== undefined) {
            conditions.push({
                paymentStatus: req.query.paymentStatus,
            });
        }

        const dateFilter = getDateFilter(req.query);

        if (Object.keys(dateFilter).length > 0) {
            conditions.push({
                createdAt: dateFilter,
            });
        }

        if (req.query.search !== undefined) {
            if (
                typeof req.query.search !== 'string' ||
                !req.query.search.trim()
            ) {
                throw apiError(400, 'search must be a non-empty string.');
            }

            const search = req.query.search.trim();

            if (search.length > 100) {
                throw apiError(
                    400,
                    'search must not exceed 100 characters.'
                );
            }

            const escapedSearch = escapeRegex(search);
            const searchConditions = [];

            if (mongoose.isValidObjectId(search)) {
                searchConditions.push({
                    _id: search,
                });
            }

            const matchingStudents = await User.find({
                role: 'student',
                $or: [
                    {
                        name: {
                            $regex: escapedSearch,
                            $options: 'i',
                        },
                    },
                    {
                        email: {
                            $regex: escapedSearch,
                            $options: 'i',
                        },
                    },
                    {
                        collegeId: {
                            $regex: escapedSearch,
                            $options: 'i',
                        },
                    },
                ],
            }).select('_id').lean();

            const studentIds = matchingStudents.map(
                (student) => student._id
            );

            if (studentIds.length > 0) {
                searchConditions.push({
                    student: {
                        $in: studentIds,
                    },
                });
            }

            if (searchConditions.length === 0) {
                conditions.push({
                    _id: null,
                });
            } else {
                conditions.push({
                    $or: searchConditions,
                });
            }
        }

        const filter = {
            $and: conditions,
        };

        const [requests, total] = await Promise.all([
            Xerox.find(filter)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),

            Xerox.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(getSafeRequest),
            pagination: getPaginationMetadata(page, limit, total),
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

        const currentRequest = await Xerox.findById(id);

        if (!currentRequest) {
            throw apiError(404, 'Xerox request not found.');
        }

        if (
            currentRequest.shopkeeper &&
            currentRequest.shopkeeper.toString() !== req.user.id
        ) {
            throw apiError(
                403,
                'This request belongs to another shopkeeper.'
            );
        }

        const permittedNextStatuses =
            allowedStatuses[currentRequest.status] || [];

        if (!permittedNextStatuses.includes(status)) {
            throw apiError(
                400,
                `Cannot change request status from ${currentRequest.status} to ${status}.`
            );
        }

        const filter = {
            _id: id,
            status: currentRequest.status,
        };

        if (currentRequest.status === 'pending') {
            filter.shopkeeper = null;
        } else {
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

        const isStudentOwner =
            request.student.toString() === req.user.id;

        const isAssignedShopkeeper =
            req.user.role === 'shopkeeper' &&
            request.shopkeeper &&
            request.shopkeeper.toString() === req.user.id;

        const isAdmin = req.user.role === 'admin';

        if (!isStudentOwner && !isAssignedShopkeeper && !isAdmin) {
            throw apiError(
                403,
                'You are not allowed to access this document.'
            );
        }

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
            return next(
                apiError(404, 'The uploaded document is no longer available.')
            );
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
                $set: {
                    paymentStatus: 'paid',
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