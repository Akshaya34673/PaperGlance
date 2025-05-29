// backend/routes/auth.js
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Standard Login
router.post("/", async (req, res) => {
  try {
    console.log("Login request body:", req.body);

    const { error } = validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(401).send({ message: "Invalid Username or Password" });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send({ message: "Invalid Username or Password" });

    const token = jwt.sign({ id: user._id }, process.env.JWTPRIVATEKEY, { expiresIn: "1h" });
    console.log("Generated token:", token);
    res.status(200).send({ data: token, message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

const validate = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().label("Username"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data);
};

// Google Login Route
router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create user WITHOUT password field since schema accepts that when googleId exists
      user = await User.create({
        username: name,
        email,
        googleId: sub,
      });
    }

    const appToken = jwt.sign({ id: user._id }, process.env.JWTPRIVATEKEY, {
      expiresIn: "1h",
    });

    res.status(200).send({ data: appToken, message: "Google login successful" });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).send({ message: "Invalid Google token" });
  }
});

module.exports = router;
