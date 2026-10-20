const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateXeroxPrice } = require('../utils/xeroxPricing');

test('B&W single-sided: charges ₹5 per printed page', () => {
    const result = calculateXeroxPrice({
        totalPages: 10,
        startPage: 1,
        endPage: 10,
        numberOfCopies: 2,
        colorMode: 'black-and-white',
        printSides: 'single-sided',
    });

    assert.equal(result.selectedPages, 10);
    assert.equal(result.unitsPerCopy, 10);
    assert.equal(result.printingCost, 100);
    assert.equal(result.ohpCost, 0);
    assert.equal(result.estimatedPrice, 100);
});

test('B&W double-sided: charges ₹8 per physical sheet', () => {
    const result = calculateXeroxPrice({
        totalPages: 10,
        startPage: 1,
        endPage: 10,
        numberOfCopies: 2,
        colorMode: 'black-and-white',
        printSides: 'double-sided',
    });

    assert.equal(result.unitsPerCopy, 5);
    assert.equal(result.printingCost, 80);
    assert.equal(result.estimatedPrice, 80);
});

test('Double-sided printing rounds odd page counts up to a full sheet', () => {
    const result = calculateXeroxPrice({
        totalPages: 5,
        startPage: 2,
        endPage: 4,
        numberOfCopies: 1,
        colorMode: 'black-and-white',
        printSides: 'double-sided',
    });

    assert.equal(result.selectedPages, 3);
    assert.equal(result.unitsPerCopy, 2);
    assert.equal(result.estimatedPrice, 16);
});

test('Color single-sided: charges ₹10 per printed page', () => {
    const result = calculateXeroxPrice({
        totalPages: 4,
        startPage: 1,
        endPage: 4,
        numberOfCopies: 1,
        colorMode: 'color',
        printSides: 'single-sided',
    });

    assert.equal(result.estimatedPrice, 40);
});

test('Color double-sided: charges ₹15 per physical sheet', () => {
    const result = calculateXeroxPrice({
        totalPages: 4,
        startPage: 1,
        endPage: 4,
        numberOfCopies: 2,
        colorMode: 'color',
        printSides: 'double-sided',
    });

    assert.equal(result.unitsPerCopy, 2);
    assert.equal(result.estimatedPrice, 60);
});

test('OHP adds ₹10 per copy', () => {
    const result = calculateXeroxPrice({
        totalPages: 3,
        startPage: 2,
        endPage: 3,
        numberOfCopies: 2,
        colorMode: 'black-and-white',
        printSides: 'single-sided',
        includeOHP: true,
    });

    assert.equal(result.printingCost, 20);
    assert.equal(result.ohpCost, 20);
    assert.equal(result.estimatedPrice, 40);
});

test('Rejects an invalid page range', () => {
    assert.throws(
        () => calculateXeroxPrice({
            totalPages: 3,
            startPage: 2,
            endPage: 4,
            numberOfCopies: 1,
            colorMode: 'black-and-white',
            printSides: 'single-sided',
        }),
        /Invalid selected page range/
    );
});

test('Rejects zero copies', () => {
    assert.throws(
        () => calculateXeroxPrice({
            totalPages: 3,
            startPage: 1,
            endPage: 3,
            numberOfCopies: 0,
            colorMode: 'black-and-white',
            printSides: 'single-sided',
        }),
        /Number of copies must be between 1 and 100/
    );
});

test('Rejects more than 100 copies', () => {
    assert.throws(
        () => calculateXeroxPrice({
            totalPages: 3,
            startPage: 1,
            endPage: 3,
            numberOfCopies: 101,
            colorMode: 'black-and-white',
            printSides: 'single-sided',
        }),
        /Number of copies must be between 1 and 100/
    );
});

test('Rejects unsupported print options', () => {
    assert.throws(
        () => calculateXeroxPrice({
            totalPages: 3,
            startPage: 1,
            endPage: 3,
            numberOfCopies: 1,
            colorMode: 'invalid',
            printSides: 'single-sided',
        }),
        /Invalid print options/
    );
});

test('Rejects non-boolean OHP values', () => {
    assert.throws(
        () => calculateXeroxPrice({
            totalPages: 3,
            startPage: 1,
            endPage: 3,
            numberOfCopies: 1,
            colorMode: 'black-and-white',
            printSides: 'single-sided',
            includeOHP: 'yes',
        }),
        /includeOHP must be true or false/
    );
});
