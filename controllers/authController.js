
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── Register ────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Public registration is restricted to student accounts.
const register = async (req, res) => {
  try {
    const { name, email, password, collegeId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({
        message: 'Please provide name, email, password, and collegeId.',
      });
    }

    // Prevent public users from creating privileged accounts
    if (req.body.role && req.body.role !== 'student') {
      return res.status(403).json({
        message: 'Public registration is only available for student accounts.',
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    // User model pre-save hook handles password hashing.
    // Always create a student account through public registration
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      collegeId,
    });

    // Return sanitised user (no password)
    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Mongoose duplicate-key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    console.error('Register error:', error);

    return res.status(500).json({
      message: 'Server error during registration.',
    });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password.',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Server error during login.',
    });
  }
};

module.exports = { register, login };
