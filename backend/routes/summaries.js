const express = require('express');
const router = express.Router();
const Summary = require('../models/summary');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get('/', verifyToken, async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching summaries:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, content, doi, summary_length } = req.body;
    if (!title && !req.file) {
      return res.status(400).json({ error: 'Title or file is required' });
    }

    const summary = new Summary({
      userId: req.user.id,
      title: title || req.file?.filename || 'Untitled Summary',
      content: content || 'Summary processing not implemented yet.',
      pdfUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      doi,
      chat_history: [],
    });

    if (summary_length) {
      summary.content = `Mock summary (length: ${summary_length}). Replace this with actual summarization logic.`;
    }

    await summary.save();
    res.status(201).json(summary);
  } catch (error) {
    console.error('Error creating summary:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create summary' });
  }
});

router.post('/:id/chat', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const summary = await Summary.findOne({ _id: id, userId: req.user.id });
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found or not authorized' });
    }

    summary.chat_history.push({ question, answer });
    await summary.save();
    res.json(summary);
  } catch (error) {
    console.error('Error updating chat history:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update chat history' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await Summary.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found or not authorized' });
    }
    res.json({ message: 'Summary deleted successfully' });
  } catch (error) {
    console.error('Error deleting summary:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete summary' });
  }
});

router.post('/download-summary', verifyToken, async (req, res) => {
  try {
    const { summary_text } = req.body;
    if (!summary_text) {
      return res.status(400).json({ error: 'Summary text is required' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=research_summary.pdf');
    res.send(Buffer.from(`Mock PDF content for: ${summary_text}`));
  } catch (error) {
    console.error('Error downloading summary:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to download summary' });
  }
});

module.exports = router;