const test = require('node:test')
const assert = require('node:assert/strict')

test('QR Pickup Card & Utilities Logic', async (t) => {
  const {
    encodeQr,
    matrixToSvgPath,
    getPickupInstruction,
    getShortOrderId,
    VERSION_TABLE,
  } = await import('../frontend/src/utils/qrCode.js')

  await t.test('VERSION_TABLE contains versions 1 to 6 configurations', () => {
    for (let v = 1; v <= 6; v++) {
      assert.ok(VERSION_TABLE[v], `Version ${v} table missing`)
      assert.ok(VERSION_TABLE[v].L, `Version ${v} Level L missing`)
      assert.ok(VERSION_TABLE[v].M, `Version ${v} Level M missing`)
      assert.ok(VERSION_TABLE[v].Q, `Version ${v} Level Q missing`)
      assert.ok(VERSION_TABLE[v].H, `Version ${v} Level H missing`)
    }
  })

  await t.test('encodeQr returns null for empty or invalid inputs', () => {
    assert.equal(encodeQr(null), null)
    assert.equal(encodeQr(undefined), null)
    assert.equal(encodeQr(''), null)
    assert.equal(encodeQr('   '), null)
  })

  await t.test('encodeQr encodes a 24-character hex MongoDB Order ID correctly', () => {
    const orderId = '6720f4c28f0923019800a123'
    const qr = encodeQr(orderId, 'M')

    assert.ok(qr, 'QR generation should succeed')
    assert.equal(typeof qr.version, 'number')
    assert.ok(qr.version >= 1 && qr.version <= 6)
    assert.equal(qr.size, 17 + 4 * qr.version)
    assert.equal(qr.matrix.length, qr.size)
    assert.equal(qr.matrix[0].length, qr.size)

    // Verify 7x7 finder pattern in top-left corner
    const expectedTopLeft = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ]

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        assert.equal(
          qr.matrix[r][c],
          expectedTopLeft[r][c],
          `Mismatch at top-left finder pattern [${r}, ${c}]`
        )
      }
    }

    // Verify top-right finder pattern
    const trCol = qr.size - 7
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        assert.equal(
          qr.matrix[r][trCol + c],
          expectedTopLeft[r][c],
          `Mismatch at top-right finder pattern [${r}, ${c}]`
        )
      }
    }

    // Verify bottom-left finder pattern
    const blRow = qr.size - 7
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        assert.equal(
          qr.matrix[blRow + r][c],
          expectedTopLeft[r][c],
          `Mismatch at bottom-left finder pattern [${r}, ${c}]`
        )
      }
    }
  })

  await t.test('matrixToSvgPath generates crisp single-path SVG coordinates', () => {
    const dummyMatrix = [
      [1, 0],
      [0, 1],
    ]
    const path = matrixToSvgPath(dummyMatrix, 4)
    assert.equal(path, 'M4,4h1v1h-1z M5,5h1v1h-1z')

    assert.equal(matrixToSvgPath(null), '')
    assert.equal(matrixToSvgPath([]), '')
  })

  await t.test('getPickupInstruction classifies order statuses accurately', () => {
    const ready = getPickupInstruction('ready')
    assert.equal(ready.isReady, true)
    assert.equal(ready.isCompleted, false)
    assert.equal(ready.isCancelled, false)
    assert.match(ready.instruction, /counter/i)
    assert.equal(ready.badgeVariant, 'success')

    const completed = getPickupInstruction('completed')
    assert.equal(completed.isReady, false)
    assert.equal(completed.isCompleted, true)
    assert.equal(completed.isCancelled, false)
    assert.match(completed.instruction, /picked up/i)

    const cancelled = getPickupInstruction('cancelled')
    assert.equal(cancelled.isReady, false)
    assert.equal(cancelled.isCompleted, false)
    assert.equal(cancelled.isCancelled, true)
    assert.equal(cancelled.badgeVariant, 'danger')

    const preparing = getPickupInstruction('preparing')
    assert.equal(preparing.isReady, false)
    assert.match(preparing.instruction, /preparing/i)
    assert.equal(preparing.badgeVariant, 'warning')

    const placed = getPickupInstruction('placed')
    assert.equal(placed.isReady, false)
    assert.equal(placed.badgeVariant, 'warning')

    const confirmed = getPickupInstruction('confirmed')
    assert.equal(confirmed.isReady, false)
    assert.equal(confirmed.badgeVariant, 'info')
  })

  await t.test('getShortOrderId formats MongoDB IDs into uppercase short hashes', () => {
    assert.equal(
      getShortOrderId('6720f4c28f0923019800a123'),
      '#00A123'
    )
    assert.equal(getShortOrderId(''), '')
    assert.equal(getShortOrderId(null), '')
    assert.equal(getShortOrderId(undefined), '')
  })
})

