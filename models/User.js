const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ['student', 'shopkeeper', 'admin'],
    required: true
  },
  collegeId: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
