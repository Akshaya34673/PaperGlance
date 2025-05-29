const express = require('express');
const History = require('../models/History');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/history - get upload history for logged-in user only
router.get('/', verifyToken, async (req, res) => {
  try {
    // Filter history by the logged-in user's ID
    const histories = await History.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(histories);
  } catch (error) {
    console.error('Error fetching history:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;