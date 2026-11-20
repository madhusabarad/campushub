const test = require('node:test')
const assert = require('node:assert/strict')

test('Order Status Timeline & Notification Logic', async (t) => {
  const {
    TIMELINE_STEPS,
    getTimelineStepIndex,
    getStepState,
    getStatusBadge,
    buildStatusNotification,
  } = await import('../frontend/src/utils/orderTimeline.js')

  await t.test('Timeline steps order: Placed -> Confirmed -> Preparing -> Ready -> Completed', () => {
    assert.equal(TIMELINE_STEPS.length, 5)
    assert.deepEqual(
      TIMELINE_STEPS.map((s) => s.key),
      ['placed', 'confirmed', 'preparing', 'ready', 'completed']
    )
    assert.deepEqual(
      TIMELINE_STEPS.map((s) => s.label),
      ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed']
    )
  })

  await t.test('getTimelineStepIndex returns expected indices for all order statuses', () => {
    assert.equal(getTimelineStepIndex('placed'), 0)
    assert.equal(getTimelineStepIndex('confirmed'), 1)
    assert.equal(getTimelineStepIndex('preparing'), 2)
    assert.equal(getTimelineStepIndex('ready'), 3)
    assert.equal(getTimelineStepIndex('completed'), 4)
    assert.equal(getTimelineStepIndex('cancelled'), -1)
  })

  await t.test('getStepState correctly classifies each step for preparing state', () => {
    assert.equal(getStepState('placed', 'preparing'), 'completed')
    assert.equal(getStepState('confirmed', 'preparing'), 'completed')
    assert.equal(getStepState('preparing', 'preparing'), 'current')
    assert.equal(getStepState('ready', 'preparing'), 'upcoming')
    assert.equal(getStepState('completed', 'preparing'), 'upcoming')
  })

  await t.test('getStepState correctly marks all steps completed when status is completed', () => {
    for (const step of TIMELINE_STEPS) {
      assert.equal(getStepState(step.key, 'completed'), 'completed')
    }
  })

  await t.test('getStepState returns cancelled for cancelled order', () => {
    for (const step of TIMELINE_STEPS) {
      assert.equal(getStepState(step.key, 'cancelled'), 'cancelled')
    }
  })

  await t.test('getStatusBadge provides matching badge variants and labels', () => {
    const placed = getStatusBadge('placed')
    assert.equal(placed.variant, 'warning')
    assert.equal(placed.label, 'Placed')

    const ready = getStatusBadge('ready')
    assert.equal(ready.variant, 'success')
    assert.equal(ready.label, 'Ready for Pickup')

    const cancelled = getStatusBadge('cancelled')
    assert.equal(cancelled.variant, 'danger')
    assert.equal(cancelled.label, 'Cancelled')
  })

  await t.test('buildStatusNotification formats order status notifications accurately', () => {
    const fakeOrder = {
      _id: '6720f4c28f0923019800a123',
      status: 'ready',
      shopId: { name: 'Campus Canteen' },
    }

    const notif = buildStatusNotification(fakeOrder)
    assert.equal(notif.orderId, '6720f4c28f0923019800a123')
    assert.equal(notif.status, 'ready')
    assert.match(notif.title, /Ready for Pickup/)
    assert.match(notif.message, /Campus Canteen/)
  })
})

