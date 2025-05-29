//routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth'); // or authMiddleware, match your import

// GET user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // safer fallback
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const user = await User.findById(userId).select('-password'); // exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// UPDATE user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const { username, email, name, bio } = req.body; // add bio if you want to update it

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, name, bio },
      { new: true }
    ).select('-password'); // exclude password

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
