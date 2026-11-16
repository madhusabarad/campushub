/**
 * CampusHub QR Code Utilities for Digital Counter Pickup Passes
 *
 * Implements ISO/IEC 18004 compliant QR Code generation in pure JavaScript
 * with zero external dependencies. Supports versions 1-6 with Reed-Solomon
 * error correction over GF(256), data masking, and SVG path rendering.
 */

// ── Galois Field GF(256) Math ──────────────────────────────────────────────
const GF256 = (() => {
  const exp = new Uint8Array(512)
  const log = new Uint8Array(256)
  let x = 1
  for (let i = 0; i < 255; i++) {
    exp[i] = x
    exp[i + 255] = x
    log[x] = i
    x <<= 1
    if (x & 256) x ^= 0x11d
  }
  return {
    mul: (a, b) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]),
    exp,
    log,
  }
})()

// ── Standard QR Version Configuration (Versions 1 - 6) ─────────────────────
export const VERSION_TABLE = {
  1: {
    L: { total: 26, data: 19, ecPerBlock: 7, g1Blocks: 1, g1Data: 19, g2Blocks: 0, g2Data: 0 },
    M: { total: 26, data: 16, ecPerBlock: 10, g1Blocks: 1, g1Data: 16, g2Blocks: 0, g2Data: 0 },
    Q: { total: 26, data: 13, ecPerBlock: 13, g1Blocks: 1, g1Data: 13, g2Blocks: 0, g2Data: 0 },
    H: { total: 26, data: 9, ecPerBlock: 17, g1Blocks: 1, g1Data: 9, g2Blocks: 0, g2Data: 0 },
  },
  2: {
    L: { total: 44, data: 34, ecPerBlock: 10, g1Blocks: 1, g1Data: 34, g2Blocks: 0, g2Data: 0 },
    M: { total: 44, data: 28, ecPerBlock: 16, g1Blocks: 1, g1Data: 28, g2Blocks: 0, g2Data: 0 },
    Q: { total: 44, data: 22, ecPerBlock: 22, g1Blocks: 1, g1Data: 22, g2Blocks: 0, g2Data: 0 },
    H: { total: 44, data: 16, ecPerBlock: 28, g1Blocks: 1, g1Data: 16, g2Blocks: 0, g2Data: 0 },
  },
  3: {
    L: { total: 70, data: 55, ecPerBlock: 15, g1Blocks: 1, g1Data: 55, g2Blocks: 0, g2Data: 0 },
    M: { total: 70, data: 44, ecPerBlock: 26, g1Blocks: 1, g1Data: 44, g2Blocks: 0, g2Data: 0 },
    Q: { total: 70, data: 34, ecPerBlock: 18, g1Blocks: 2, g1Data: 17, g2Blocks: 0, g2Data: 0 },
    H: { total: 70, data: 26, ecPerBlock: 22, g1Blocks: 2, g1Data: 13, g2Blocks: 0, g2Data: 0 },
  },
  4: {
    L: { total: 100, data: 80, ecPerBlock: 20, g1Blocks: 1, g1Data: 80, g2Blocks: 0, g2Data: 0 },
    M: { total: 100, data: 64, ecPerBlock: 18, g1Blocks: 2, g1Data: 32, g2Blocks: 0, g2Data: 0 },
    Q: { total: 100, data: 48, ecPerBlock: 26, g1Blocks: 2, g1Data: 24, g2Blocks: 0, g2Data: 0 },
    H: { total: 100, data: 36, ecPerBlock: 16, g1Blocks: 4, g1Data: 9, g2Blocks: 0, g2Data: 0 },
  },
  5: {
    L: { total: 134, data: 108, ecPerBlock: 26, g1Blocks: 1, g1Data: 108, g2Blocks: 0, g2Data: 0 },
    M: { total: 134, data: 86, ecPerBlock: 24, g1Blocks: 2, g1Data: 43, g2Blocks: 0, g2Data: 0 },
    Q: { total: 134, data: 62, ecPerBlock: 18, g1Blocks: 2, g1Data: 15, g2Blocks: 2, g2Data: 16 },
    H: { total: 134, data: 46, ecPerBlock: 22, g1Blocks: 2, g1Data: 11, g2Blocks: 2, g2Data: 12 },
  },
  6: {
    L: { total: 172, data: 136, ecPerBlock: 28, g1Blocks: 2, g1Data: 68, g2Blocks: 0, g2Data: 0 },
    M: { total: 172, data: 108, ecPerBlock: 16, g1Blocks: 4, g1Data: 27, g2Blocks: 0, g2Data: 0 },
    Q: { total: 172, data: 76, ecPerBlock: 24, g1Blocks: 4, g1Data: 19, g2Blocks: 0, g2Data: 0 },
    H: { total: 172, data: 60, ecPerBlock: 28, g1Blocks: 4, g1Data: 15, g2Blocks: 0, g2Data: 0 },
  },
}

