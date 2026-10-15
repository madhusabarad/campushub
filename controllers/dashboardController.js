const User = require('../models/User');

/**
 * @desc    Get logged-in user's dashboard info
 * @route   GET /api/dashboard
 * @access  Private (requires valid JWT)
 */
const getDashboard = async (req, res) => {
  try {
    // req.user.id is injected by the protect middleware
    const user = await User.findById(req.user.id).select('name email role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboard };
