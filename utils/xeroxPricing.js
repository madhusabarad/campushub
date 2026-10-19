
const PRINT_RATES = {
    'black-and-white': {
        'single-sided': 5,
        'double-sided': 8,
    },
    color: {
        'single-sided': 10,
        'double-sided': 15,
    },
};

const OHP_SHEET_PRICE = 5;

function calculateXeroxPrice({
    totalPages,
    startPage,
    endPage,
    numberOfCopies,
    colorMode,
    printSides,
    includeOHP = false,
}) {
    const validInteger = (value) =>
        Number.isSafeInteger(value) && value > 0;

    if (!validInteger(totalPages)) {
        throw new Error('Invalid PDF page count.');
    }

    if (
        !validInteger(startPage) ||
        !validInteger(endPage) ||
        startPage > endPage ||
        endPage > totalPages
    ) {
        throw new Error('Invalid selected page range.');
    }

    if (!validInteger(numberOfCopies) || numberOfCopies > 100) {
        throw new Error('Number of copies must be between 1 and 100.');
    }

    if (!PRINT_RATES[colorMode]?.[printSides]) {
        throw new Error('Invalid print options.');
    }

    if (typeof includeOHP !== 'boolean') {
        throw new Error('includeOHP must be true or false.');
    }

    const selectedPages = endPage - startPage + 1;
    const rate = PRINT_RATES[colorMode][printSides];

    // Single-sided: charge each printed page.
    // Double-sided: charge each physical sheet, rounding up
    // when the selected page count is odd.
    const unitsPerCopy =
        printSides === 'single-sided'
            ? selectedPages
            : Math.ceil(selectedPages / 2);

    const printingCost = unitsPerCopy * rate * numberOfCopies;

    // Each copy gets one front and one back OHP cover.
    const ohpCost = includeOHP
        ? 2 * OHP_SHEET_PRICE * numberOfCopies
        : 0;

    const totalPrice = printingCost + ohpCost;

    return {
        totalPages,
        startPage,
        endPage,
        selectedPages,
        numberOfCopies,
        colorMode,
        printSides,
        includeOHP,
        unitsPerCopy,
        printingCost,
        ohpCost,
        estimatedPrice: Number(totalPrice.toFixed(2)),
    };
}

module.exports = {
    calculateXeroxPrice,
    PRINT_RATES,
    OHP_SHEET_PRICE,
};