const ALIGNMENT_PATTERN_POS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
}

function getRsGeneratorPoly(eccLen) {
  let gen = [1]
  for (let i = 0; i < eccLen; i++) {
    const next = new Array(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= GF256.mul(gen[j], GF256.exp[i])
      next[j + 1] ^= gen[j]
    }
    gen = next
  }
  return gen
}

function calculateEcc(data, eccLen, gen) {
  const res = new Array(eccLen).fill(0)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0]
    res.shift()
    res.push(0)
    if (factor !== 0) {
      for (let j = 0; j < eccLen; j++) {
        res[j] ^= GF256.mul(gen[gen.length - 2 - j], factor)
      }
    }
  }
  return res
}

/**
 * Encodes text into a standard QR code matrix.
 *
 * @param {string} text - Payload string to encode (e.g. order ID)
 * @param {'L'|'M'|'Q'|'H'} ecLevel - Error correction level (default 'M')
 * @returns {{ matrix: number[][], size: number, version: number } | null}
 */
export function encodeQr(text, ecLevel = 'M') {
  if (text === null || text === undefined) return null
  const str = String(text).trim()
  if (!str) return null

  const bytes = new TextEncoder().encode(str)

  // Select minimum suitable version
  let version = 1
  while (version <= 6) {
    const info = VERSION_TABLE[version][ecLevel]
    if (bytes.length <= info.data - 2) {
      break
    }
    version++
  }
  if (version > 6) version = 6

  const versionInfo = VERSION_TABLE[version][ecLevel]
  const size = 17 + 4 * version

  // 1. Bit buffer
  const bits = []
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1)
    }
  }

  // Byte mode indicator: 0100 (4 bits)
  pushBits(0b0100, 4)
  // Character count: 8 bits (for versions 1-9 in byte mode)
  pushBits(bytes.length, 8)
  // Data bytes
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8)
  }

  // Terminator (up to 4 zeroes)
  const maxBits = versionInfo.data * 8
  const termLen = Math.min(4, Math.max(0, maxBits - bits.length))
  pushBits(0, termLen)

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11]
  let padIdx = 0
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8)
    padIdx++
  }

  // Convert bits to data codewords
  const dataCodewords = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b]
    }
    dataCodewords.push(byte)
  }

  // Partition into RS blocks and calculate ECC
  const gen = getRsGeneratorPoly(versionInfo.ecPerBlock)
  const blocks = []
  const ecBlocks = []
  let offset = 0

  for (let b = 0; b < versionInfo.g1Blocks; b++) {
    const slice = dataCodewords.slice(offset, offset + versionInfo.g1Data)
    offset += versionInfo.g1Data
    blocks.push(slice)
    ecBlocks.push(calculateEcc(slice, versionInfo.ecPerBlock, gen))
  }
  for (let b = 0; b < versionInfo.g2Blocks; b++) {
    const slice = dataCodewords.slice(offset, offset + versionInfo.g2Data)
    offset += versionInfo.g2Data
    blocks.push(slice)
    ecBlocks.push(calculateEcc(slice, versionInfo.ecPerBlock, gen))
  }

  // Interleave data codewords
  const finalCodewords = []
  const maxBlockLen = Math.max(versionInfo.g1Data, versionInfo.g2Data || 0)
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].length) {
        finalCodewords.push(blocks[b][i])
      }
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < versionInfo.ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      finalCodewords.push(ecBlocks[b][i])
    }
  }

  // Initialize matrix and function mask
  const matrix = Array.from({ length: size }, () => new Array(size).fill(0))
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false))

  function setFunctionModule(r, c, val) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0
      isFunction[r][c] = true
    }
  }

  // Place 3 Finder patterns (7x7) + separators
  function addFinderPattern(startR, startC) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startR + r
        const col = startC + c
        if (row < 0 || row >= size || col < 0 || col >= size) continue
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          setFunctionModule(row, col, 1)
        } else {
          setFunctionModule(row, col, 0)
        }
      }
    }
  }

  addFinderPattern(0, 0)
  addFinderPattern(0, size - 7)
  addFinderPattern(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0 ? 1 : 0)
    setFunctionModule(i, 6, i % 2 === 0 ? 1 : 0)
  }

  // Alignment patterns
  const alignPos = ALIGNMENT_PATTERN_POS[version] || []
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i]
      const c = alignPos[j]
      if (
        (r <= 8 && c <= 8) ||
        (r <= 8 && c >= size - 9) ||
        (r >= size - 9 && c <= 8)
      ) {
        continue
      }
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const val =
            Math.abs(dy) === 2 || Math.abs(dx) === 2 || (dy === 0 && dx === 0)
              ? 1
              : 0
          setFunctionModule(r + dy, c + dx, val)
        }
      }
    }
  }

  // Dark module
  setFunctionModule(4 * version + 9, 8, 1)

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, 0)
      setFunctionModule(i, 8, 0)
    }
  }
  for (let i = size - 8; i < size; i++) {
    setFunctionModule(8, i, 0)
    setFunctionModule(i, 8, 0)
  }

  // Place data bits in 2-column zig-zag
  const dataBits = []
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push((byte >> i) & 1)
    }
  }

  let bitIdx = 0
  let upwards = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--
    const rows = []
    if (upwards) {
      for (let r = size - 1; r >= 0; r--) rows.push(r)
    } else {
      for (let r = 0; r < size; r++) rows.push(r)
    }

    for (const r of rows) {
      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r][c]) {
          matrix[r][c] = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0
        }
      }
    }
    upwards = !upwards
  }

  // 8 standard mask pattern functions
  const maskFns = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ]

  // Evaluate penalty to pick best mask
  let bestMask = 0
  let bestScore = Infinity

  for (let mask = 0; mask < 8; mask++) {
    const testMatrix = matrix.map((row, r) =>
      row.map((val, c) => (isFunction[r][c] ? val : val ^ (maskFns[mask](r, c) ? 1 : 0)))
    )
    let score = 0
    for (let r = 0; r < size; r++) {
      let run = 1
      for (let c = 1; c < size; c++) {
        if (testMatrix[r][c] === testMatrix[r][c - 1]) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
      if (run >= 5) score += run - 2
    }
    for (let c = 0; c < size; c++) {
      let run = 1
      for (let r = 1; r < size; r++) {
        if (testMatrix[r][c] === testMatrix[r - 1][c]) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
      if (run >= 5) score += run - 2
    }
    if (score < bestScore) {
      bestScore = score
      bestMask = mask
    }
  }

  // Apply best mask
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && maskFns[bestMask](r, c)) {
        matrix[r][c] ^= 1
      }
    }
  }

  // Compute format information
  const ecBitsMap = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 }
  const ecBits = ecBitsMap[ecLevel]
  const formatData = (ecBits << 3) | bestMask

  // BCH (15, 5) code calculation
  let rem = formatData << 10
  const genBch = 0x537
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= genBch << (i - 10)
    }
  }
  const formatCode = ((formatData << 10) | rem) ^ 0x5412

  const fmtBits = []
  for (let i = 0; i < 15; i++) {
    fmtBits.push((formatCode >> i) & 1)
  }

  // Placement around top-left finder
  const coords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8],
    [2, 8], [1, 8], [0, 8],
  ]
  for (let i = 0; i < 15; i++) {
    matrix[coords1[i][0]][coords1[i][1]] = fmtBits[i]
  }

  // Placement across bottom-left and top-right
  const coords2 = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ]
  for (let i = 0; i < 15; i++) {
    matrix[coords2[i][0]][coords2[i][1]] = fmtBits[i]
  }

  return { matrix, size, version }
}

