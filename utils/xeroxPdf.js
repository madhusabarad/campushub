
const fs = require('fs/promises');
const { PDFDocument } = require('pdf-lib');

/**
 * Reads and validates an uploaded PDF.
 * Returns its verified page count.
 *
 * The file must already have been saved by Multer.
 */
async function inspectXeroxPdf(filePath) {
    if (!filePath) {
        throw new Error('No PDF document was uploaded.');
    }

    const buffer = await fs.readFile(filePath);

    // Reject files without a PDF header.
    if (
        buffer.length < 5 ||
        buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
        throw new Error('The uploaded file is not a valid PDF.');
    }

    let pdf;

    try {
        pdf = await PDFDocument.load(buffer, {
            updateMetadata: false,
            throwOnInvalidObject: true,
        });
    } catch {
        throw new Error(
            'The PDF could not be read. Please upload a valid, unencrypted PDF.'
        );
    }

    const totalPages = pdf.getPageCount();

    if (!Number.isSafeInteger(totalPages) || totalPages < 1) {
        throw new Error('The PDF must contain at least one page.');
    }

    return {
        totalPages,
        fileSize: buffer.length,
    };
}

module.exports = {
    inspectXeroxPdf,
};
