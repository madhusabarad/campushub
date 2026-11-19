const test = require('node:test')
const assert = require('node:assert/strict')

test('Checkout & Payment Utilities Logic', async (t) => {
  const {
    PAYMENT_STATUSES,
    PAYMENT_FAILURE_REASONS,
    PAYMENT_METHODS,
    calculateOrderPricing,
    formatCurrency,
    generatePaymentReference,
    generateMockPaymentId,
    buildRazorpayOptions,
  } = await import('../frontend/src/utils/checkoutPayment.js')

  await t.test('PAYMENT_STATUSES defines all required lifecycle states', () => {
    assert.equal(PAYMENT_STATUSES.IDLE, 'idle')
    assert.equal(PAYMENT_STATUSES.PROCESSING, 'processing')
    assert.equal(PAYMENT_STATUSES.SUCCESS, 'success')
    assert.equal(PAYMENT_STATUSES.FAILED, 'failed')
    assert.equal(PAYMENT_STATUSES.CANCELLED, 'cancelled')
  })

  await t.test('calculateOrderPricing calculates correct subtotals and item counts', () => {
    const items = [
      { name: 'Masala Dosa', price: 60, quantity: 2 },
      { name: 'Filter Coffee', price: 20, quantity: 3 },
    ]

    const result = calculateOrderPricing(items)
    assert.equal(result.itemsCount, 5)
    assert.equal(result.subtotal, 180)
    assert.equal(result.serviceFee, 0)
    assert.equal(result.packagingFee, 0)
    assert.equal(result.discount, 0)
    assert.equal(result.totalAmount, 180)
    assert.equal(result.formattedSubtotal, '₹180')
    assert.equal(result.formattedTotal, '₹180')
  })

  await t.test('calculateOrderPricing incorporates custom fees and discounts', () => {
    const items = [{ name: 'Veg Thali', price: 120, quantity: 1 }]
    const result = calculateOrderPricing(items, {
      serviceFee: 5,
      packagingFee: 10,
      discount: 15,
    })

    assert.equal(result.itemsCount, 1)
    assert.equal(result.subtotal, 120)
    assert.equal(result.serviceFee, 5)
    assert.equal(result.packagingFee, 10)
    assert.equal(result.discount, 15)
    assert.equal(result.totalAmount, 120) // 120 + 5 + 10 - 15 = 120
  })

  await t.test('calculateOrderPricing safely handles empty, null, or malformed items', () => {
    assert.deepEqual(calculateOrderPricing([]), {
      itemsCount: 0,
      subtotal: 0,
      serviceFee: 0,
      packagingFee: 0,
      discount: 0,
      totalAmount: 0,
      formattedSubtotal: '₹0',
      formattedTotal: '₹0',
    })

    assert.deepEqual(calculateOrderPricing(null), {
      itemsCount: 0,
      subtotal: 0,
      serviceFee: 0,
      packagingFee: 0,
      discount: 0,
      totalAmount: 0,
      formattedSubtotal: '₹0',
      formattedTotal: '₹0',
    })

    const malformed = [
      { price: 'invalid', quantity: 2 },
      { price: 50, quantity: -1 },
      { price: null, quantity: null },
      { price: 40, quantity: 2 },
    ]
    const malformedResult = calculateOrderPricing(malformed)
    assert.equal(malformedResult.itemsCount, 2)
    assert.equal(malformedResult.subtotal, 80)
    assert.equal(malformedResult.totalAmount, 80)
  })

  await t.test('formatCurrency formats amounts into Indian Rupees (₹)', () => {
    assert.equal(formatCurrency(0), '₹0')
    assert.equal(formatCurrency(150), '₹150')
    assert.equal(formatCurrency(1500), '₹1,500')
    assert.equal(formatCurrency(100000), '₹1,00,000')
    assert.equal(formatCurrency('abc'), '₹0')
    assert.equal(formatCurrency(null), '₹0')
  })

  await t.test('generatePaymentReference produces valid identifiers with prefixes', () => {
    const ref = generatePaymentReference('RZP')
    assert.match(ref, /^RZP-[A-Z0-9]+-[A-Z0-9]+$/)

    const customRef = generatePaymentReference('CAMPUS')
    assert.match(customRef, /^CAMPUS-[A-Z0-9]+-[A-Z0-9]+$/)
  })

  await t.test('generateMockPaymentId produces Razorpay standard pay_ prefix', () => {
    const payId = generateMockPaymentId()
    assert.match(payId, /^pay_[a-z0-9]+$/)
  })

  await t.test('buildRazorpayOptions constructs expected Razorpay configuration', () => {
    let handledResponse = null
    let dismissed = false

    const options = buildRazorpayOptions({
      key: 'rzp_test_1234567890',
      amount: 250,
      orderId: 'order_test_999',
      user: {
        name: 'Rahul Sharma',
        email: 'rahul@campus.edu',
        collegeId: 'CS202401',
      },
      notes: 'Extra spicy please',
      onSuccess: (res) => {
        handledResponse = res
      },
      onDismiss: () => {
        dismissed = true
      },
    })

    assert.equal(options.key, 'rzp_test_1234567890')
    assert.equal(options.amount, 25000) // ₹250 in paise
    assert.equal(options.currency, 'INR')
    assert.equal(options.name, 'CampusHub Outlets')
    assert.equal(options.theme.color, '#7b1e1e')
    assert.equal(options.prefill.name, 'Rahul Sharma')
    assert.equal(options.prefill.email, 'rahul@campus.edu')
    assert.equal(options.prefill.contact, 'CS202401')
    assert.equal(options.notes.campusNotes, 'Extra spicy please')

    // Test handler execution
    options.handler({ razorpay_payment_id: 'pay_abc123' })
    assert.ok(handledResponse)
    assert.equal(handledResponse.razorpay_payment_id, 'pay_abc123')

    // Test modal dismissal
    options.modal.ondismiss()
    assert.equal(dismissed, true)

    // Test error callback
    let errorHandled = null
    const optionsWithErr = buildRazorpayOptions({
      amount: 100,
      onFailure: (err) => {
        errorHandled = err
      },
    })
    optionsWithErr.error({ message: 'Network failure' })
    assert.ok(errorHandled)
    assert.equal(errorHandled.message, 'Network failure')
  })

  await t.test('calculateOrderPricing handles discounts exceeding subtotal by clamping to 0', () => {
    const items = [{ name: 'Chai', price: 15, quantity: 1 }]
    const result = calculateOrderPricing(items, { discount: 50 })
    assert.equal(result.totalAmount, 0)
    assert.equal(result.formattedTotal, '₹0')
  })

  await t.test('PAYMENT_METHODS includes comprehensive payment choices', () => {
    assert.ok(Array.isArray(PAYMENT_METHODS))
    assert.ok(PAYMENT_METHODS.length >= 3)
    const hasUpi = PAYMENT_METHODS.some((m) => m.id === 'razorpay_upi')
    const hasCards = PAYMENT_METHODS.some((m) => m.id === 'razorpay_cards')
    assert.ok(hasUpi, 'Must include UPI')
    assert.ok(hasCards, 'Must include Cards')
  })

  await t.test('PAYMENT_FAILURE_REASONS provides user-friendly error messages', () => {
    assert.ok(PAYMENT_FAILURE_REASONS.user_cancelled)
    assert.match(PAYMENT_FAILURE_REASONS.user_cancelled, /cancelled/i)
    assert.ok(PAYMENT_FAILURE_REASONS.bank_declined)
    assert.ok(PAYMENT_FAILURE_REASONS.gateway_timeout)
  })
})