/**
 * Converts a QR boolean matrix to an optimized single SVG path `d` string.
 *
 * @param {number[][]} matrix
 * @param {number} padding - quiet zone margin in modules
 * @returns {string} SVG path string
 */
export function matrixToSvgPath(matrix, padding = 4) {
  if (!matrix || !matrix.length) return ''
  const size = matrix.length
  let path = ''
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        path += `M${c + padding},${r + padding}h1v1h-1z `
      }
    }
  }
  return path.trim()
}

/**
 * Returns formatted pickup instructions and states for any given order status.
 *
 * @param {string} status - 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
 * @returns {{
 *   title: string,
 *   instruction: string,
 *   subtext: string,
 *   actionLabel: string,
 *   badgeVariant: 'warning'|'info'|'success'|'danger'|'default',
 *   isReady: boolean,
 *   isCompleted: boolean,
 *   isCancelled: boolean,
 *   icon: string,
 *   boxClasses: string
 * }}
 */
export function getPickupInstruction(status) {
  const norm = (status || '').toLowerCase().trim()
  switch (norm) {
    case 'ready':
      return {
        title: 'Ready for Pickup!',
        instruction: 'Show this QR code at the counter to verify and collect your order.',
        subtext: 'Your food is hot, packed, and waiting at the counter.',
        actionLabel: 'Collect at Counter',
        badgeVariant: 'success',
        isReady: true,
        isCompleted: false,
        isCancelled: false,
        icon: '🔔',
        boxClasses: 'border-success/30 bg-success/10 text-success',
      }
    case 'completed':
      return {
        title: 'Order Completed',
        instruction: 'This order has already been picked up from the counter.',
        subtext: 'Fulfilled & collected successfully.',
        actionLabel: 'Picked Up',
        badgeVariant: 'success',
        isReady: false,
        isCompleted: true,
        isCancelled: false,
        icon: '✓',
        boxClasses: 'border-border bg-background/60 text-muted-text',
      }
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        instruction: 'This order was cancelled and cannot be collected at the counter.',
        subtext: 'Cancelled order.',
        actionLabel: 'Cancelled',
        badgeVariant: 'danger',
        isReady: false,
        isCompleted: false,
        isCancelled: true,
        icon: '✕',
        boxClasses: 'border-danger/30 bg-danger/10 text-danger',
      }
    case 'preparing':
      return {
        title: 'Kitchen is Preparing',
        instruction: 'Preparing your meal. Present this QR code at the counter once marked Ready.',
        subtext: 'Food preparation in progress.',
        actionLabel: 'Preparing',
        badgeVariant: 'warning',
        isReady: false,
        isCompleted: false,
        isCancelled: false,
        icon: '🍳',
        boxClasses: 'border-warning/30 bg-warning/10 text-warning',
      }
    case 'confirmed':
      return {
        title: 'Order Confirmed',
        instruction: 'Outlet accepted your order. Present this digital QR pass upon counter pickup.',
        subtext: 'Accepted by outlet.',
        actionLabel: 'Confirmed',
        badgeVariant: 'info',
        isReady: false,
        isCompleted: false,
        isCancelled: false,
        icon: '✓',
        boxClasses: 'border-blue-500/30 bg-blue-500/10 text-blue-800',
      }
    case 'placed':
    default:
      return {
        title: 'Order Placed',
        instruction: 'Show this QR code at the counter once your order is ready for pickup.',
        subtext: 'Waiting for outlet confirmation.',
        actionLabel: 'Placed',
        badgeVariant: 'warning',
        isReady: false,
        isCompleted: false,
        isCancelled: false,
        icon: '📝',
        boxClasses: 'border-border bg-background/60 text-muted-text',
      }
  }
}

/**
 * Returns formatted short ID e.g. #A123 or empty string.
 */
export function getShortOrderId(orderId) {
  if (!orderId || typeof orderId !== 'string') return ''
  return `#${orderId.slice(-6).toUpperCase()}`
}

