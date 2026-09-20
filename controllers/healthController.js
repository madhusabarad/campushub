/**
 * @desc    Health check
 * @route   GET /api/health
 * @access  Public
 */
const healthCheck = (req, res) => {
  res.status(200).json({ status: 'ok' });
};

module.exports = { healthCheck };
