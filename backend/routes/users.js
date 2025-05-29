// routes/users.js
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/authMiddleware');

console.log('verifyToken in users.js:', verifyToken); // Should log a function

// Route: POST /api/users (Register new user)
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).send({ message: 'All fields are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).send({ message: 'User with given email already exists!' });

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashPassword,
    });

    await newUser.save();
    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// GET /api/users/profile (Protected Route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// PUT /api/users/update-profile (Protected Route to update user profile)
router.put('/update-profile', verifyToken, async (req, res) => {
  const { username, email, bio } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send({ message: 'User not found' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    res.status(200).send({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

module.exports = router;