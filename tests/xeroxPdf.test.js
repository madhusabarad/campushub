const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const { inspectXeroxPdf } = require('../utils/xeroxPdf');

test('Counts pages from a valid PDF', async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    pdf.addPage();

    const bytes = await pdf.save();
    const filePath = path.join(os.tmpdir(), `xerox-test-${Date.now()}.pdf`);

    try {
        await fs.writeFile(filePath, bytes);

        const result = await inspectXeroxPdf(filePath);

        assert.equal(result.totalPages, 3);
        assert.equal(result.fileSize, bytes.length);
    } finally {
        await fs.rm(filePath, { force: true });
    }
});

test('Rejects a file that is not a PDF', async () => {
    const filePath = path.join(os.tmpdir(), `xerox-invalid-${Date.now()}.pdf`);

    try {
        await fs.writeFile(filePath, 'This is not a PDF file');

        await assert.rejects(
            inspectXeroxPdf(filePath),
            /not a valid PDF/
        );
    } finally {
        await fs.rm(filePath, { force: true });
    }
});

test('Rejects an empty PDF file', async () => {
    const filePath = path.join(os.tmpdir(), `xerox-empty-${Date.now()}.pdf`);

    try {
        await fs.writeFile(filePath, '');

        await assert.rejects(
            inspectXeroxPdf(filePath),
            /not a valid PDF/
        );
    } finally {
        await fs.rm(filePath, { force: true });
    }
});

test('Rejects a missing file path', async () => {
    await assert.rejects(
        inspectXeroxPdf(null),
        /No PDF document was uploaded/
    );
});
