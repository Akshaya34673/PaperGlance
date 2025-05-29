//routes/contact.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Contact schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: {
    type: Date,
    default: Date.now
  }
});

// Model
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// POST /api/contact
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Trim and validate
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await contact.save();
    res.status(201).send({ message: "Message saved successfully!" });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
