const test = require('node:test')
const assert = require('node:assert/strict')

test('Frontend UPI Flow - URI & Param Construction', async (t) => {
  // Test building UPI URI string according to Requirement 2:
  // upi://pay?pa={shop.upiId}&pn={shop.name}&am={order.total}&cu=INR&tn=CampusHub {order code}
  const buildUpiLink = (shop, order) => {
    const upiId = shop?.upiId || ''
    const shopName = shop?.name || 'Campus Outlet'
    const amount = Number(order?.totalAmount ?? order?.total ?? 0)
    const orderId = String(order?._id || order?.id || '')
    const orderCode = orderId ? orderId.slice(-6).toUpperCase() : ''
    const tnValue = orderCode ? `CampusHub ${orderCode}` : 'CampusHub'

    if (!upiId) return ''
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(tnValue)}`
  }

  await t.test('Builds valid UPI URI matching requirement specification', () => {
    const shop = { name: 'Main Canteen', upiId: 'canteen@okhdfcbank' }
    const order = { _id: '673a9f0e1234567890abcdef', totalAmount: 180 }
    const link = buildUpiLink(shop, order)

    assert.equal(
      link,
      'upi://pay?pa=canteen@okhdfcbank&pn=Main%20Canteen&am=180&cu=INR&tn=CampusHub%20ABCDEF'
    )
  })

  await t.test('Handles fallback if order code or shop name has special characters', () => {
    const shop = { name: 'Nescafe & Bakery', upiId: 'nescafe@upi' }
    const order = { total: 45, id: '507f191e810c19729de860ea' }
    const link = buildUpiLink(shop, order)

    assert.ok(link.includes('pa=nescafe@upi'))
    assert.ok(link.includes('pn=Nescafe%20%26%20Bakery'))
    assert.ok(link.includes('am=45'))
    assert.ok(link.includes('cu=INR'))
    assert.ok(link.includes('tn=CampusHub%20E860EA'))
  })

  await t.test('Returns empty string when upiId is missing (never hardcoded)', () => {
    const shop = { name: 'No UPI Shop' }
    const order = { _id: '123456', totalAmount: 50 }
    const link = buildUpiLink(shop, order)

    assert.equal(link, '')
  })
})

test('Frontend UPI Flow - UTR and Screenshot Validation', async (t) => {
  const sanitizeUtr = (val) => String(val || '').replace(/\D/g, '').slice(0, 12)
  const isSubmitDisabled = (utr, screenshot, isSubmitting = false) => {
    const cleanUtr = sanitizeUtr(utr)
    return cleanUtr.length !== 12 || !screenshot || isSubmitting
  }

  await t.test('Sanitizes UTR to digits only and max 12 characters', () => {
    assert.equal(sanitizeUtr('1234abcd5678efgh9012'), '123456789012')
    assert.equal(sanitizeUtr('123-456-789-012'), '123456789012')
    assert.equal(sanitizeUtr('   '), '')
  })

  await t.test('Submit disabled when UTR is incomplete or empty', () => {
    const fakeScreenshot = { name: 'proof.png' }
    assert.equal(isSubmitDisabled('', fakeScreenshot), true)
    assert.equal(isSubmitDisabled('12345', fakeScreenshot), true)
    assert.equal(isSubmitDisabled('12345678901', fakeScreenshot), true)
  })

  await t.test('Submit disabled when screenshot is missing', () => {
    assert.equal(isSubmitDisabled('123456789012', null), true)
    assert.equal(isSubmitDisabled('123456789012', undefined), true)
  })

  await t.test('Submit enabled only when both 12-digit UTR and screenshot are present', () => {
    const fakeScreenshot = { name: 'proof.jpg' }
    assert.equal(isSubmitDisabled('123456789012', fakeScreenshot, false), false)
  })

  await t.test('Submit disabled while isSubmitting is true', () => {
    const fakeScreenshot = { name: 'proof.jpg' }
    assert.equal(isSubmitDisabled('123456789012', fakeScreenshot, true), true)
  })
})

test('Frontend UPI Flow - Dashboard Order Payment Badges', async (t) => {
  const getPaymentBadge = (order) => {
    const status = order?.paymentStatus
    if (status === 'paid') {
      return { variant: 'success', label: 'Paid ✓' }
    }
    if (status === 'rejected') {
      const reason = order?.paymentRejectReason
      return {
        variant: 'danger',
        label: reason ? `Rejected: ${reason}` : 'Rejected',
      }
    }
    // 'pending_verification', 'unpaid', or undefined
    return { variant: 'warning', label: 'Payment pending' }
  }

  await t.test('Shows "Paid ✓" badge for paid status', () => {
    const badge = getPaymentBadge({ paymentStatus: 'paid' })
    assert.equal(badge.variant, 'success')
    assert.equal(badge.label, 'Paid ✓')
  })

  await t.test('Shows "Rejected: {reason}" badge for rejected status with reason', () => {
    const badge = getPaymentBadge({
      paymentStatus: 'rejected',
      paymentRejectReason: 'Blurry screenshot',
    })
    assert.equal(badge.variant, 'danger')
    assert.equal(badge.label, 'Rejected: Blurry screenshot')
  })

  await t.test('Shows "Rejected" if reason is omitted', () => {
    const badge = getPaymentBadge({ paymentStatus: 'rejected' })
    assert.equal(badge.variant, 'danger')
    assert.equal(badge.label, 'Rejected')
  })

  await t.test('Shows "Payment pending" for pending_verification, unpaid, or default', () => {
    assert.deepEqual(getPaymentBadge({ paymentStatus: 'pending_verification' }), {
      variant: 'warning',
      label: 'Payment pending',
    })
    assert.deepEqual(getPaymentBadge({ paymentStatus: 'unpaid' }), {
      variant: 'warning',
      label: 'Payment pending',
    })
    assert.deepEqual(getPaymentBadge({}), {
      variant: 'warning',
      label: 'Payment pending',
    })
  })
})

test('Frontend UPI Flow - Shop Data Enrichment', async (t) => {
  // Simulates enriching orders with shop upiId from /api/shops
  const enrichOrderWithShop = (order, shopsList) => {
    const shopId = String(order?.shopId?._id || order?.shopId || '')
    const fullShop = shopsList.find((s) => String(s._id) === shopId) || null
    return {
      ...order,
      shop: fullShop || order.shopId,
      shopId: {
        ...(typeof order.shopId === 'object' ? order.shopId : {}),
        ...(fullShop || {}),
      },
    }
  }

  await t.test('Enriches order with upiId from shop list', () => {
    const shops = [
      { _id: 'shop-1', name: 'Campus Cafe', upiId: 'cafe@upi' },
      { _id: 'shop-2', name: 'Bakery Point', upiId: 'bakery@upi' },
    ]
    const rawOrder = {
      _id: 'order-1',
      shopId: { _id: 'shop-1', name: 'Campus Cafe' }, // Note upiId not populated by backend
      totalAmount: 100,
      paymentStatus: 'unpaid',
    }

    const enriched = enrichOrderWithShop(rawOrder, shops)
    assert.equal(enriched.shopId.upiId, 'cafe@upi')
    assert.equal(enriched.shop.upiId, 'cafe@upi')
  })
})

